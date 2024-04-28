## Start
```bash
yarn add babel-plugin-promise-catcher --dev
```
## What did promise catcher do?
- Automatically append `.catch` to `Promise`(You can filter by directory) and report error info(customization)
- Automatically wrap `FunctionDeclaration` and  `ClassMethod` with `try-catch`,but opening this option results in `try-catch` multiple nesting.
It is recommended to filter with `functional Dirs`. Close by default and needs to be turned on manually.


## code in
```jsx harmony
function Foo(){
  console.log('Im foo')
}
promise().then((res)=>{

})

promise2().then(res=>{
  
}).catch(err=>{
  console.log('im error')
})


promise3().catch(err=>{
  console.log('im error')
})
```
## code out
```jsx harmony
import {report} from 'xxx'

function Foo(){
  try{
    console.log('Im foo')
  }catch (e) {
    report(e)
  }
  
}
promise().then(res => {}).catch(err => {
    report(err);
});

promise2().then(res=>{
  
}).catch(e=>{
  report(e)
   console.log('im error')
})

promise3().catch(err=>{
  report(e)
  console.log('im error')
})
```

## webpack.config.js
```jsx harmony
module: {
    rules: [
          {
            test: /\.js$/,
            exclude:/node_modules/,
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
                        functionDirs:['/src/'], // 方法捕获目录
                        promiseCatch:true, // 为promise.then 自动添加 try-catch 默认为true
                        promiseDirs:['/src/'], // promise 捕获目录
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
- `import:object`  Function information imported
    - `name:string` function name
    - `source:string` function path
    - `isDefault:boolean`
        - `true` : `import report from 'xxx'`
        - `false`: `import {report} from 'xx'`
        
- `reportFn:string` Error handling method,it should be declared in the entry file.If option contains import, this will fail.
- `functionCatch:boolean` default  false
- `promiseCatch:boolean` default true
- `info:object`  error info
    - `fileName:boolean` 
    - `line:boolean` 
- `ignoreFiles:Array<string>` Ignored File Name
- `promiseDirs:Array<string>` Promise capture directory
- `functionDirs:Array<string>` Function capture directory


### Attention
- `promiseDirs`and `functionDirs`have higher priority than `functionCatch` and `promiseCatch`.
in another way,if dirs are empty,then no capture is made.And if dirs are passed in, the catch option is ignored.
- ` ignoreFiles `takes precedence over `dirs`. If a file exists in the specified directory and be declared as `IgnoreFiles`, no capture is performed.
- There must be one between `import` and  `reportFn`.It is recommended to declare `reportFn` in the entry file. Use `import` in special cases.
- ` import` priority is higher than `reportFn`. If they are passed in at the same time, then the capture method is named `import.name`.


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
error handler
```jsx harmony
report(err,['example.js', 120])
```


