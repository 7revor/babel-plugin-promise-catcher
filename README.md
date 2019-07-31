## 自动为promise添加catch方法

### in
```jsx harmony
promise().then((res)=>{

})

```
### out
```jsx harmony

promise().then(res => {}).catch(err => {
  if (err instanceof Error) {
    console.log(err);
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
                  plugins:['babel-plugin-promise-catcher']
                },
              }
            ],
          }
        ]
  },
```
