'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, UserPlus } from "lucide-react";

// Define the shape of the stats object
interface UserStats {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    newToday: number;
    kycVerifiedUsers: number; // Included for future use
}

interface UsersDashboardProps {
    stats: UserStats;
}

/**
 * A component to display key statistics about users in a dashboard format.
 * Renders a grid of cards, each showing a specific metric.
 */
export const UsersDashboard = ({ stats }: UsersDashboardProps) => {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</CardTitle>
                    <Users className="h-5 w-5 text-gray-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">All registered users</p>
                </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</CardTitle>
                    <UserCheck className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Users not suspended</p>
                </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Blocked Users</CardTitle>
                    <UserX className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.blockedUsers.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Suspended accounts</p>
                </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">New Today</CardTitle>
                    <UserPlus className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{stats.newToday.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Registered in last 24h</p>
                </CardContent>
            </Card>
        </div>
    );
};
