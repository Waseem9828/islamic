
import { Suspense } from 'react';
import { LoginForm } from './login-form';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://picsum.photos/seed/5/1200/1200"
          alt="Background"
          fill
          priority
          data-ai-hint="mosque interior"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>

      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
