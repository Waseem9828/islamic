
// This is the main entry point for all cloud functions.
// It follows a clean, modular, and high-performance architecture.

// Import controllers, which are the entry points for our functions.
import * as withdrawalController from './controllers/withdrawal.controller';
import * as depositController from './controllers/deposit.controller';
import * as matchController from './controllers/match.controller';

// Export all functions from controllers to make them deployable.
// This keeps the root index file clean and focused solely on exporting.

export const handleWithdrawalByAdmin = withdrawalController.handleWithdrawal;
export const getPendingTransactions = depositController.getPendingTransactions;
export const handleDepositByAdmin = depositController.handleDepositByAdmin;
export const createMatch = matchController.createMatch;
export const joinMatch = matchController.joinMatch;
export const submitResult = matchController.submitResult;

