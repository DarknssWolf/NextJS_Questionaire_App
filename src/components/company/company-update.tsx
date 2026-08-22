'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { updateCompany } from '../../server/services/company.service';

type Company = {
  id: number;
  name: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Updating...' : 'Update Company'}
    </Button>
  );
}

export function CompanyUpdate({ company }: { company: Company }) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpdateCompany(formData: FormData) {
    setError(null);
    const result = await updateCompany(formData);

    if (result.error) {
      setError(result.error);
    } else {
      toast.success('Company updated successfully');
      router.push('/companies');
    }
  }

  if (!company) {
    return <p>Company not found.</p>;
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Update Company</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleUpdateCompany} className="space-y-6">
          <input type="hidden" name="id" value={company.id} />
          <div className="space-y-2">
            <Label htmlFor={`name-${company.id}`}>Company Name</Label>
            <Input
              id={`name-${company.id}`}
              name="name"
              defaultValue={company.name}
              placeholder="Enter company name"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-between">
            <SubmitButton />
            <Button variant="outline" asChild>
              <Link href="/companies">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
