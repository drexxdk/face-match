import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FaHeart, FaTrophy, FaQrcode, FaUsers, FaBolt, FaShieldHalved } from 'react-icons/fa6';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { Logo } from '@/components/ui/logo';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/admin');
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="to-brand-tertiary relative flex-1 overflow-hidden bg-linear-to-br from-[hsl(262_83%_58%)] via-[hsl(217_91%_60%)]">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 size-72 animate-pulse rounded-full bg-white blur-3xl" />
          <div className="absolute right-10 bottom-20 size-96 animate-pulse rounded-full bg-white blur-3xl delay-1000" />
        </div>

        <div className="relative container mx-auto flex min-h-125 flex-col items-center justify-center gap-8 px-4 py-12 text-center md:min-h-150 md:gap-10 md:py-20">
          {/* Logo */}
          <div className="scale-125 md:scale-150">
            <Logo showText={false} href="/" />
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-3 md:gap-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-7xl">Guess Who?</h1>
            <p className="max-w-2xl px-4 text-xl font-semibold text-white/95 sm:text-2xl md:text-3xl">
              Turn awkward introductions into fun connections
            </p>
            <p className="max-w-xl px-4 text-base text-white/85 sm:text-lg">
              The social icebreaker game that helps teams, students, and groups actually remember each other&apos;s
              names
            </p>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-3 px-4 text-sm text-white/90 md:gap-4">
            <Badge variant="secondary" className="bg-white/25 px-3 py-1.5 text-white hover:bg-white/35">
              <Icon icon={FaShieldHalved} size="sm" color="white" className="mr-1.5" />
              No Account Needed to Play
            </Badge>
            <Badge variant="secondary" className="bg-white/25 px-3 py-1.5 text-white hover:bg-white/35">
              <Icon icon={FaBolt} size="sm" color="white" className="mr-1.5" />
              Start in 30 Seconds
            </Badge>
            <Badge variant="secondary" className="bg-white/25 px-3 py-1.5 text-white hover:bg-white/35">
              <Icon icon={FaHeart} size="sm" color="white" className="mr-1.5" />
              Free Forever
            </Badge>
          </div>

          {/* CTA Buttons */}
          <div className="flex w-full max-w-lg flex-col justify-center gap-3 px-4 sm:flex-row md:gap-4">
            <Link
              href="/game/join"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'text-primary w-full bg-white px-8 py-6 text-lg font-bold shadow-2xl hover:scale-105 hover:bg-white/90 hover:shadow-xl sm:w-auto md:px-10 md:py-7 md:text-xl',
              )}
            >
              Join Game Now
            </Link>
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'hover:text-primary w-full border-2 border-white bg-white/10 px-8 py-6 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white sm:w-auto md:px-10 md:py-7 md:text-xl',
              )}
            >
              Create Your Game
            </Link>
          </div>

          {/* Quick How It Works */}
          <div className="mt-4 flex max-w-3xl flex-col gap-4 px-4 md:flex-row md:gap-6">
            <div className="flex flex-1 items-center gap-3 rounded-lg bg-white/15 px-4 py-3 backdrop-blur-sm md:px-5 md:py-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/25 font-bold text-white">
                1
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white md:text-base">Prepare group with people</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-3 rounded-lg bg-white/15 px-4 py-3 backdrop-blur-sm md:px-5 md:py-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/25 font-bold text-white">
                2
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white md:text-base">Share code with players</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-3 rounded-lg bg-white/15 px-4 py-3 backdrop-blur-sm md:px-5 md:py-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/25 font-bold text-white">
                3
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white md:text-base">Play & learn names and faces</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background px-4 py-12 md:py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center md:mb-16">
            <div className="flex flex-col gap-3 md:gap-4">
              <h2 className="text-gradient-primary text-3xl font-bold sm:text-4xl md:text-5xl">Why Guess Who?</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                The easiest way to help everyone remember names and faces in any group setting
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
            {/* Feature 1 */}
            <Card className="text-center transition-transform hover:scale-105">
              <CardHeader className="flex flex-col gap-4">
                <div className="bg-gradient-primary glow-primary flex size-16 items-center justify-center self-center rounded-2xl">
                  <Icon icon={FaQrcode} size="xl" color="white" />
                </div>
                <CardTitle>Instant Setup</CardTitle>
                <CardDescription>
                  Upload photos, generate a code, and everyone joins in seconds. No app download or accounts required
                  for players.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="text-center transition-transform hover:scale-105">
              <CardHeader className="flex flex-col gap-4">
                <div className="glow-accent to-brand-tertiary flex size-16 items-center justify-center self-center rounded-2xl bg-linear-to-br from-[hsl(217_91%_60%)]">
                  <Icon icon={FaUsers} size="xl" color="white" />
                </div>
                <CardTitle>Everyone Plays</CardTitle>
                <CardDescription>
                  Each person plays on their own device. Only the game host can see progress, while players focus on
                  learning names.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="text-center transition-transform hover:scale-105">
              <CardHeader className="flex flex-col gap-4">
                <div className="glow-success flex size-16 items-center justify-center self-center rounded-2xl bg-[hsl(142_76%_36%)]">
                  <Icon icon={FaTrophy} size="xl" color="white" />
                </div>
                <CardTitle>Remember Names</CardTitle>
                <CardDescription>
                  Repetition builds memory. Players naturally learn and retain names through fun gameplay instead of
                  awkward introductions.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Additional CTA */}
          <div className="mt-16 text-center">
            <Card className="border-primary/50 mx-auto max-w-3xl bg-linear-to-br from-[hsl(240_10%_8%)] to-[hsl(240_10%_4%)]">
              <CardContent className="flex flex-col gap-4 py-12 md:gap-8">
                <h3 className="text-3xl font-bold">Ready to Break the Ice?</h3>
                <p className="text-muted-foreground text-lg">
                  Perfect for teams, classrooms, events, and anywhere people need to connect
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Link href="/game/join" className={buttonVariants({ size: 'lg' })}>
                    Join a Game
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className={buttonVariants({
                      size: 'lg',
                      variant: 'outline',
                    })}
                  >
                    Host Your Own
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border bg-card border-t px-4 py-8">
        <div className="text-muted-foreground container mx-auto flex max-w-6xl flex-col gap-2 text-center">
          <p>© 2026 Guess Who Game. All rights reserved.</p>
          <p className="text-sm">Built with Next.js, Supabase, and Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
