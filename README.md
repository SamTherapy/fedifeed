# Fedifeed

[![Build Status](https://ci.git.froth.zone/api/badges/Sam/fedifeed/status.svg)](https://ci.git.froth.zone/Sam/fedifeed)

Embed an activitypub feed in your blog et cetera. \
This is a fork of [mastofeed](https://github.com/fenwick67/mastofeed) that adds support for more themes and Misskey.

https://www.fedifeed.com

## User guide

The homepage has a tool for generating iframe code for you, with a sensible `sandbox` attribute. The feeds fit comfortably in a 400px wide area.

## API

### V1

#### GET `/api/v1/feed`

> example: `/api/v1/feed?userurl=https%3A%2F%2Foctodon.social%2Fusers%2Ffenwick67&scale=90&theme=masto-light`

Returns a html page which displays a feed for a user URL. Note that URLs must be URI encoded (i.e. `encodeURIComponent('https://octodon.social/users/fenwick67')` ).

Querystring options:

| option     | required | description                                                                                                                                                                                   |
| ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `userurl`  | **\***   | Mastodon/Pleroma/Misskey account URL (usually `https://${instance}/users/${username}` for MastoAPI or `https://${instance}/@${username}` for Misskey)                                         |
| `instance` | **\*\*** | Mastodon/Pleroma/Misskey instance URL (usually `https://${instance}`)                                                                                                                         |
| `user`     | **\*\*** | Mastodon/Pleroma/Misskey user ID (usually `${username}`)                                                                                                                                      |
| `feedurl`  | no       | a URL to a page of an ActivityPub post collection. Only used for pages beyond the first.                                                                                                      |
| `theme`    | no       | either `masto-dark`, `masto-light` or `masto-auto`, to select the UI theme (default is `masto-dark`). `auto` will appear masto-light unless the user sets up masto-dark mode on their device. |
| `boosts`   | no       | whether to show boosts or not                                                                                                                                                                 |
| `replies`  | no       | whether to show replies or not                                                                                                                                                                |
| `size`     | no       | the scale of the UI in percent.                                                                                                                                                               |

\* `userurl` is required if `instance` and `user` are not specified.\*\*\* \
\*\* `instance` **and** `user` are required if `userurl` is not specified.\*\*\*

\*\*\* **`userurl` and `instance`/`user` are mutually exclusive.**

## Server Installation

This is a straightforward node project with zero databases or anything, you should just be able to run `yarn install` and then `yarn start` to get up and running. Set your `PORT` environment variable to change the port it listens on.

## Improve me

Feel free to add a caching layer, improve the styles and add more features.
