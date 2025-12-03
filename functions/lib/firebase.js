"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.firestore = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
!(0, app_1.getApps)().length && (0, app_1.initializeApp)();
exports.firestore = (0, firestore_1.getFirestore)();
exports.auth = (0, auth_1.getAuth)();
//# sourceMappingURL=firebase.js.map