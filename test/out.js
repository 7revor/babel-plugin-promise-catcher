import { reportInfo as _report } from "./report";
promise().then().catch(function (_e) {
  _report(_e, ["in.js", 1]);
});