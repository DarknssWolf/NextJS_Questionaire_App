'use client';
import { type ReactNode, createContext, useContext, useState } from 'react';

interface SupplierContextType {
  supplierParams: Record<string, string>;
  setSupplierParams: (params: Record<string, string>) => void;
  companyId: number;
}

const SupplierContext = createContext<SupplierContextType | undefined>(
  undefined
);

export function SupplierContextProvider({
  children,
  companyId,
}: {
  children: ReactNode;
  companyId: number;
}) {
  const [supplierParams, setSupplierParams] = useState<Record<string, string>>(
    {}
  );

  return (
    <SupplierContext.Provider
      value={{
        supplierParams,
        setSupplierParams,
        companyId,
      }}
    >
      {children}
    </SupplierContext.Provider>
  );
}

export const useSupplierContext = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error(
      'useSupplierContext must be used within SupplierContextProvider'
    );
  }
  return context;
};
