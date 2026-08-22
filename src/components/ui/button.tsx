import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 text-base-700 text-button-m',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'p-4 border-2 border-base-700 bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        brand:
          'p-4 rounded-full border-2 bg-brand-500 border-brand-500 hover:bg-brand-400 hover:border-brand-400 text-white',
        brandSolid: 'bg-brand-500 text-white hover:bg-brand-600',
        brandOutline:
          'border-2 border-brand-500 text-brand-500 hover:bg-brand-500/10',
        tab: 'mr-2 font-medium text-accent-info hover:bg-accent-info/10 data-[state=active]:bg-accent-info data-[state=active]:text-white',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-8 rounded-full px-3 text-xs',
        lg: 'h-10 rounded-full px-8',
        icon: 'h-9 w-9',
        pill: 'px-6 py-2',
        pillCompact: 'gap-1 border px-4 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = ({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
};

export { Button, buttonVariants };
