function promise() {
  try {
    console.log('try');
  } catch (err) {
    console.error(err, ["in.js", 1]);
  }
}

try {
  promise().then().catch(function (_e) {
    console.error(_e, ["in.js", 5]);
  });
} catch (e) {
  console.error(e, ["in.js", 6]);
}