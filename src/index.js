import Express from "express";
// v2 api
import convertv2 from "../lib/convert.js";
import serveStatic from "serve-static";
import cors from "cors";
import errorPage from "../lib/errorPage.js";
import morgan from "morgan";
import { detector } from "megalodon";

const app = Express();

const logger = morgan(":method :url :status via :referrer - :response-time ms");

app.use(
    serveStatic("src/public", {
        maxAge: "1d",
    }),
);

function doCache(res, durationSecs) {
    res.set({
        "Cache-Control": "max-age="+durationSecs,
    });
}


// this just redirects to the
app.options("/api/feed", cors());
app.get("/api/feed", cors(), logger, function(req, res) {
    // get feed url
    const feedUrl = req.query.url;
    if (!feedUrl) {
        res.status(400);
        res.send(errorPage(400, "You need to specify a feed URL"));
        return;
    }

    const userUrl = feedUrl.replace(/\.atom.*/i, "");

    const redirectUrl = "/api/v1/feed?";
    const qs = ["userurl="+encodeURIComponent(userUrl), "api=v1"];

    (["size", "theme", "boosts", "replies"]).forEach((key)=>{
        if (typeof req.query[key] != "undefined") {
            qs.push(key+"="+encodeURIComponent(req.query[key]));
        }
    });

    res.redirect(redirectUrl + qs.join("&"));
});

app.options("/api/v1/feed", cors());
// http://localhost:8000/api/v1/feed?userurl=https%3A%2F%2Foctodon.social%2Fusers%2Ffenwick67
app.get("/api/v1/feed", cors(), logger, async function(req, res) {
    // get feed url
    // userUrl
    let type = req.query.instance_type;
    let userUrl = "";
    if (type === "") {
        const user = req.query.user;
        const instance = req.query.instance;
        let instanceType = await detector(instance);
        if (instanceType === "mastodon" || instanceType === "pleroma") {
            userUrl = instance + "/users/" + user;
            type = instanceType;
        } else if (instanceType === "misskey") {
            userUrl = instance + "/@" + user;
            type = instanceType;
        } else {
            res.status(400);
            res.send(errorPage(400, "You need to specify a user URL"));
            return;
        }
    } else { 
        userUrl = req.query.userurl;
    }

    const feedUrl = req.query.feedurl;

    const opts = {};
    if (req.query.size) {
        opts.size = req.query.size;
    }
    if (req.query.theme) {
        opts.theme = req.query.theme;
    }
    if (req.query.header) {
        if (req.query.header.toLowerCase() == "no" || req.query.header.toLowerCase() == "false") {
            opts.header = false;
        } else {
            opts.header = true;
        }
    }
    opts.instance_type = type;
    opts.boosts = true;
    if (req.query.boosts) {
        if (req.query.boosts.toLowerCase() == "no" || req.query.boosts.toLowerCase() == "false") {
            opts.boosts = false;
        } else {
            opts.boosts = true;
        }
    }

    opts.replies = true;
    if (req.query.replies) {
        if (req.query.replies.toLowerCase() == "no" || req.query.replies.toLowerCase() == "false") {
            opts.replies = false;
        } else {
            opts.replies = true;
        }
    }
    opts.userUrl = userUrl;
    opts.feedUrl = feedUrl;
    opts.mastofeedUrl = req.url;

    convertv2(opts).then((data) => {
        res.status(200);
        doCache(res, 60 * 60);
        res.send(data);
    }).catch((er) => {
        res.status(500);
        res.send(errorPage(500, null, { theme: opts.theme, size: opts.size }));
        // TODO log the error
        console.error(er, er.stack);
    });
});

app.listen(process.env.PORT || 8000, function() {
    console.log("Server started, listening on "+(process.env.PORT || 8000));
});
