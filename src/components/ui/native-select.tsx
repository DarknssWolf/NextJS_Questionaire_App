import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

import { fieldVariants } from '@/components/ui/field';
import { cn } from '@/lib/utils';

export type NativeSelectProps = React.ComponentProps<'select'> &
  VariantProps<typeof fieldVariants>;

const NativeSelect = ({ className, variant, ...props }: NativeSelectProps) => {
  return (
    <select
      className={cn(fieldVariants({ variant }), 'text-foreground', className)}
      {...props}
    />
  );
};

export { NativeSelect };
