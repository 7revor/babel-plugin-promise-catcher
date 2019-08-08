itemDetail().then(res => {
  this.setState();
}).catch((_e) => {
  console.error(_e, ["in.js", 1]);
  PyDialog.alert().then(() => {}).catch(function (_e2) {
    console.error(_e2, ["in.js", 4]);
  });
});
const a = promise1.then().catch(function (_e3) {
  console.error(_e3, ["in.js", 9]);
});
b = promise2.then().catch(err => {
  console.error(err, ["in.js", 11]);
  return err;
});
promise3.catch(err => {
  console.error(err, ["in.js", 13]);
});