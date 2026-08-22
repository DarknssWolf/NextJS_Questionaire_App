'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EvaluationRiskLevel, EvaluationStatus } from '@/enums/evaluation';
import { getRiskLevelLabel } from '@/lib/evaluation-utils';
import { type CompanySupplierSummary } from '@/models/Supplier';
import { Download, Search, X } from 'lucide-react';

type SuppliersFiltersProps = {
  filters: {
    search: string;
    spendCategory: string;
    industry: string;
    country: string;
    riskLevel: EvaluationRiskLevel;
    completionStatus: EvaluationStatus;
  };
  onFilterChange: (filters: SuppliersFiltersProps['filters']) => void;
  suppliers: CompanySupplierSummary[];
  onExportFilteredList: () => void;
};

export default function SuppliersFilters({
  filters,
  onFilterChange,
  suppliers,
  onExportFilteredList,
}: SuppliersFiltersProps) {
  const spendCategories = Array.from(
    new Set(suppliers.map((s) => s.spendCategory))
  ).filter(Boolean);
  const industries = Array.from(
    new Set(suppliers.map((s) => s.industry))
  ).filter(Boolean);
  const countries = Array.from(new Set(suppliers.map((s) => s.country))).filter(
    Boolean
  );
  const riskLevels = Array.from(
    new Set(suppliers.map((s) => s.riskLevel))
  ).filter(Boolean);

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      spendCategory: 'all',
      industry: 'all',
      country: 'all',
      riskLevel: EvaluationRiskLevel.ALL,
      completionStatus: EvaluationStatus.ALL,
    });
  };
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative max-w-md flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          placeholder="search"
          className="rounded-full pl-10"
          value={filters.search}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
        />
      </div>
      <div className="flex items-center gap-3">
        <Select
          value={filters.spendCategory}
          onValueChange={(value) =>
            onFilterChange({ ...filters, spendCategory: value })
          }
        >
          <SelectTrigger className="bg-card w-40 rounded-full">
            <SelectValue placeholder="spend category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {spendCategories.map((category) => (
              <SelectItem key={category} value={category ?? ''}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.industry}
          onValueChange={(value) =>
            onFilterChange({ ...filters, industry: value })
          }
        >
          <SelectTrigger className="w-32 rounded-full bg-white">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry ?? ''}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.country}
          onValueChange={(value) =>
            onFilterChange({ ...filters, country: value })
          }
        >
          <SelectTrigger className="bg-card w-40 rounded-full">
            <SelectValue placeholder="country/region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country ?? ''}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.riskLevel}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              riskLevel: value as EvaluationRiskLevel,
            })
          }
        >
          <SelectTrigger className="w-32 rounded-full bg-white">
            <SelectValue placeholder="risk level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Levels</SelectItem>
            {riskLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {getRiskLevelLabel(level)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.completionStatus}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              completionStatus: value as EvaluationStatus,
            })
          }
        >
          <SelectTrigger className="bg-card w-40 rounded-full">
            <SelectValue placeholder="completion status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EvaluationStatus.ALL}>All Statuses</SelectItem>
            <SelectItem value={EvaluationStatus.INVITE_SENT}>
              Invite Sent
            </SelectItem>
            <SelectItem value={EvaluationStatus.NOT_STARTED}>
              Not Started
            </SelectItem>
            <SelectItem value={EvaluationStatus.IN_PROGRESS}>
              In Progress
            </SelectItem>
            <SelectItem value={EvaluationStatus.COMPLETED}>
              Completed
            </SelectItem>
            <SelectItem value={EvaluationStatus.AUTO_SUBMITTED}>
              Auto Submitted
            </SelectItem>
          </SelectContent>
        </Select>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="ml-2 rounded-full p-2"
                onClick={onExportFilteredList}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="border border-gray-200 bg-white text-black">
              <p>Download filtered list of suppliers</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="outline"
          className="ml-2 rounded-full p-2"
          onClick={handleClearFilters}
          title="Clear Filters"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
