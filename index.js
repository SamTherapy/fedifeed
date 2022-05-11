import Express from "express";
// v2 api
import convertv2 from "./lib/convert.js";
import serveStatic from "serve-static";
import cors from "cors";
import errorPage from "./lib/errorPage.js";
import morgan from "morgan";
import { detector } from "megalodon";
import helmet from "helmet";

const app = Express();
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    frameguard: false,
  })
);

const logger = morgan(":method :url :status via :referrer - :response-time ms");

app.use(
  serveStatic("public", {
    maxAge: "1d",
  })
);

function doCache(res, durationSecs) {
  res.set({
    "Cache-Control": "max-age=" + durationSecs,
  });
}

// this just redirects to the
app.options("/api/feed", cors());
app.get("/api/feed", cors(), logger, function (req, res) {
  // get feed url
  const feedUrl = req.query.url;
  if (!feedUrl) {
    res
      .status(400)
      .send(errorPage(400, "You need to specify a feed URL", null));
    return;
  }

  const userUrl = feedUrl.replace(/\.atom.*/i, "");

  const redirectUrl = "/api/v1/feed?";
  const qs = ["userurl=" + encodeURIComponent(userUrl), "api=v1"];

  ["size", "theme", "boosts", "replies"].forEach((key) => {
    if (typeof req.query[key] != "undefined") {
      qs.push(key + "=" + encodeURIComponent(req.query[key]));
    }
  });

  res.redirect(redirectUrl + qs.join("&"));
});

app.options("/api/v1/feed", cors());
app.get("/api/v1/feed", cors(), logger, async function (req, res) {
  // get feed url
  // userUrl
  let type = req.query.instance_type;
  let userUrl = req.query.userurl;
  if (userUrl === "" || userUrl === undefined) {
    const user = req.query.user;
    const instance = req.query.instance;
    if (type === "" || type === undefined) {
      type = await detector(instance).catch(() => "");
    }
    if (type === "mastodon" || type === "pleroma")
      userUrl = instance + "/users/" + user;
    else if (type === "misskey") userUrl = instance + "/@" + user;
    else {
      res
        .status(400)
        .send(errorPage(400, "You need to specify a user URL", null));
      return;
    }
  }

  const feedUrl = req.query.feedurl;

  const opts = {};
  if (req.query.size) {
    opts.size = req.query.size;
  }
  if (req.query.theme) {
    opts.theme = req.query.theme;
    if (opts.theme === "auto-auto") {
      switch (type) {
        case "mastodon":
          opts.theme = "masto-auto";
          break;
        case "pleroma":
          opts.theme = "pleroma";
          break;
        case "misskey":
          opts.theme = "misskey-auto";
          break;
        default:
          break;
      }
    } else if (opts.theme === "auto-light") {
      switch (type) {
        case "mastodon":
          opts.theme = "masto-light";
          break;
        case "misskey":
          opts.theme = "misskey-light";
          break;
        case "pleroma":
          opts.theme = "pleroma-light";
          break;
        default:
          break;
      }
    } else if (opts.theme === "auto-dark") {
      switch (type) {
        case "mastodon":
          opts.theme = "masto-dark";
          break;
        case "misskey":
          opts.theme = "misskey-dark";
          break;
        case "pleroma":
          opts.theme = "pleroma-dark";
          break;
        default:
          break;
      }
    }
  }
  if (req.query.header) opts.header = req.query.header.toLowerCase() === "true";
  if (req.query.boosts) opts.boosts = req.query.boosts.toLowerCase() === "true";
  if (req.query.replies)
    opts.replies = req.query.replies.toLowerCase() === "true";
  opts.instance_type = type;
  opts.userUrl = userUrl;
  opts.feedUrl = feedUrl;
  opts.mastofeedUrl = req.url;

  convertv2(opts)
    .then((data) => {
      doCache(res, 60 * 60);
      res.status(200).send(data);
    })
    .catch((er) => {
      res
        .status(500)
        .send(errorPage(500, null, { theme: opts.theme, size: opts.size }));
      // TODO log the error
      console.error(er, er.stack);
    });
});

app.listen(process.env.PORT || 8000, "127.0.0.1", function () {
  console.log("Server started, listening on " + (process.env.PORT || 8000));
});
