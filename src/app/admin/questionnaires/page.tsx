import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listQuestionnaires } from '@/server/services/questionnaire-admin.service';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminQuestionnairesPage() {
  const questionnaires = await listQuestionnaires();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Questionnaires</h1>
          <p className="text-muted-foreground">
            One version is active at a time — that is the one suppliers answer.
          </p>
        </div>
        <Button variant="brandSolid" size="pill" asChild>
          <Link href="/admin/questionnaires/upload">
            <PlusIcon />
            Upload questionnaire
          </Link>
        </Button>
      </div>

      {questionnaires.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="font-medium">No questionnaires yet</p>
            <p className="text-muted-foreground">
              Upload a semicolon-delimited CSV to publish the first one.
            </p>
            <Button variant="brandOutline" size="pill" asChild>
              <Link href="/admin/questionnaires/upload">
                Upload questionnaire
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionnaires.map((questionnaire) => (
                  <TableRow key={questionnaire.id}>
                    <TableCell className="font-medium">
                      {questionnaire.name}
                    </TableCell>
                    <TableCell>v{questionnaire.version}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          questionnaire.status === 'active'
                            ? 'statusCompleted'
                            : 'statusNotStarted'
                        }
                      >
                        {questionnaire.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{questionnaire.sectionCount}</TableCell>
                    <TableCell>{questionnaire.questionCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {questionnaire.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="pillCompact" asChild>
                        <Link
                          href={`/admin/questionnaires/${questionnaire.id}`}
                        >
                          View &amp; edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
