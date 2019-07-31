## 自动为promise添加catch方法
> 可选：为 **方法声明** | **类方法** 自动添加try-catch。开启此选项会导致try-catch多重嵌套，增加代码体积，默认关闭，需手动开启

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
import {report} from 'xxx'

function Foo(){
  try{
    console.log('Im foo')
  }catch (e) {
    console.error(e)
  }
  
}
promise().then(res => {}).catch(err => {
    report(err);
});
```

### start
```bash
yarn add babel-plugin-promise-catcher --dev
```
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
                  plugins:[
                    ['babel-plugin-promise-catcher',{
                        import:{
                          name:'reportInfo', // 引入的上报方法
                          source:'./reportService', // 方法地址
                          isDefault:true // 是否为默认引入
                          },
                        functionCatch:false, // 为方法自动添加try-catch 默认为false
                        promiseCatch:true, // 为promise.then 自动添加 try-catch 默认为true
                        info:{ // 错误上报信息，默认全为true
                          fileName:true,
                          line:true
                          },
                        ignoreFiles:['reportService.js']
                  }]
                  ]
                },
              }
            ],
          }
        ]
  }
```
### option
- import:object 错误处理方法信息
    - name:string 方法名
    - source:string 路径
    - isDefault:boolean
        - true: import report from 'xxx'
        - false import {report} from 'xx'
        
- reportFn:string 全局错误处理方法，需在入口文件声明，和import同时存在时此选项失效
- functionCatch:boolean 为方法自动添加try-catch 默认为false
- promiseCatch:boolean 为promise.then 自动添加 try-catch 默认为true
- info // 上报信息
    - fileName:boolean 是否上报文件名
    - line:boolean 是否上报行号
- ignoreFiles:Array<string> 忽略的文件名

### import 
- eg.
```jsx harmony
import:{
  name:'report', 
  source:'reportService', 
  isDefault:false 
}
```
inject statement:
```jsx harmony
import { report } from 'reportService'
```
- eg.
```jsx harmony
import:{
  name:'report', 
  source:'reportService', 
  isDefault:true 
}
```
inject statement:
```jsx harmony
import report from 'reportService'
```
使用默认配置，得到的错误信息为
```jsx harmony
reportInfo(e,['example.js', 120])
```
- e:错误
- fileName:文件名
- line:行号
