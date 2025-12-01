
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      {/* The external image component was removed as it was likely causing the 500 error during server-side rendering. */}
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
