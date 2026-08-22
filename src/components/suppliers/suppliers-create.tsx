'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SuppliersForm from '@/components/suppliers/suppliers-form';
import SuppliersBulkUpload from './suppliers-bulk-upload';

export default function SuppliersCreate() {
  const [activeTab, setActiveTab] = useState<'bulk' | 'manual'>('bulk');

  return (
    <>
      <div className="mb-6 flex gap-2 rounded-full bg-gray-100 p-1 shadow-xs">
        <Button
          variant={activeTab === 'bulk' ? 'default' : 'ghost'}
          className={`rounded-full px-6 py-2 ${
            activeTab === 'bulk'
              ? 'bg-slate-700 text-white hover:bg-slate-800'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('bulk')}
        >
          Bulk Upload Suppliers
        </Button>
        <Button
          variant={activeTab === 'manual' ? 'default' : 'ghost'}
          className={`rounded-full px-6 py-2 ${
            activeTab === 'manual'
              ? 'bg-slate-700 text-white hover:bg-slate-800'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('manual')}
        >
          Manual Load Suppliers
        </Button>
      </div>
      {activeTab === 'bulk' ? <SuppliersBulkUpload /> : <SuppliersForm />}
    </>
  );
}
