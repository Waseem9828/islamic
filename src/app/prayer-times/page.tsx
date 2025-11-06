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
      <Card className="shadow-lg bg-black/20 border-islamic-gold/50 text-white">
        <CardHeader>
          <CardTitle className="text-center font-arabic text-3xl text-islamic-gold">🕌 آج کے اوقاتِ نماز</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-islamic-gold/50">
                <TableHead className="text-right text-lg font-urdu text-white">نماز</TableHead>
                <TableHead className="text-left text-lg font-urdu text-white">وقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prayerTimes.map((prayer) => (
                <TableRow key={prayer.name} className="border-islamic-gold/30">
                  <TableCell className="font-bold text-xl font-urdu">{prayer.name}</TableCell>
                  <TableCell className="text-left font-mono text-xl">{prayer.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-center text-white/70 mt-6 text-sm font-urdu">
            نوٹ: یہ اوقات مثال کے طور پر ہیں۔ اپنے مقامی مسجد کے اوقات پر عمل کریں۔
          </p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
