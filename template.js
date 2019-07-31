const template = require('babel-template');
/**

/**
 * add promise.catch
 */
const promiseCatchStatement = template(`
  BODY.catch(function(ERR){
   if(ERR instanceof Error){
      HANDLER(ERR,INFO)
    }
  })`);
/**
 * report error
 */
const promiseCatchEnhancer = template(`{
    BODY
  if(ARGUMENTS instanceof Error){
     HANDLER(ARGUMENTS,INFO)
  }
 }`);
/**
 * add try-catch
 */
const wrapFunction = template(`{
  try {
    BODY
  } catch(err) {
    HANDLER(err,INFO)
  }
}`);
/**
 * transform arrow function
 */
const returnStatement = template(`{
    return STATEMENT
}`)

module.exports={
  wrapFunction,
  returnStatement,
  promiseCatchStatement,
  promiseCatchEnhancer
}
