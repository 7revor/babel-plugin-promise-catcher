a = promise().then().catch(function (_e) {
  console.error(_e, ["in.js", 1]);
});
const b = promise().catch(err => {
  console.error(err, ["in.js", 2]);
});
a === b ? promise().then().catch(function (_e2) {
  console.error(_e2, ["in.js", 3]);
}) : false;
const c = promise.then().catch(err => {
  console.error(err, ["in.js", 4]);
});