import { compile } from "ejs";
import { readFileSync } from "fs";
var template = compile(readFileSync("./lib/template.ejs", "utf8"));

export default function(code,message,displayOptions){

    var msg;
    // const displayOptions = displayOptions || {};

    if (code == 500 && !message){
        msg = "<p>Sorry, we are having trouble fetching posts for this user. Please try again later.</p><br><p>If the issue persists, <a href=\"https://git.froth.zone/Sam/fedifeed/issues\">please open an issue on Gitea</a>, or message sam@froth.zone</p>";
    }else{
        msg = message||"";
    }


    var options = {
        opts:{
            header:true,
            theme:displayOptions.theme||null,
            size:displayOptions.size||null
        },
        meta:{
            title:code.toString(),
            description:msg,
            link:"#"
            // avatar:'',
            // headerImage:''
        },
        items:[],
        nextPageLink:null,
        isIndex:true
    };

    return template(options);
}