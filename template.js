const template = require('babel-template');
/**

/**
 * 自动添加promise.catch
 */
const promiseCatchStatement = template(`
  BODY.catch(function(ERR){
   if(ERR instanceof Error){
      HANDLER(ERR,FILENAME,FUNC)
    }
  })`);

const promiseCatchEnhancer = template(`{
    BODY
  if(ARGUMENTS instanceof Error){
     HANDLER(ARGUMENTS,FILENAME,FUNC)
  }
 }`);

module.exports={
  promiseCatchStatement,
  promiseCatchEnhancer
}
