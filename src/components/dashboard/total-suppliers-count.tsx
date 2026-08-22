'use client';

import { Plus, Users } from 'lucide-react';
import { CardComponent } from '../card-component';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

type TotalSuppliersCountProps = {
  totalSuppliersCountPromise: Promise<number>;
};

export const TotalSuppliersCount = ({
  totalSuppliersCountPromise,
}: TotalSuppliersCountProps) => {
  const count = use(totalSuppliersCountPromise);

  return (
    <CardComponent
      title="Total Suppliers"
      icon={<Users className="text-muted-foreground h-5 w-5" />}
      content={count}
      contentSize="text-5xl"
      cardPadding="p-6"
      footer={
        <>
          <Link href="/suppliers/load">
            <Button variant="brand" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </Link>
          <Link href="/suppliers">
            <Button variant="outline">View</Button>
          </Link>
        </>
      }
    />
  );
};

export const TotalSuppliersCountLoading = () => {
  return <Skeleton className="h-72 w-full" />;
};
