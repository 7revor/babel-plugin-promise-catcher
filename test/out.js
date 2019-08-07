promise().then(res => {
  const b = promise2().then().catch(function (_e2) {
    console.error(_e2, ["in.js", 2]);
  });
}).catch(function (_e) {
  console.error(_e, ["in.js", 1]);
});