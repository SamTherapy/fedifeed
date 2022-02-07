// build the styles
import { readFileSync, writeFileSync } from "fs";
import { renderSync } from "node-sass";

let staticDir = "./src/public/";
let srcDir = "./src/stylesrc/";
let themes = ["masto-light","masto-dark","masto-auto"];


themes.forEach(function(s){
    let sassFile = srcDir+s+".scss";
    let cssFile = staticDir+s+".css";
    let result = renderSync({
        data: readFileSync(sassFile,"utf8"),
        includePaths:[srcDir]
    });

    writeFileSync(cssFile,result.css,"utf8");

});

console.log("ok");
