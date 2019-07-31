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
  if (callee.computed) { // like a['b']
    return callee.property.value;
  } else { // like a.b
    return (callee.property || {}).name;
  }
}

function getReportInfo(file,fn,l){
  const {fileName,fnName,line} = reportInfo;
  const info = {
    fileName:t.stringLiteral(nodePath.basename(file)),
    fnName:t.stringLiteral(fn),
    line:t.stringLiteral(l+'')
  };
  if(fileName===false){
    delete info['fileName']
  }
  if(fnName===false){
    delete info['fnName']
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
    let functionName = 'anonymous function';
    if (path.node.id) {
      functionName = path.node.id.name || 'anonymous function';
    }
    if (path.node.key) {
      functionName = path.node.key.name || 'anonymous function';
    }
    if (functionBody.type === 'BlockStatement') { // has  { }
      const body = path.node.body.body;
      path.get('body').replaceWith(wrapFunction({
        BODY: body,
        HANDLER:t.identifier(reportFn),
        INFO:t.arrayExpression(getReportInfo(fileName,functionName,line))
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
      let functionName = 'script';
      const funcP = path.getFunctionParent();
      if(funcP){
        if (funcP.node.id) {
          functionName = funcP.node.id.name || 'anonymous function';
        }
        if (path.node.key) {
          functionName = funcP.node.key.name || 'anonymous function';
        }
      }
      if (getCalleeName(expression.callee) === 'catch') { // end of .catch
        const catchFn = expression.arguments[0];
        const argName = catchFn.params[0].name; // get arguments
        const fnBody = catchFn.body.body; // get old func body
        expressionStatement.get('expression.arguments.0.body').replaceWith(promiseCatchEnhancer({ // replace
          BODY: fnBody,
          ARGUMENTS: t.identifier(argName),
          HANDLER:t.identifier(reportFn),
          INFO:t.arrayExpression(getReportInfo(fileName,functionName,line))
        }));
        enhancedExpression.add(expressionStatement)
      } else { // add catch statement
        const errorVariableName = path.scope.generateUidIdentifier('e');
        expressionStatement.get('expression').replaceWith(promiseCatchStatement({
          BODY: expression,
          ERR:errorVariableName,
          HANDLER:t.identifier(reportFn),
          INFO:t.arrayExpression(getReportInfo(fileName,functionName,line))
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
      reportFn = this.opts.reportFn||'console.error';
      functionCatch = this.opts.functionCatch; // default false
      promiseCatch = this.opts.promiseCatch !== false;
      reportInfo = this.opts.info||{};
      file.path.traverse(funcVisitor); // enhance before other plugins
    }
  };
};
