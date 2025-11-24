
import { Suspense } from 'react';
import { SignUpForm } from './signup-form';
import Image from 'next/image';

export default function SignUpPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:grid-cols-5">
       <div className="flex items-center justify-center py-12 xl:col-span-2">
        <Suspense fallback={<div>Loading...</div>}>
            <SignUpForm />
        </Suspense>
      </div>
      <div className="hidden bg-muted lg:block xl:col-span-3">
        <Image
          src="https://picsum.photos/seed/6/1200/1200"
          alt="Image"
          width="1920"
          height="1080"
          data-ai-hint="islamic pattern"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
