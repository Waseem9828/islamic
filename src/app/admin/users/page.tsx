
import { db } from "@/firebase/server";
import { UserClient } from "./user-client";
import { UsersDashboard } from "@/components/admin/UsersDashboard";
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';


// Define the User type for server-side fetching
interface User {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    status: 'active' | 'suspended';
    isAdmin: boolean;
    createdAt: any; // Keep it simple for now
}

// Define the shape of the stats object
interface UserStats {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    newToday: number;
    kycVerifiedUsers: number;
}

async function fetchUsersAndStats(): Promise<{ users: User[], stats: UserStats }> {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(query(usersCollection, where('status', 'in', ['active', 'suspended'])));

    const adminSnapshot = await getDocs(collection(db, 'roles_admin'));
    const adminIds = new Set(adminSnapshot.docs.map(doc => doc.id));

    let activeUsers = 0;
    let blockedUsers = 0;
    let newToday = 0;
    const twentyFourHoursAgo = Timestamp.now().toMillis() - (24 * 60 * 60 * 1000);

    const users: User[] = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        const status = data.status || 'active';

        // Calculate stats
        if (status === 'active') activeUsers++;
        if (status === 'suspended') blockedUsers++;

        const createdAt = data.createdAt;
        if (createdAt && createdAt.toMillis() > twentyFourHoursAgo) {
            newToday++;
        }

        return {
            id: doc.id,
            displayName: data.displayName || 'N/A',
            email: data.email || 'No email',
            photoURL: data.photoURL,
            status,
            isAdmin: adminIds.has(doc.id),
            createdAt,
        };
    });

    const stats: UserStats = {
        totalUsers: users.length,
        activeUsers,
        blockedUsers,
        newToday,
        kycVerifiedUsers: 0, // Placeholder for now
    };

    return { users, stats };
}

export default async function ManageUsersPage() {
    const { users, stats } = await fetchUsersAndStats();

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">User Management</h1>
                
                {/* Render the statistics dashboard */}
                <UsersDashboard stats={stats} />

                {/* Render the user data table */}
                <div className="bg-white dark:bg-gray-900/80 rounded-lg shadow-md">
                     <UserClient initialUsers={users} />
                </div>
            </div>
        </div>
    );
}
