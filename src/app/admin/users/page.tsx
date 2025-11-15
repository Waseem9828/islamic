import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManageUsersPage() {
  return (
    <div>
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle>Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This is where you will view and manage all registered users. This interface is under construction.</p>
            </CardContent>
        </Card>
    </div>
  );
}
