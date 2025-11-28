
// This file is the compiled output and should not be edited directly.
// See src/index.ts for the source.
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

if (admin.apps.length === 0) {
    admin.initializeApp();
}
// All functions are now defined in src/index.ts
// This file can be left as is, or you can require the compiled output from `lib`
// e.g. module.exports = require("./lib/index");
