import { cva } from 'class-variance-authority';

// bg-card is deliberate, not Shadcn's bg-transparent: --background is not white here, so transparent fields render beige
export const fieldVariants = cva(
  'w-full disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-input bg-card file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 rounded-md border px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-hidden md:text-sm',
        brand:
          'border-input bg-card max-w-md rounded-lg border px-4 py-2 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-hidden',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
