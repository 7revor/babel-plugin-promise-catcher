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
    presets:['@babel/env'], //转码规则
    plugins: [
      '@babel/plugin-proposal-class-properties',[plugin,
        {
          reportFn:'reportInfo',
          info:{
            fileName:true,
            fnName:true,
            line:true
          }
        }]
    ],
  };
  var result = babel.transform(src, transOpts);

  fs.writeFileSync('test/out.js', result.code);

})
