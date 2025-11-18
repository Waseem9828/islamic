
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <div className="flex flex-col justify-center items-center h-full">
            <h1 className="text-5xl font-bold text-primary">Premium Numbers</h1>
            <p className="mt-4 text-lg text-muted-foreground">Your premium number prediction service</p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
         <Suspense fallback={<div>Loading...</div>}>
           <LoginForm />
         </Suspense>
      </div>
    </div>
  );
}
