import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export enum TitleWeight {
  Normal = 'normal',
  Bold = 'bold',
}

interface CardComponentProps {
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  contentSize?: string;
  footer?: ReactNode;
  titleWeight?: TitleWeight;
  cardPadding?: string;
}

const CardComponent = ({
  title,
  icon,
  content,
  footer,
  titleWeight = TitleWeight.Bold,
  contentSize = 'text-3xl',
  cardPadding,
}: CardComponentProps) => {
  return (
    <Card className={cn(cardPadding, 'flex h-full flex-col')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle
          className={cn(
            'text-brand-dark text-lg',
            titleWeight === TitleWeight.Bold ? 'font-bold' : 'font-normal'
          )}
        >
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-start">
        <div className={cn(contentSize, 'text-brand-dark font-bold')}>
          {content}
        </div>
      </CardContent>
      {footer && <CardFooter className="flex gap-2">{footer}</CardFooter>}
    </Card>
  );
};

export { CardComponent };
