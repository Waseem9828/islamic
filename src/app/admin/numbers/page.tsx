import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManageNumbersPage() {
  return (
    <div>
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle>Manage Numbers</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This is where you will update the daily lucky numbers for each group. This interface is under construction.</p>
            </CardContent>
        </Card>
    </div>
  );
}
