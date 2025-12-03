
import { collection, Timestamp } from "firebase/firestore";
import { firestore } from "../firebase";

export type AdminRole = "worker" | "super";
export type AdminStatus = "active" | "disabled";

export interface AdminWallet {
  totalAdded: number;
  totalUsed: number;
  currentBalance: number;
}

export interface Admin {
  id: string;
  name: string;
  role: AdminRole;
  wallet: AdminWallet;
  createdAt: Timestamp;
  status: AdminStatus;
}

export const adminsCollection = collection(firestore, "admins");
