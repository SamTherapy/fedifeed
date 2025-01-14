import { compile } from "ejs";
import { readFileSync } from "fs";
let template = compile(readFileSync("./lib/template.ejs", "utf8"));
import { format } from "timeago.js";

// get JSON for an AP URL, by either fetching it or grabbing it from a cache.

// note: rejects on HTTP 4xx or 5xx
async function apGet(url) {
  return new Promise(function (resolve, reject) {
    // fail early
    if (!url) {
      reject(new Error("URL is invalid"));
    }

    fetch(url, {
      headers: {
        Accept: "application/activity+json",
        "User-Agent":
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return reject(response);
      })
      .then(resolve)
      .catch(reject);
  });
}

// like Promise.all except returns null on error instead of failing all the promises
async function promiseSome(proms) {
  function noRejectWrap(prom) {
    return new Promise(function (resolve) {
      prom // it's already been called
        .then(resolve)
        .catch(() => {
          resolve(null);
        });
    });
  }

  return Promise.all(proms.map(noRejectWrap));
}

export default async function (opts) {
  let feedUrl = opts.feedUrl;
  let userUrl = opts.userUrl;
  let isIndex = false;

  if (!userUrl) {
    throw new Error("need user URL");
  }

  let user, feed;

  // get user and feed in parallel if I have both URLs.
  // can cache feed aggressively since it is a specific start and end.
  if (userUrl && feedUrl) {
    [user, feed] = await Promise.all([apGet(userUrl), apGet(feedUrl)]);
  } else {
    // get user, then outbox, then feed

    user = await apGet(userUrl);
    isIndex = true;
    let outbox = await apGet(user.outbox);

    // outbox.first can be a string for a URL, or an object with stuffs in it
    if (typeof outbox.first === "object") {
      feed = outbox.first;
    } else {
      feed = await apGet(outbox.first);
    }
  }

  let templateData = {
    opts: opts, // from the request
    meta: metaForUser(user),
    items: await itemsForFeed(opts, user, feed),
    nextPageLink: getNextPage(opts, user, feed),
    isIndex: isIndex,
  };

  return template(templateData);
}

function metaForUser(user) {
  return {
    avatar: user.icon && user.icon.url ? user.icon.url : null,
    headerImage: user.image && user.image.url ? user.image.url : null,
    title: user.name || user.preferredUsername || null,
    description: user.summary || null,
    link: user.url || "#",
  };
}

async function itemsForFeed(opts, user, feed) {
  let items = feed.orderedItems;

  if (opts.boosts) {
    // yes, I have to fetch all the fucking boosts for this whole feed apparently >:/
    let boostData = [];
    let boostUrls = feed.orderedItems
      .filter((i) => i.type === "Announce")
      .map((i) => i.object);

    boostData = await promiseSome(boostUrls.map(apGet));

    // now get user data for each of those
    let userData = await promiseSome(
      boostData.map((d) => (d ? d.attributedTo || "" : null)).map(apGet)
    );

    // put a ._userdata key on the item object if this is a boost
    for (let i = 0; i < boostData.length; i++) {
      if (userData[i] && boostData[i]) {
        boostData[i]._userdata = userData[i];
      }
    }

    // some URLs may have failed but IDGAF

    boostData.forEach((boostToot) => {
      if (!boostToot) {
        // failed request
        return;
      }

      // inject in-place into items

      let index = -1;
      for (let i = 0; i < items.length; i++) {
        if (items[i].object === boostToot.id) {
          index = i;
          break;
        }
      }

      if (index === -1) {
        console.warn(`warning: couldn't match boost to item:  ${boostToot}`);
        return;
      }

      boostToot.object = boostToot; // this lets the later stage parser access object without errors :)
      items[index] = boostToot;
    });
  }

  return items
    .filter((item) => {
      return typeof item.object === "object"; // handle weird cases
    })
    .map((item) => {
      let enclosures = (item.object.attachment || [])
        .filter((a) => {
          return a.type === "Document";
        })
        .map((a) => {
          return {
            name: a.name,
            type: a.mediaType,
            url: a.url,
          };
        });

      let op = item._userdata ? item._userdata : user;

      let content =
        item.object && item.object.content ? item.object.content : ""; //TODO sanitize then render without entity escapes

      item.object.tag.forEach((tag) => {
        if (tag.type === "Emoji") {
          content = content.replaceAll(
            tag.name,
            `<img src="${tag.icon.url}" alt="${tag.name}" title="${tag.name}" width="32" height="32"/>`
          );
        }
      });

      return {
        isBoost: !!item._userdata,
        title: item._userdata
          ? user.preferredUsername +
            " shared a status by " +
            op.preferredUsername
          : "",
        isReply: !!(item.object && item.object.inReplyTo),
        hasCw: item.object.sensitive || false,
        cw: item.object.summary,
        content: content,
        atomHref: item.published
          ? item.published.replace(/\W+/g, "")
          : Math.random().toString().replace("./g", ""), // used for IDs
        enclosures: enclosures,
        stringDate: item.published
          ? getTimeDisplay(Date.parse(item.published))
          : "",
        permalink: item.object.id ? item.object.id : "#",
        author: {
          uri: op.url, // link to author page
          avatar: op.icon && op.icon.url ? op.icon.url : "",
          displayName: op.name || op.preferredUsername,
          fullName: op.preferredUsername + "@" + new URL(op.url).hostname,
        },
      };
    });
}

function getNextPage(opts, _user, feed) {
  //based on  feed.next
  if (!feed.next) {
    return null;
  }
  // take feed.next, uriencode it, then take user url, then take options.mastofeedUrl
  //let base = opts.mastofeedUrl.slice(0,opts.mastofeedUrl.indexOf("?"));

  let ret =
    "/api/v1/feed?userurl=" +
    encodeURIComponent(opts.userUrl) +
    "&feedurl=" +
    encodeURIComponent(feed.next) +
    "&instance_type=" +
    opts.instance_type;

  // add other params to the end
  ["theme", "header", "size", "boosts", "replies"].forEach((k) => {
    if (typeof opts[k] !== "undefined") {
      ret += `&${k}=${opts[k].toString()}`;
    }
  });
  return ret;
}

// utilities below

function getTimeDisplay(d) {
  if (typeof d !== "object") {
    d = new Date(d);
  }
  // convert to number
  let dt = d.getTime();
  let now = Date.now();

  let delta = now - dt;

  // over 6 days ago
  if (delta > 1000 * 60 * 60 * 24 * 6) {
    return isoDateToEnglish(d.toISOString());
  } else {
    return format(dt);
  }
}

function isoDateToEnglish(d) {
  let dt = d.split(/[t-]/gi);
  let months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return months[Number(dt[1]) - 1] + " " + dt[2] + ", " + dt[0];
}
