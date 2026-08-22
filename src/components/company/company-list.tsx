import { getCompanies } from '../../server/services/company.service';
import { CompanyDelete } from './company-delete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export async function CompanyList() {
  let companies: Awaited<ReturnType<typeof getCompanies>>;
  try {
    companies = await getCompanies();
  } catch (error) {
    console.error(error);

    return (
      <div className="text-center text-red-500">Failed to load companies.</div>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Companies</CardTitle>
        <Button asChild>
          <Link href="/companies/create">Add Company</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center">
            No companies found
          </p>
        ) : (
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between rounded-md border p-4"
              >
                <span className="font-medium">{company.name}</span>
                <div className="flex space-x-2">
                  <Button asChild variant="outline">
                    <Link href={`/companies/update/${company.id}`}>Update</Link>
                  </Button>
                  <CompanyDelete company={company} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
