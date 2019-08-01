const {promiseCatchStatement, promiseCatchEnhancer,wrapFunction,returnStatement} = require('./template');
const nodePath  =  require('path');
const t = require('@babel/types');

let fileName, reportFn,functionCatch,promiseCatch,reportInfo;
let enhancedExpression = new Set();

/**
 * ignore Promise constructor
 * @param path
 * @returns {boolean}
 */
function isPromise(path) {
  const parent = path.parent;
  if (parent && parent.type === 'NewExpression') { // a new Promise
    return parent.callee.name === 'Promise'
  }
  if (parent.type === 'CallExpression') {
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
  Function(path) {
    if (isPromise(path)||!functionCatch||!path.node.loc) return;
    const line = path.node.loc.start.line;
    const functionBody = path.node.body; //get func body
    if (functionBody.type === 'BlockStatement') { // has  { }
      const body = path.node.body.body;
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
  CallExpression(path) {
    if(!path.node.loc||!promiseCatch) return; // ignore generated code and  option
    const line = path.node.loc.start.line;
    let methodName = getCalleeName(path.node.callee);
    if (methodName === 'then' || methodName === 'catch') { // when call .then or .catch
      let expressionStatement = path.getStatementParent(); // get statement
      if (enhancedExpression.has(expressionStatement)) return; // has processed
      const expression = expressionStatement.node.expression;
      if(!expression) return;
      if (getCalleeName(expression.callee) === 'catch') { // end of .catch
        const catchFn = expression.arguments[0];
        if(!catchFn) return ;
        const argName = catchFn.params[0].name; // get arguments
        const fnBody = catchFn.body.body; // get old func body
        expressionStatement.get('expression.arguments.0.body').replaceWith(promiseCatchEnhancer({ // replace
          BODY: fnBody,
          ARGUMENTS: t.identifier(argName),
          HANDLER:reportFn,
          INFO:t.arrayExpression(getReportInfo(fileName,line))
        }));
        enhancedExpression.add(expressionStatement)
      } else { // add catch statement
        const errorVariableName = path.scope.generateUidIdentifier('e');
        expressionStatement.get('expression').replaceWith(promiseCatchStatement({
          BODY: expression,
          ERR:errorVariableName,
          HANDLER:reportFn,
          INFO:t.arrayExpression(getReportInfo(fileName,line))
        }))
        enhancedExpression.add(expressionStatement)
      }
    }
  }
}


module.exports = function () {
  return {
    pre(file){
      fileName = nodePath.basename(file.opts.filename);
      functionCatch = this.opts.functionCatch;
      promiseCatch = this.opts.promiseCatch !== false;
      reportInfo = this.opts.info||{}; // error info
      const ignoreFiles = this.opts.ignoreFiles||[];
      const functionDirs = this.opts.functionDirs||'all';
      const promiseDirs = this.opts.promiseDirs||'all';

      //  step1.ignore files
      if(!Array.isArray(ignoreFiles)) throw new Error('ignoreFiles must be Array<string>');
      for(let name of ignoreFiles){
        if(name === fileName) {
          console.log('*********************************try-catching ignore file : ' + fileName);
          return;
        }
      }
      if(functionDirs!=='all'){ // function directories
        functionCatch = true;
        if(!Array.isArray(functionDirs)) throw new Error('functionDirs must be Array<string>');
        if(!functionDirs.length) functionCatch = false;
        for(let dir of functionDirs){
          if(!file.opts.filename.includes(dir)) return;
        }
      }
      if(promiseDirs!=='all'){ //promise directories
        promiseCatch = true;
        if(!Array.isArray(promiseDirs)) throw new Error('promiseDirs must be Array<string>');
        if(!promiseDirs.length) promiseCatch = false;
        for(let dir of promiseDirs){
          if(!file.opts.filename.includes(dir)) return;
        }
      }

      if(!functionCatch&&!promiseCatch) return;
      //  step2.inject report function
      if(this.opts.import){ //  import declaration
        const uidName = file.path.scope.generateUidIdentifier('report');
        const {name,isDefault,source} = this.opts.import;
        if(!name||!source) throw new Error('need  name and source options!');
        if(isDefault===true){ // importDefaultSpecifier
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
      }else{ // global declaration
        if(!this.opts.reportFn) throw new Error('need a report function name:string or import options:object');
        reportFn = t.identifier(this.opts.reportFn);
      }
      console.log('*********************************try-catching file : '+fileName);
      file.path.traverse(funcVisitor); // enhance before other plugins
    }
  };
};
