const template = require('babel-template');
/**

/**
 * add promise.catch
 */
const promiseCatchStatement = template(`
  BODY.catch(function(ERR){
      HANDLER(ERR,INFO)
  })`);
/**
 * report error
 */
const promiseCatchEnhancer = template(`{
     HANDLER(ARGUMENTS,INFO)
    BODY
 }`);
/**
 * add try-catch
 */
const wrapFunction = template(`{
  try {
    BODY
  } catch(err) {
  
  }
}`);
/**
 * enhance try-catch
 */
const enhanceCatch = template(`{
   HANDLER(ARGUMENTS,INFO)
    BODY
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
  promiseCatchEnhancer,
  enhanceCatch
}
