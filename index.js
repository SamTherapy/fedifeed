var Express = require('express');
// v2 api
var convertv2 = require('./lib/convertv2');
var serveStatic = require('serve-static');
var cors = require('cors');
var errorPage = require('./lib/errorPage');
var morgan = require('morgan');
var compression = require('compression')
const apCryptoShit = require('./lib/apCryptoShit')

var app = Express();

var logger = morgan(':method :url :status via :referrer - :response-time ms') 

app.use(compression());

app.use(
	serveStatic('static',{
		maxAge:'1d'
	})
);

function doCache(res,durationSecs){
	res.set({
		"Cache-Control":"max-age="+durationSecs
	})
}


// this just redirects to the v2 API
app.options('/api/feed',cors());
app.get('/api/feed',cors(),logger,function(req,res){

	// get feed url
	var feedUrl = req.query.url;
	if (!feedUrl){
		res.status(400);
		res.send(errorPage(400,'You need to specify a feed URL'));
		return;
	}

	var userUrl = feedUrl.replace(/\.atom.*/i,'');

	var redirectUrl = '/apiv2/feed?';
	var qs = ['userurl='+encodeURIComponent(userUrl),"api=v1"];

	(['size','theme','boosts','replies']).forEach(key=>{
		if (typeof req.query[key] != 'undefined'){
			qs.push(key+'='+encodeURIComponent(req.query[key]));
		}
	})

	res.redirect(redirectUrl + qs.join('&'));

});

app.options('/apiv2/feed',cors());
// http://localhost:8000/apiv2/feed?userurl=https%3A%2F%2Foctodon.social%2Fusers%2Ffenwick67
app.get('/apiv2/feed',cors(),logger,function(req,res){
	
	// get feed url
	var userUrl = req.query.userurl;
	if (!userUrl){
		res.status(400);
		res.send(errorPage(400,'You need to specify a user URL'));
		return;
	}

	var feedUrl = req.query.feedurl;

	var opts = {};
	if (req.query.size){
		opts.size = req.query.size;
	}
	if (req.query.theme){
		opts.theme = req.query.theme;
	}
	if (req.query.header){
		if (req.query.header.toLowerCase() == 'no' || req.query.header.toLowerCase() == 'false'){
			opts.header = false;
		}else{
			opts.header = true;
		}
	}

	opts.boosts = true;
	if (req.query.boosts){
		if (req.query.boosts.toLowerCase() == 'no' || req.query.boosts.toLowerCase() == 'false'){
			opts.boosts = false;
		}else{
			opts.boosts = true;
		}
	}

	opts.replies = true;
	if (req.query.replies){
		if (req.query.replies.toLowerCase() == 'no' || req.query.replies.toLowerCase() == 'false'){
			opts.replies = false;
		}else{
			opts.replies = true;
		}
	}
	opts.userUrl = userUrl;
	opts.feedUrl = feedUrl;
	opts.mastofeedUrl = req.url;

	convertv2(opts).then((data)=>{
		res.status(200);
		doCache(res,60*60);
		res.send(data);
	}).catch((er)=>{
		res.status(500);
		res.send(errorPage(500,er.toString(),{theme:opts.theme,size:opts.size}));
		// log the error
		console.error(er,er.stack);
	})
})

app.get('/actor', logger, function(req,res){
	// return something like what https://mastodon.social/actor does...
	res.status(200);
	let j = {
		"@context": [
		  "https://www.w3.org/ns/activitystreams",
		  "https://w3id.org/security/v1",
		  {
			"manuallyApprovesFollowers": "as:manuallyApprovesFollowers",
			"toot": "http://joinmastodon.org/ns#",
			"featured": {
			  "@id": "toot:featured",
			  "@type": "@id"
			},
			"featuredTags": {
			  "@id": "toot:featuredTags",
			  "@type": "@id"
			},
			"alsoKnownAs": {
			  "@id": "as:alsoKnownAs",
			  "@type": "@id"
			},
			"movedTo": {
			  "@id": "as:movedTo",
			  "@type": "@id"
			},
			"schema": "http://schema.org#",
			"PropertyValue": "schema:PropertyValue",
			"value": "schema:value",
			"discoverable": "toot:discoverable",
			"suspended": "toot:suspended",
			"memorial": "toot:memorial",
			"indexable": "toot:indexable",
			"attributionDomains": {
			  "@id": "toot:attributionDomains",
			  "@type": "@id"
			}
		  }
		],
		"id": `https://${apCryptoShit.getDomainName()}/actor`,
		"type": "Application",
		"inbox": `https://${apCryptoShit.getDomainName()}/actor/inbox`,
		"outbox": `https://${apCryptoShit.getDomainName()}/actor/outbox`,
		"preferredUsername": `${apCryptoShit.getDomainName()}`,
		"url": `https://${apCryptoShit.getDomainName()}`,
		"manuallyApprovesFollowers": true,
		"publicKey": {
		  "id": `https://${apCryptoShit.getDomainName()}/actor#main-key`,
		  "owner": `https://${apCryptoShit.getDomainName()}/actor`,
		  "publicKeyPem": apCryptoShit.getPublicKey()
		},
		"endpoints": {
		  "sharedInbox": `https://${apCryptoShit.getDomainName()}/inbox`
		}
	  };
	res.setHeader("content-type","application/activity+json; charset=utf-8")
	res.send(JSON.stringify(j,null,2));
})

app.get('/.well-known/webfinger', function(req,res){
	let domainName = apCryptoShit.getDomainName();
	if (req.query.resource == `acct:${domainName}@${domainName}`){
		res.setHeader("content-type","application/jrd+json; charset=utf-8");
		var resJson = {
			"subject": `acct:${domainName}@${domainName}`,
			"aliases": [
			  `https://${domainName}/actor`
			],
			"links": [
			  {
				"rel": "http://webfinger.net/rel/profile-page",
				"type": "text/html",
				"href": `https://${domainName}`
			  },
			  {
				"rel": "self",
				"type": "application/activity+json",
				"href": `https://${domainName}/actor`
			  }
			//   ,
			//   {
			// 	"rel": "http://ostatus.org/schema/1.0/subscribe",
			// 	"template": "https://mastodon.social/authorize_interaction?uri={uri}"
			//   }
			]
		  };
		return res.send(JSON.stringify(resJson));
	} else {
		res.status(404);
		res.send();
	}
})

app.listen(process.env.PORT || 8080,function(){
	console.log('Mastofeed started, listening on '+(process.env.PORT || 8080));
});
