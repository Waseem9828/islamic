'use client';
import { BismillahButton } from '@/components/BismillahButton';

export default function Home() {
  const handleBismillahClick = () => {
    console.log('بسم اللہ کے ساتھ شروع کریں');
    // यहां हम बाद में navigation शामिल करेंगे
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-islamic-green via-islamic-lightGreen to-islamic-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* اسلامی بیکگراؤنڈ پیٹرن */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl text-islamic-gold opacity-20">﷽</div>
        <div className="absolute bottom-10 right-10 text-6xl text-islamic-gold opacity-20">﷽</div>
      </div>
      
      {/* مین کونٹینٹ */}
      <div className="text-center z-10 max-w-4xl mx-auto">
        
        {/* ہیڈر */}
        <header className="mb-12">
          <h1 className="text-5xl md:text-7xl font-arabic text-islamic-gold mb-6 leading-tight">
            الْقُرْعَةُ الْإِسْلَامِيَّةُ
          </h1>
          <p className="text-2xl md:text-3xl font-urdu text-white mb-4">
            اسلامی طریقے سے قرعہ اندازی
          </p>
          <p className="text-lg text-islamic-cream opacity-90">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ کے ساتھ آغاز
          </p>
        </header>

        {/* دعا سیکشن */}
        <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-3xl p-8 mb-12 border border-islamic-gold border-opacity-30">
          <p className="text-2xl md:text-3xl font-arabic text-islamic-gold leading-relaxed">
            اَللّٰهُمَّ خِرْ لِيْ وَاخْتَرْ لِيْ
          </p>
          <p className="text-lg text-white mt-4 font-urdu">
            "یا اللہ! میرے لیے بہتر کو منتخب فرما"
          </p>
        </div>

        {/* مین ایکشن بٹن */}
        <div className="mb-12">
          <BismillahButton onClick={handleBismillahClick}>
            شروع کریں بِسْمِ اللَّهِ
          </BismillahButton>
        </div>

        {/* فیچر گرڈ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
          <div className="bg-white bg-opacity-10 p-6 rounded-2xl border border-islamic-gold border-opacity-20">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-urdu text-white mb-2">مکمل اسلامی</h3>
            <p className="text-islamic-cream text-sm">شرعی اصولوں کے مطابق</p>
          </div>
          
          <div className="bg-white bg-opacity-10 p-6 rounded-2xl border border-islamic-gold border-opacity-20">
            <div className="text-3xl mb-4">🤲</div>
            <h3 className="text-xl font-urdu text-white mb-2">دعاؤں کے ساتھ</h3>
            <p className="text-islamic-cream text-sm">ہر مرحلہ پر اسلامی دعائیں</p>
          </div>
          
          <div className="bg-white bg-opacity-10 p-6 rounded-2xl border border-islamic-gold border-opacity-20">
            <div className="text-3xl mb-4">🕋</div>
            <h3 className="text-xl font-urdu text-white mb-2">پاکیزہ طریقہ</h3>
            <p className="text-islamic-cream text-sm">جوا بازی سے پاک</p>
          </div>
        </div>

      </div>

      {/* فوٹر */}
      <footer className="mt-16 text-center">
        <p className="text-islamic-cream opacity-70 text-sm">
          ﴿رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ﴾
        </p>
      </footer>

    </main>
  );
}
