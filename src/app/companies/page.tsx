import * as React from 'react';
import { CompanyList } from '../../components/company/company-list';

export const dynamic = 'force-dynamic';

export default function Home() {
  return <CompanyList />;
}
