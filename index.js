const {promiseCatchStatement, promiseCatchEnhancer,wrapFunction,returnStatement,enhanceCatch} = require('./template');
const nodePath  =  require('path');
const t = require('@babel/types');

let fileName, reportFn,functionCatch,promiseCatch,reportInfo;
let enhancedExpression = new Set();

/**
 * recursion to find outermost callExpression
 * @param path
 */
function recursion(path){
  let deep = 0;
  const p = path.findParent(p=>{
    deep++;
    return t.isCallExpression(p)
  });
  if(p&&deep===2){// 含有外层调用
    return recursion(p)
  }else{
    return path
  }
}
/**
 * ignore Promise constructor
 * @param path
 * @returns {boolean}
 */
function isPromise(path) {
  const parent = path.parent;
  if (t.isNewExpression(parent)) { // a new Promise
    return parent.callee.name === 'Promise'
  }
  if (t.isCallExpression(parent)) {
    let callerName = getCalleeName(parent.callee);
    return callerName === 'then' || callerName === 'catch'// ignore .then amd .catch
  }
  return false
}
/**
 * get name of callee
 * @param callee
 * @returns {*}
 */
function getCalleeName(callee) {
  if(!callee) return;
  if (callee.computed) { // like a['b']
    return callee.property.value;
  } else { // like a.b
    return (callee.property || {}).name;
  }
}

function getReportInfo(file,l){
  const {fileName,line} = reportInfo;
  const info = {
    fileName:t.stringLiteral(nodePath.basename(file)),
    line:t.numericLiteral(l)
  };
  if(fileName===false){
    delete info['fileName']
  }
  if(line===false){
    delete info['line']
  }
  return [...Object.values(info)]
}



/**
 * visitors
 * @type {{Function(*=): (undefined)}}
 */
const funcVisitor = {
  /**
   * 为方法声明添加try-catch
   * @param path
   * @constructor
   */
  Function(path) {
    if (isPromise(path)||!functionCatch||!path.node.loc) return;
    const line = path.node.loc.start.line;
    const functionBody = path.node.body; //get func body
    if (t.isBlockStatement(functionBody)) { // has  { }
      const body = functionBody.body;
      if(!body.length)  return;
      //已经全部被try-catch包裹
      if(t.isTryStatement(body[0])&&body.length===1) return;
        path.get('body').replaceWith(wrapFunction({
          BODY: body,
          HANDLER:reportFn,
          INFO:t.arrayExpression(getReportInfo(fileName,line))
        }))
    } else { //  func like : (a) => a
      path.get('body').replaceWith(returnStatement({
        STATEMENT: functionBody
      }))
    }
  },
  /**
   * 处理具体的catch方法
   * @param path
   * @constructor
   */
  CatchClause(path){
    const name = path.get('param').node.name;
    const error = t.identifier(name);
    let line = 0;
    if(path.getFunctionParent()){ // 在函数声明内
      line =  path.getFunctionParent().node.loc.start.line
    }else{  // 位于script
      line =  path.node.loc.start.line
    }
    path.get('body').replaceWith(enhanceCatch({
      HANDLER:reportFn,
      ARGUMENTS: error,
      BODY:path.node.body.body,
      INFO:t.arrayExpression(getReportInfo(fileName,line))
    }))
  },
  CallExpression(path) {
    if(!path.node.loc||!promiseCatch) return; // ignore generated code and  option
    const line = path.node.loc.start.line;
    let methodName = getCalleeName(path.node.callee);
    if (methodName === 'then' || methodName === 'catch') { // when call .then or .catch
      let expressionStatement = path.getStatementParent(); // get statement
      if (enhancedExpression.has(expressionStatement)) return; // has processed
      const callExpressionOutermost = recursion(path);
      const outermostName = getCalleeName(callExpressionOutermost.node.callee)

      if (outermostName === 'catch') { // end of .catch
        const catchFn = callExpressionOutermost.node.arguments[0];
        if(!catchFn) return;
        let argName;
        if(!catchFn.params.length){
          argName = path.scope.generateUidIdentifier('e')
          catchFn.params.push(argName)
        }else{
          argName = t.identifier( catchFn.params[0].name); // get arguments
        }
        let fnBody = catchFn.body.body; // get old func body
        if(!fnBody){
          callExpressionOutermost.get('arguments.0.body').replaceWith(returnStatement({
            STATEMENT: catchFn.body
          }))
          fnBody = catchFn.body.body;
        }
        callExpressionOutermost.get('arguments.0.body').replaceWith(promiseCatchEnhancer({ // replace
          BODY: fnBody,
          ARGUMENTS: argName,
          HANDLER:reportFn,
          INFO:t.arrayExpression(getReportInfo(fileName,line))
        }));
        enhancedExpression.add(expressionStatement)
      } else { // add catch statement
        const errorVariableName = path.scope.generateUidIdentifier('e');
        callExpressionOutermost.replaceWith(promiseCatchStatement({
          BODY: callExpressionOutermost.node,
          ERR:errorVariableName,
          HANDLER:reportFn,
          INFO:t.arrayExpression(getReportInfo(fileName,line))
        }))
        enhancedExpression.add(expressionStatement)
      }
    }
  }
}
module.exports = function (babel) {
  return {
    pre(file){
      fileName = nodePath.basename(file.opts.filename); // 当前文件名
      functionCatch = this.opts.functionCatch; // 是否捕获方法
      promiseCatch = this.opts.promiseCatch !== false; // 是否捕获promise
      reportInfo = this.opts.info||{}; // 上报信息
      const ignoreFiles = this.opts.ignoreFiles||[]; // 忽略文件
      const functionDirs = this.opts.functionDirs||'all';
      const promiseDirs = this.opts.promiseDirs||'all';
      let catchType = ''
      //  step1.忽略文件
      if(!Array.isArray(ignoreFiles)) throw new Error('ignoreFiles must be Array<string>');
      for(let name of ignoreFiles){
        if(name === fileName) {
          console.log('\n');
          console.log('\033[31m try-catching ignore file : \033[0m','\033[33m '+fileName+' \033[0m');
          return;
        }
      }
      if(functionDirs!=='all'){ // 指定方法目录
        functionCatch = false;
        if(!Array.isArray(functionDirs)) throw new Error('functionDirs must be Array<string>');
        if(!functionDirs.length) functionCatch = false;
        for(let dir of functionDirs){
          if(file.opts.filename.includes(dir)){
            functionCatch = true;
            catchType = 'Function '
            break;
          };
        }
      }
      if(promiseDirs!=='all'){ //指定promise目录
        promiseCatch = false;
        if(!Array.isArray(promiseDirs)) throw new Error('promiseDirs must be Array<string>');
        if(!promiseDirs.length) promiseCatch = false;
        for(let dir of promiseDirs){
          if(file.opts.filename.includes(dir)){
            promiseCatch = true;
            catchType += 'Promise';
            break;
          };
        }
      }
      if(functionCatch!==true&&promiseCatch!==true) return;
      //  step2.判断上报方式
      if(this.opts.import){ // 导入外部方法模式
        const uidName = file.path.scope.generateUidIdentifier('report');
        const {name,isDefault,source} = this.opts.import;
        if(!name||!source) throw new Error('need  name and source options!');
        if(isDefault===true){
          file.path.node.body.unshift(
            t.importDeclaration(
              [t.importDefaultSpecifier(uidName)],
              t.stringLiteral(source)))
        }else{
          file.path.node.body.unshift(
            t.importDeclaration(
              [t.importSpecifier(uidName,t.identifier(name))],
              t.stringLiteral(source)))
        }
        reportFn = uidName;
      }else{ // 全局声明模式
        if(!this.opts.reportFn) throw new Error('need a report function name:string or import options:object');
        reportFn = t.identifier(this.opts.reportFn);
      }
      console.log('\n')
      console.log('\033[32m try-catching file : \033[0m','\033[33m '+fileName+' \033[0m','\033[32m   catchType : \033[0m','\033[36m '+catchType+' \033[0m');
      file.path.traverse(funcVisitor); // enhance before other plugins
    },
  };
};
