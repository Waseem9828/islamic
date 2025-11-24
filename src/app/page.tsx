
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogIn, Gamepad2, Wallet, ShieldCheck, Users, Trophy, Heart, Star, Facebook, Twitter, Instagram } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: <Gamepad2 className="w-10 h-10 text-primary" />,
      title: "Create & Join Matches",
      description: "Easily create your own Ludo matches with custom entry fees or join existing ones to challenge other players.",
    },
    {
      icon: <Wallet className="w-10 h-10 text-primary" />,
      title: "Secure Wallet System",
      description: "Manage your funds with a secure wallet. Deposit money to play and withdraw your winnings safely.",
    },
    {
      icon: <Users className="w-10 h-10 text-primary" />,
      title: "Climb the Ranks",
      description: "Compete against the best, track your progress, and rise to the top of the global leaderboard.",
    },
  ];

  const stats = [
      {
          icon: <Trophy className="h-8 w-8 text-primary"/>,
          value: '10,000+',
          label: 'Matches Played'
      },
      {
          icon: <Users className="h-8 w-8 text-primary"/>,
          value: '5,000+',
          label: 'Active Players'
      },
      {
          icon: <Heart className="h-8 w-8 text-primary"/>,
          value: '98%',
          label: 'User Satisfaction'
      }
  ];

  const testimonials = [
      {
          name: "Ahmed Khan",
          title: "Enthusiast Player",
          quote: "This is the best Ludo platform I've ever used. The wallet system is seamless and finding a match is so easy. Highly recommended!",
          avatar: "https://avatar.vercel.sh/ahmed.png"
      },
      {
          name: "Fatima Ali",
          title: "Casual Gamer",
          quote: "I love the clean design and how quickly I can start a game. The community is great and I've had a lot of fun playing here.",
          avatar: "https://avatar.vercel.sh/fatima.png"
      },
      {
          name: "Zayn Malik",
          title: "Competitive Player",
          quote: "The competition is fierce and the leaderboard keeps me motivated. It's a professional setup for serious Ludo players.",
          avatar: "https://avatar.vercel.sh/zayn.png"
      }
  ];

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <main className="relative isolate overflow-hidden bg-background">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] dark:bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.900),theme(colors.background))] opacity-20"></div>
          <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-background shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 dark:bg-background dark:shadow-indigo-900/10 dark:ring-indigo-900 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center"></div>
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
                  <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                      Welcome to the <span className="text-primary">Ludo</span> Arena
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-muted-foreground">
                      Challenge players, create matches, and climb the leaderboard. Your ultimate Ludo experience starts here.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                      <Button size="lg" onClick={() => router.push('/signup')}>Get Started <ArrowRight className="ml-2" /></Button>
                      <Button size="lg" variant="outline" onClick={() => router.push('/login')}><LogIn className="mr-2"/> Login</Button>
                  </div>
              </div>
          </div>
      </main>

      {/* Stats Section */}
        <section className="py-12 bg-muted/40">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex flex-col items-center">
                            {stat.icon}
                            <p className="text-3xl font-bold mt-2">{stat.value}</p>
                            <p className="text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-base font-semibold leading-7 text-primary">Key Features</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to compete
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Our platform provides a seamless and secure environment for competitive Ludo.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 border-primary">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        {feature.icon}
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardDescription>{feature.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-32 bg-muted/40">
        <div className="max-w-3xl mx-auto text-center px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground">Get Started in Minutes</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Joining the arena is simple and straightforward.
          </p>
        </div>
        <div className="mt-16 max-w-5xl mx-auto grid md:grid-cols-4 gap-8 text-center px-6 lg:px-8">
            <div className="p-4 flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mx-auto ring-8 ring-background">1</div>
                <h3 className="mt-6 text-lg font-semibold">Sign Up</h3>
                <p className="mt-1 text-muted-foreground">Create your free account to get started.</p>
            </div>
             <div className="p-4 flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mx-auto ring-8 ring-background">2</div>
                <h3 className="mt-6 text-lg font-semibold">Add Funds</h3>
                <p className="mt-1 text-muted-foreground">Deposit money securely into your wallet.</p>
            </div>
             <div className="p-4 flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mx-auto ring-8 ring-background">3</div>
                <h3 className="mt-6 text-lg font-semibold">Join a Match</h3>
                <p className="mt-1 text-muted-foreground">Find an open match or create your own.</p>
            </div>
             <div className="p-4 flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mx-auto ring-8 ring-background">4</div>
                <h3 className="mt-6 text-lg font-semibold">Play & Win</h3>
                <p className="mt-1 text-muted-foreground">Compete, win, and see your earnings grow.</p>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What Our Players Say</h2>
                <p className="mt-4 text-lg text-muted-foreground">We are trusted by thousands of Ludo lovers worldwide.</p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((testimonial, index) => (
                <Card key={index} className="flex flex-col">
                    <CardContent className="p-6 flex-grow">
                    <div className="flex items-center mb-4">
                        <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                        </div>
                    </div>
                    <blockquote className="text-muted-foreground italic">"{testimonial.quote}"</blockquote>
                    </CardContent>
                    <CardHeader>
                        <div className="flex text-yellow-400">
                            <Star className="h-5 w-5 fill-current"/>
                            <Star className="h-5 w-5 fill-current"/>
                            <Star className="h-5 w-5 fill-current"/>
                            <Star className="h-5 w-5 fill-current"/>
                            <Star className="h-5 w-5 fill-current"/>
                        </div>
                    </CardHeader>
                </Card>
                ))}
            </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="cta" className="py-20 sm:py-32">
        <div className="relative isolate overflow-hidden bg-primary/90 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to roll the dice?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
                Join thousands of players and start your journey to become a Ludo champion today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button 
                    size="lg" 
                    variant="secondary"
                    onClick={() => router.push('/signup')}
                    className="bg-white text-primary hover:bg-white/90"
                >
                    Sign Up for Free <ArrowRight className="ml-2" />
                </Button>
            </div>
            <div className="absolute -top-24 left-1/2 -z-10 h-[50rem] w-[50rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]" aria-hidden="true">
                <svg className="absolute inset-0 h-full w-full stroke-primary-foreground/20" fill="none">
                    <defs>
                        <pattern id="pattern-1" x="50%" y="50%" width="200" height="200" patternUnits="userSpaceOnUse">
                        <path d="M.5 200V.5H200" fill="none" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" strokeWidth="0" fill="url(#pattern-1)" />
                </svg>
            </div>
        </div>
      </section>

      <footer className="w-full py-12 px-4 sm:px-8 border-t bg-muted/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <h3 className="text-xl font-bold text-primary mb-4">Ludo Arena</h3>
                <p className="text-muted-foreground">The ultimate platform for competitive Ludo matches.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                    <li><Link href="/matchmaking" className="text-muted-foreground hover:text-primary">Play</Link></li>
                    <li><Link href="/leaderboard" className="text-muted-foreground hover:text-primary">Leaderboard</Link></li>
                    <li><Link href="/wallet" className="text-muted-foreground hover:text-primary">Wallet</Link></li>
                </ul>
            </div>
             <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                    <li><Link href="#" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
                    <li><Link href="#" className="text-muted-foreground hover:text-primary">Contact Us</Link></li>
                    <li><Link href="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                </ul>
            </div>
             <div>
                <h4 className="font-semibold mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                    <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook /></Link>
                    <Link href="#" className="text-muted-foreground hover:text-primary"><Twitter /></Link>
                    <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram /></Link>
                </div>
            </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} Ludo Arena. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

