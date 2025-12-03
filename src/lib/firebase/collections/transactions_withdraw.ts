
import { collection, Timestamp } from "firebase/firestore";
import { firestore } from "../firebase";

export type WithdrawalStatus = "pending" | "approved" | "completed" | "rejected";

export interface Withdrawal {
  id: string;
  userId: string;
  adminId?: string; // The admin who completed the withdrawal
  amount: number;
  status: WithdrawalStatus;
  timestamp: Timestamp;
  completedAt?: Timestamp;
  upiId?: string; // The UPI ID for the withdrawal
}

export const withdrawalsCollection = collection(firestore, "transactions_withdraw");
