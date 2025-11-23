
import { db } from "@/firebase/server";
import { UserClient } from "./user-client";

// Define the User type for server-side fetching
interface User {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    status: 'active' | 'suspended';
    isAdmin: boolean;
}

async function fetchUsers(): Promise<User[]> {
    const usersSnapshot = await db.collection('users').orderBy('displayName').get();
    const adminSnapshot = await db.collection('roles_admin').get();
    const adminIds = new Set(adminSnapshot.docs.map(doc => doc.id));

    const users: User[] = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            displayName: data.displayName || 'N/A',
            email: data.email || 'No email',
            photoURL: data.photoURL,
            status: data.status || 'active',
            isAdmin: adminIds.has(doc.id),
        };
    });

    return users;
}

export default async function ManageUsersPage() {
    const initialUsers = await fetchUsers();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">User Management</h1>
            <UserClient initialUsers={initialUsers} />
        </div>
    );
}
