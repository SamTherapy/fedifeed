import Express from "express";
// v2 api
import convertv2 from "./lib/convert.js";
import serveStatic from "serve-static";
import cors from "cors";
import errorPage from "./lib/errorPage.js";
import morgan from "morgan";
import { detector } from "megalodon";

const app = Express();
app.disable("x-powered-by");

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

  let userUrl = "";

  if (typeof feedUrl === "string") {
    userUrl = feedUrl.replace(/\.atom.*/i, "");
  }

  const redirectUrl = "/api/v1/feed?";
  const qs = ["userurl=" + encodeURIComponent(userUrl), "api=v1"];

  ["size", "theme", "boosts", "replies"].forEach((key) => {
    if (typeof req.query[key] !== "undefined") {
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
  if (!userUrl) {
    const user = req.query.user;
    const instance = req.query.instance;
    if (!type) {
      type = await detector(instance).catch(() => "");
    }
    switch (type) {
      case "mastodon":
      case "pleroma":
        userUrl = instance + "/users/" + user;
        break;
      case "misskey":
        userUrl = instance + "/@" + user;
        break;
      default:
        res
          .status(400)
          .send(errorPage(400, "You need to specify a user URL", null));
        return;
    }
  }

  const feedUrl = req.query.feedurl;

  const opts = {};
  opts.size = req.query.size;

  opts.theme = req.query.theme;

  opts.theme = opts.theme.replace("auto-", `${type}-`);
  opts.theme ??= "auto-auto";

  if (typeof req.query.header === "string")
    opts.header = req.query.header.toLowerCase() === "true";
  if (typeof req.query.boosts === "string")
    opts.boosts = req.query.boosts.toLowerCase() === "true";
  if (typeof req.query.replies === "string")
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
      console.error("error:", er, er.stack);
    });
});

// eslint-disable-next-line no-unused-vars
app.use(function (req, res, _next) {
  // respond with html page
  if (req.accepts("html")) {
    res.status(404).send("Not found");
    return;
  }

  // respond with json
  if (req.accepts("json")) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // default to plain-text. send()
  res.status(404).type("txt").send("Not found");
});

app.listen(process.env.PORT || 8000, "127.0.0.1", function () {
  console.log("Server started, listening on " + (process.env.PORT || 8000));
});
