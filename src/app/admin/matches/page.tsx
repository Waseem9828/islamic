
import { MatchClient } from './match-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const MatchClientFallback = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center py-4">
                <Skeleton className="h-10 max-w-sm w-full" />
            </div>
            <div className="rounded-md border">
                 <div className="space-y-2 p-4">
                    {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </div>
        </div>
    )
}

export default function ManageMatchesPage() {
    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Trophy className="mr-2"/> 
                        Match Command Center
                    </CardTitle>
                    <CardDescription>
                        A real-time interface for viewing, managing, and resolving all game matches.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<MatchClientFallback />}>
                        <MatchClient />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
