import { QuestionnaireContextProvider } from '@/providers/questionnaire/QuestionnaireContextProvider';
import { getSupplierById } from '@/server/services/questionnaire.service';
import { getSupplierIdFromMetadata } from '@/lib/auth/session';

export async function QuestionnaireDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supplierId = await getSupplierIdFromMetadata();

  if (!supplierId) {
    return <div>Supplier details not found</div>;
  }

  const { success, data, message } = await getSupplierById(Number(supplierId));

  if (!success || !data) {
    return <div>{message}</div>;
  }

  return (
    <QuestionnaireContextProvider supplierDetails={data}>
      {children}
    </QuestionnaireContextProvider>
  );
}
