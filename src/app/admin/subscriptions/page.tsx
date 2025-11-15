import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManageSubscriptionsPage() {
  return (
    <div>
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle>Manage Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This is where you will view and manage all user subscriptions. This interface is under construction.</p>
            </CardContent>
        </Card>
    </div>
  );
}
