var fs = require('fs');
var babel = require('@babel/core');
const plugin = require('../index');

fs.readFile('test/in.js', function(err, data) {

  if(err) {
    throw err;
  }

  var src = data.toString();
  var transOpts = {
    filename:'in.js',
    plugins: [
      [plugin]
    ],
  };
  var result = babel.transform(src, transOpts);

  fs.writeFileSync('test/out.js', result.code);

})
