
export interface Activity {
    id?: string;
    userId: string;
    type: 'deposit' | 'withdrawal' | 'match_fee' | 'match_win';
    amount: number;
    timestamp: Date;
}

export interface AdminActivity {
    adminId: string;
    type: string;
    amount: number;
    userId: string;
    depositId: string;
    timestamp?: Date;
}
