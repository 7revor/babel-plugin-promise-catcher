function promise() {
  try {
    console.log('try');
  } catch (err) {
    console.error(err, ["in.js", 1]);
  }
}

promise().then().catch(function (_e) {
  console.error(_e, ["in.js", 4]);
});