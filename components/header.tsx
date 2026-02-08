import { AuthButton } from '@/components/auth-button';
import { Logo, LogoCompact } from '@/components/ui/logo';

interface HeaderProps {
  showAuth?: boolean;
}

export function Header({ showAuth = true }: HeaderProps) {
  return (
    <header className="h-header border-border/50 via-card sticky top-0 z-50 flex items-center justify-center border-b bg-linear-to-r from-[hsl(240_10%_4%)] to-[hsl(240_10%_4%)] px-4 backdrop-blur-sm md:px-8">
      <div className="flex w-full max-w-5xl items-center justify-between gap-4">
        {/* Show compact logo on mobile, full logo on desktop */}
        <div className="md:hidden">
          <LogoCompact />
        </div>
        <div className="hidden md:block">
          <Logo />
        </div>
        {showAuth && <AuthButton />}
      </div>
    </header>
  );
}
