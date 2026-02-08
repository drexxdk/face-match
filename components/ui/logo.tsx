import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  href?: string;
}

export function Logo({ className, showText = true, href = '/' }: LogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo Icon - Stylized Question Mark */}
      <div className="relative flex items-center justify-center">
        <div className="bg-gradient-primary absolute inset-0 rounded-xl opacity-50 blur-md" />
        <div className="bg-gradient-primary relative flex size-10 items-center justify-center rounded-xl p-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="size-6 text-white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Question mark in circle */}
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-gradient-primary text-xl font-extrabold">Guess Who</span>
          <span className="text-muted-foreground text-xs font-medium tracking-wider">GAME</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition-transform hover:scale-105 active:scale-95">
        {content}
      </Link>
    );
  }

  return content;
}

// Compact version for mobile
export function LogoCompact({ className }: { className?: string }) {
  return <Logo className={className} showText={false} />;
}
