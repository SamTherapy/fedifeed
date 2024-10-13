# Mastofeed

Embed a mastodon feed in your blog et cetera.

https://www.mastofeed.com

## User guide

The homepage has a tool for generating iframe code for you, with a sensible `sandbox` attribute.  The feeds fit comfortably in a 400px wide area.

## API

### V2

#### GET `/apiv2/feed`

> example: `/api/feed?userurl=https%3A%2F%2Foctodon.social%2Fusers%2Ffenwick67&scale=90&theme=light`

Returns a html page which displays a mastodon feed for a user URL.  Note that URLs must be URI encoded (i.e. `encodeURIComponent('https://octodon.social/users/fenwick67')` ).

Querystring options:

| option | required | description |
| ------ | -------- | ----------- |
| `userurl` | **yes** | Mastodon/ActivityPub account URL (usually `https://${instance}/users/${username}`) |
| `feedurl` | no | a URL to a page of an ActivityPub post collection. Only used for pages beyond the first. |
| `theme` | no | either `dark`, `light` or `auto`, to select the UI theme (default is `dark`). `auto` will appear light unless the user sets up dark mode on their device. |
| `boosts` | no | whether to show boosts or not |
| `replies` | no | whether to show replies or not |
| `size` | no | the scale of the UI in percent. |

### V1 (deprecated, will now just redirect you to the v2 API)

#### GET `/api/feed`

> example: `/api/feed?url=https%3A%2F%2Foctodon.social%2Fusers%2Ffenwick67.atom&scale=90&theme=light`

Returns a html page which displays a mastodon feed for an atom feed URL.  Note that URLs must be URI encoded (i.e. `encodeURIComponent('https://octodon.social/users/fenwick67.atom')` ).

Querystring options:


| option | required | description |
| ------ | -------- | ----------- |
| `url` | **yes** | Mastodon Atom feed URL |
| `theme` | no | either dark, light or auto, to select the UI theme (default is dark). `auto` will appear light unless the user sets up dark mode on their device. |
| `size` | no | the scale of the UI in percent. |

## Server Installation

This is a straightforward node project with zero databases or anything, you should just be able to run `npm install` and then `npm start` to get up and running.

### ENV VARS

you need to set:

* `AP_PRIVATE_KEY_BASE64=asdfsd` Run utils/make-keys.js to make a key
* `AP_PUBLIC_KEY_BASE64=safasdf` Run utils/make-keys.js to make a key
* `DOMAIN_NAME=mastofeed.com` or whatever
* `PORT=80` or whatever
