// @ts-nocheck
const fs = require("fs");
const semver = require("semver");
(() => {
  let { ...package } = JSON.parse(fs.readFileSync("./package.json"));
  package.version = semver.inc(package.version, "patch");
  fs.writeFileSync("./package.json", JSON.stringify(package, null, 3));
})();
