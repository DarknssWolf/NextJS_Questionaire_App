'use client';
import { type QuestionnaireSupplierDetails } from '@/models/Supplier';
import { type ReactNode, createContext, useContext, useState } from 'react';

interface QuestionnaireContextType {
  questionnaireParams: Record<string, object>;
  setQuestionnaireParams: (params: Record<string, object>) => void;
  supplierDetails: QuestionnaireSupplierDetails;
}

const QuestionnaireContext = createContext<
  QuestionnaireContextType | undefined
>(undefined);

export function QuestionnaireContextProvider({
  children,
  supplierDetails,
}: {
  children: ReactNode;
  supplierDetails: QuestionnaireSupplierDetails;
}) {
  const [questionnaireParams, setQuestionnaireParams] = useState<
    Record<string, object>
  >({});

  return (
    <QuestionnaireContext.Provider
      value={{
        questionnaireParams,
        setQuestionnaireParams,
        supplierDetails,
      }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
}

export const useQuestionnaireContext = () => {
  const context = useContext(QuestionnaireContext);
  if (!context) {
    throw new Error(
      'useQuestionnaireContext must be used within QuestionnaireContextProvider'
    );
  }
  return context;
};
