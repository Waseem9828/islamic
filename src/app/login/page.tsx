'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const auth = getAuth();

    try {
      if (isSigningUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'کامیابی!', description: 'آپ کا اکاؤنٹ بن گیا ہے۔' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'خوش آمدید!', description: 'آپ کامیابی سے لاگ ان ہو گئے ہیں۔' });
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message);
      toast({ variant: 'destructive', title: 'خرابی', description: 'لاگ ان یا سائن اپ میں مسئلہ ہوا۔' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setError(null);
    const auth = getAuth();
    try {
      await signInAnonymously(auth);
      toast({ title: 'خوش آمدید!', description: 'آپ مہمان کے طور پر لاگ ان ہیں۔' });
      router.push('/');
    } catch (err: any) {
      setError(err.message);
      toast({ variant: 'destructive', title: 'خرابی', description: 'مہمان لاگ ان میں مسئلہ ہوا۔' });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-islamic-dark">
        <div className="text-white">لوڈ ہو رہا ہے...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-islamic-dark via-islamic-green to-islamic-dark">
       <Card className="w-full max-w-md bg-white bg-opacity-10 border-islamic-gold border-opacity-20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-arabic text-islamic-gold">
            {isSigningUp ? 'نیا اکاؤنٹ بنائیں' : 'لاگ ان کریں'}
          </CardTitle>
          <CardDescription className="text-islamic-cream font-urdu">
            {isSigningUp ? 'جاری رکھنے کے لیے اپنی تفصیلات درج کریں۔' : 'اپنے اکاؤنٹ میں لاگ ان کریں۔'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuthAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-right">
              <Label htmlFor="email" className="font-urdu">ای میل</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white bg-opacity-20 border-white border-opacity-30 text-white placeholder-gray-400"
              />
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="password">پاس ورڈ</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white bg-opacity-20 border-white border-opacity-30 text-white placeholder-gray-400"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-accent text-accent-foreground font-urdu font-bold" disabled={loading}>
              {loading ? 'انتظار کریں...' : (isSigningUp ? 'سائن اپ' : 'لاگ ان')}
            </Button>
            <Button variant="outline" type="button" className="w-full font-urdu" onClick={() => setIsSigningUp(!isSigningUp)}>
              {isSigningUp ? 'پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں' : 'اکاؤنٹ نہیں ہے؟ سائن اپ کریں'}
            </Button>
             <div className="relative w-full flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white border-opacity-30"></span>
              </div>
              <span className="relative px-2 bg-islamic-dark text-xs uppercase text-islamic-cream">یا</span>
            </div>
             <Button variant="secondary" type="button" className="w-full font-urdu" onClick={handleAnonymousSignIn} disabled={loading}>
              {loading ? 'انتظار کریں...' : 'مہمان کے طور پر جاری رکھیں'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
