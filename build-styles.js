// build the styles
import { readFileSync, writeFileSync } from 'fs';
import { renderSync } from 'node-sass';

var staticDir = './static/'
var srcDir = './stylesrc/';
var themes = ['masto-light','masto-dark','masto-auto'];


themes.forEach(function(s){
  var sassFile = srcDir+s+'.scss'
  var cssFile = staticDir+s+'.css'
  var result = renderSync({
    data: readFileSync(sassFile,'utf8'),
    includePaths:[srcDir]
  });

  writeFileSync(cssFile,result.css,'utf8')

});

console.log('ok');
