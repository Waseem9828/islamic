import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { HeartHandshake, Shield, Sparkles } from 'lucide-react';

const virtues = [
  {
    icon: <Shield className="h-10 w-10 text-primary" />,
    text: "صدقہ آنے والی مصیبتوں اور بلاؤں کو ٹالتا ہے۔",
  },
  {
    icon: <Sparkles className="h-10 w-10 text-primary" />,
    text: "صدقہ گناہوں کو اس طرح مٹا دیتا ہے جیسے پانی آگ کو بجھا دیتا ہے۔",
  },
  {
    icon: <HeartHandshake className="h-10 w-10 text-primary" />,
    text: "اللہ تعالیٰ صدقہ کرنے والے کے مال میں برکت عطا فرماتا ہے۔",
  },
];

export default function SadaqahPage() {
  return (
    <PageWrapper title="صدقہ کے فضائل">
      <div className="space-y-6">
        <h2 className="text-center font-headline text-3xl text-primary">🤲 صدقہ کی برکتیں</h2>
        {virtues.map((virtue, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="bg-primary/10 p-4 rounded-full">
                {virtue.icon}
              </div>
              <p className="text-xl">
                {virtue.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}
