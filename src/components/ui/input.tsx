import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

import { fieldVariants } from '@/components/ui/field';
import { cn } from '@/lib/utils';

export type InputProps = React.ComponentProps<'input'> &
  VariantProps<typeof fieldVariants>;

const Input = ({ className, type, variant, ...props }: InputProps) => {
  return (
    <input
      type={type}
      className={cn(fieldVariants({ variant, className }))}
      {...props}
    />
  );
};

export { Input };
