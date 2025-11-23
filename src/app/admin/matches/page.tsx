
import { MatchClient } from './match-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

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
                        A scalable and real-time interface for managing all game matches.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MatchClient />
                </CardContent>
            </Card>
        </div>
    );
}
