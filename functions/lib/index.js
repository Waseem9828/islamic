"use strict";
// This is the main entry point for all cloud functions.
// It follows a clean, modular, and high-performance architecture.
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitResult = exports.joinMatch = exports.createMatch = exports.handleDepositByAdmin = exports.getPendingTransactions = exports.handleWithdrawalByAdmin = void 0;
// Import controllers, which are the entry points for our functions.
const withdrawalController = require("./controllers/withdrawal.controller");
const depositController = require("./controllers/deposit.controller");
const matchController = require("./controllers/match.controller");
// Export all functions from controllers to make them deployable.
// This keeps the root index file clean and focused solely on exporting.
exports.handleWithdrawalByAdmin = withdrawalController.handleWithdrawal;
exports.getPendingTransactions = depositController.getPendingTransactions;
exports.handleDepositByAdmin = depositController.handleDepositByAdmin;
exports.createMatch = matchController.createMatch;
exports.joinMatch = matchController.joinMatch;
exports.submitResult = matchController.submitResult;
//# sourceMappingURL=index.js.map