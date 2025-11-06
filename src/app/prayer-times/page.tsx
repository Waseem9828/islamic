import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const prayerTimes = [
  { name: 'فجر', time: '5:15 AM' },
  { name: 'ظہر', time: '12:15 PM' },
  { name: 'عصر', time: '4:30 PM' },
  { name: 'مغرب', time: '6:45 PM' },
  { name: 'عشاء', time: '8:00 PM' },
];

export default function PrayerTimesPage() {
  return (
    <PageWrapper title="نماز کے اوقات">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center font-headline text-3xl">🕌 آج کے اوقاتِ نماز</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right text-lg">نماز</TableHead>
                <TableHead className="text-left text-lg">وقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prayerTimes.map((prayer) => (
                <TableRow key={prayer.name}>
                  <TableCell className="font-bold text-xl">{prayer.name}</TableCell>
                  <TableCell className="text-left font-mono text-xl">{prayer.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-center text-muted-foreground mt-6 text-sm">
            نوٹ: یہ اوقات مثال کے طور پر ہیں۔ اپنے مقامی مسجد کے اوقات پر عمل کریں۔
          </p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
