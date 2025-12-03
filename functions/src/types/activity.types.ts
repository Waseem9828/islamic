
export interface Activity {
    id?: string;
    userId: string;
    type: 'deposit' | 'withdrawal' | 'match_fee' | 'match_win';
    amount: number;
    timestamp: Date;
}
