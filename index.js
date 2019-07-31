const {promiseCatchStatement, promiseCatchEnhancer} = require('./template');
const nodePath  =  require('path')

/**
 * 获取调用方法名称
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

/**
 * 是否跳过
 * 1.生成的代码
 * 2.Promise构造函数
 * 3.处理过的代码
 * 4.then和catch方法
 */
let fileName, reportFn;
let enhancedExpression = new Set();

module.exports = function ({types: t}) {
  return {
    pre(file){
      fileName = nodePath.basename(file.opts.filename);
      reportFn = this.opts.report||'console.log'
    },
    visitor: {
      CallExpression(path,state) {
        console.log(state.file.code)
        let methodName = getCalleeName(path.node.callee);
        if (methodName === 'then' || methodName === 'catch') { // 带有then或者catch，isPromise
          let expressionStatement = path.getStatementParent(); //取父节点
          if (enhancedExpression.has(expressionStatement)) return;
          const expression = expressionStatement.node.expression;
          let functionName = 'script'
          const funcP = path.getFunctionParent();
          if(funcP){
            if (funcP.node.id) {
              functionName = funcP.node.id.name || 'anonymous function';
            }
            if (path.node.key) {
              functionName = funcP.node.key.name || 'anonymous function';
            }
          }
          if (getCalleeName(expression.callee) === 'catch') { // 最后以catch结尾
            const catchFn = expression.arguments[0];
            const argName = catchFn.params[0].name; // 获取参数名称
            const fnBody = catchFn.body.body; // 获取原有函数体
            expressionStatement.get('expression.arguments.0.body').replaceWith(promiseCatchEnhancer({ // 替换
              BODY: fnBody,
              ARGUMENTS: t.identifier(argName),
              HANDLER:t.identifier(reportFn),
              FILENAME:t.StringLiteral(nodePath.basename(fileName)),
              FUNC:t.StringLiteral(functionName),
            }));
            enhancedExpression.add(expressionStatement)
          } else { // 追加catch
            const errorVariableName = path.scope.generateUidIdentifier('e');
            expressionStatement.get('expression').replaceWith(promiseCatchStatement({
              BODY: expression,
              ERR:errorVariableName,
              HANDLER:t.identifier(reportFn),
              FILENAME:t.StringLiteral(nodePath.basename(fileName)),
              FUNC:t.StringLiteral(functionName),
            }))
            enhancedExpression.add(expressionStatement)
          }
        }
      }
    }
  };
};
