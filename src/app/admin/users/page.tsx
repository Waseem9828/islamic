

'use client';

import { UserClient } from "./user-client";

export default function ManageUsersPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* The UserClient component now contains the dashboard and the table */}
                <UserClient />
            </div>
        </div>
    );
}
