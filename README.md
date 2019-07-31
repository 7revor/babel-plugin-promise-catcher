## 自动为promise添加catch方法

### code in
```jsx harmony
function Foo(){
  console.log('Im foo')
}
promise().then((res)=>{

})

```
### code out
```jsx harmony
function Foo(){
  try{
    console.log('Im foo')
  }catch (e) {
    console.error(e)
  }
  
}
promise().then(res => {}).catch(err => {
  if (err instanceof Error) {
    console.error(err);
  }
});
```

### start
yarn add babel-plugin-promise-catcher --dev
### webpack.config.js
```jsx harmony
module: {
    rules: [
          {
            test: /\.js$/,
            exclude:/node_modules/,//排除掉node_module目录
            use:[
              {
                loader:'babel-loader',
                options:{
                  presets:['@babel/env'], //转码规则
                  plugins:['babel-plugin-promise-catcher',{
                    reportFn:'console.error', // 错误上报方法
                    functionCatch:false, // 为方法自动添加try-catch 默认为false
                    promiseCatch:true, // 为promise.then 自动添加 try-catch 默认为true
                    info:{ // 错误上报信息，默认全为true
                      fileName:true,
                      fnName:true,
                      line:true
                      }
                  }]
                },
              }
            ],
          }
        ]
  }
```
使用默认配置，得到的错误信息为
```jsx harmony
console.error(e,['fileName','fnName','line'])
```
- e:错误
- fileName:文件名
- fnName:方法名
- line:行号
