## Start
```bash
yarn add babel-plugin-promise-catcher --dev
```
## What did promise catcher do?
- Automatically append `.catch` to `Promise`(You can filter by directory) and report error info(customization)
- Automatically wrap `FunctionDeclaration` and  `ClassMethod` with `try-catch`,but opening this option results in `try-catch` multiple nesting.
It is recommended to filter with `functional Dirs'. Close by default and open manually.

- 自动为**Promise**调用注入`.catch`（可筛选目录及文件），实现全局异常上报（自定义上报方法）
- 为 **方法声明** 以及 **类方法** 自动添加`try-catch`。开启此选项会导致`try-catch`多重嵌套，增加代码体积。推荐配合`functionDirs`进行筛选。默认关闭，需手动开启。


## code in
```jsx harmony
function Foo(){
  console.log('Im foo')
}
promise().then((res)=>{

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

### option 
- `import:object`  导入的方法信息
    - `name:string` 方法名
    - `source:string` 路径
    - `isDefault:boolean`
        - `true` : `import report from 'xxx'`
        - `false`: `import {report} from 'xx'`
        
- `reportFn:string` 全局错误处理方法，需在入口文件声明，和import同时存在时此选项失效
- `functionCatch:boolean` 为方法自动添加try-catch 默认为false
- `promiseCatch:boolean` 为promise.then 自动添加 try-catch 默认为true
- `info:object` // 上报信息
    - `fileName:boolean` 是否上报文件名
    - `line:boolean` 是否上报行号
- `ignoreFiles:Array<string>` 忽略的文件名
- `promiseDirs:Array<string>` promise捕获目录
- `functionDirs:Array<string>` 方法捕获目录

### Attention
- `promiseDirs`and `functionDirs`have higher priority than `functionCatch` and `promiseCatch`,in another way,
If dirs are empty,then no capture is made.And if dirs are passed in, the catch option is ignored.
- ` ignoreFiles `takes precedence over `dirs`. If a file exists in the specified directory and is declared as `IgnoreFiles`, no capture is performed.
- There must be one between `import` and  `reportFn`.It is recommended to declare `reportFn` in the entry file and use `import` in special cases.
- ` import` priority is higher than `reportFn`, if they are passed in at the same time, then the capture method is named `import.name`.

### 注意
- `promiseDirs` 和 `functionDirs` 优先级高于`functionCatch`以及`promiseCatch`,换句话说，如果dirs为空，那么则不进行任何捕获，如果传入dirs，那么则忽略catch选项直接进行捕获
- `ignoreFiles`的优先级高于`dirs`，如果一个文件即存在于指定目录又被声明为`ignoreFiles`,那么不进行捕获。
- `import`和`reportFn`必须传入一个，推荐在入口文件声明`reportFn`,特殊情况下使用`import`
- `import`优先级高于`reportFn`，如果同时传入，那么捕获方法名为`import.name`



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
- e:    error
- fileName: 文件名
- line: 行号
