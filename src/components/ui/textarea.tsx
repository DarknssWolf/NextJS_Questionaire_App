import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

import { fieldVariants } from '@/components/ui/field';
import { cn } from '@/lib/utils';

export type TextareaProps = React.ComponentProps<'textarea'> &
  VariantProps<typeof fieldVariants>;

const Textarea = ({ className, variant, ...props }: TextareaProps) => {
  return (
    <textarea
      className={cn(fieldVariants({ variant, className }))}
      {...props}
    />
  );
};

export { Textarea };
