'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BismillahButton } from '@/components/BismillahButton';

export default function DrawPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-islamic-green flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-arabic text-islamic-gold mb-8">
        قرعہ اندازی
      </h1>
      <p className="text-white text-xl font-urdu mb-8">
        یہاں قرعہ اندازی کی سیٹنگز اور دیگر فیچرز شامل کیے جائیں گے۔
      </p>
      <BismillahButton onClick={() => router.push('/')}>
        واپس جائیں
      </BismillahButton>
    </div>
  );
}
