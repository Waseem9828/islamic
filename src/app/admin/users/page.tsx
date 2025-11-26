
'use client';

import { UserClient } from "./user-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User } from "lucide-react";

export default function ManageUsersPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><User className="mr-2"/>User Management</CardTitle>
                <CardDescription>View, manage, and monitor all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <UserClient />
            </CardContent>
        </Card>
    );
}
