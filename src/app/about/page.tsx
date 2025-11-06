import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function AboutPage() {
  return (
    <PageWrapper title="ایپ کے بارے میں">
      <Card className="shadow-lg bg-black/20 border-islamic-gold/50 text-white">
        <CardHeader>
          <CardTitle className="font-arabic text-3xl text-center text-islamic-gold">📱 اسلامی قرعہ اندازی</CardTitle>
        </CardHeader>
        <CardContent className="text-lg space-y-6 text-center font-urdu">
          <p className="text-white/80">
            یہ ایپ اسلامی اصولوں کو مدنظر رکھتے ہوئے بنائی گئی ہے تاکہ ایک شفاف اور منصفانہ قرعہ اندازی کا تجربہ فراہم کیا جا سکے۔
          </p>
          <Separator className="bg-islamic-gold/50" />
          <div className="space-y-2">
            <p>اس ایپ میں کسی قسم کا جوا، سٹہ یا دھوکہ دہی شامل نہیں ہے۔</p>
            <p>اس کا مقصد صرف غیر جانبداری سے انتخاب کرنا ہے۔</p>
          </div>
          <Separator className="bg-islamic-gold/50" />
          <div className="text-white/70">
            <p><strong>ڈویلپر:</strong> Firebase Studio</p>
            <p><strong>ورژن:</strong> 1.0</p>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
