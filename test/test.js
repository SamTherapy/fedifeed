// do a test


import { createReadStream, writeFileSync } from "fs";
import convert from "../lib/convert.js";

	
var r = createReadStream("./test/sample.atom");
	
convert(r,function(er,data){
    if (er){return console.log("error: ",er);}
    console.log("ok");
    writeFileSync("./test/result.html",data,"utf8");
});
