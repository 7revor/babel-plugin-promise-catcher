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
    //presets:['@babel/env'], //转码规则
    plugins: [
      //'@babel/plugin-proposal-class-properties',
      [plugin,
        {
          import:{
            name:'reportInfo',
            source:'./report',
            isDefault:false
          },
          info:{
            fileName:true,
            line:true
          }
        }]
    ],
  };
  var result = babel.transform(src, transOpts);

  fs.writeFileSync('test/out.js', result.code);

})
