import { cn } from '@/lib/utils';

type OmniPuntoLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showSlogan?: boolean;
  inverted?: boolean;
};

export function OmniPuntoLogo({
  className,
  iconClassName,
  textClassName,
  showSlogan = false,
  inverted = false,
}: OmniPuntoLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label="OmniPunto"
        className={cn('h-10 w-10', iconClassName)}
      >
        <defs>
          <linearGradient id="omnipuntoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#omnipuntoGradient)" />
        <circle cx="32" cy="28" r="12" fill="white" fillOpacity="0.95" />
        <circle cx="32" cy="28" r="6" fill="#1d4ed8" />
        <path d="M32 42l-8 10h16l-8-10z" fill="white" />
      </svg>

      <div className={cn('leading-tight', textClassName)}>
        <p className={cn('text-xl font-black tracking-tight', inverted ? 'text-white' : 'text-slate-900')}>
          OmniPunto
        </p>
        {showSlogan && (
          <p className={cn('text-xs font-medium', inverted ? 'text-slate-200' : 'text-slate-600')}>
            La plataforma que se adapta a tu negocio.
          </p>
        )}
      </div>
    </div>
  );
}
