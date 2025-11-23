
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/server'; // Server-side firebase instance
import { UserClient } from './user-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

async function getUsers() {
    if (!db) return [];

    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("displayName"));
    const querySnapshot = await getDocs(q);

    const adminRolesRef = collection(db, "roles_admin");
    const adminSnapshot = await getDocs(adminRolesRef);
    const adminIds = new Set(adminSnapshot.docs.map(doc => doc.id));

    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            displayName: data.displayName || 'No Name',
            email: data.email || 'No Email',
            photoURL: data.photoURL || undefined,
            status: data.status || 'active',
            isAdmin: adminIds.has(doc.id),
        };
    });
}

export default async function ManageUsersPage() {
    const initialUsers = await getUsers();

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>A comprehensive list of all users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserClient initialUsers={initialUsers} />
                </CardContent>
            </Card>
        </div>
    );
}
