
import { collection, Timestamp } from "firebase/firestore";
import { firestore } from "../firebase";

export type DepositStatus = "pending" | "approved" | "rejected";

export interface Deposit {
  id: string;
  userId: string;
  adminId?: string; // The admin who approved the deposit
  amount: number;
  status: DepositStatus;
  timestamp: Timestamp;
  transactionId?: string; // The transaction ID from the payment gateway
}

export const depositsCollection = collection(firestore, "transactions_deposit");
