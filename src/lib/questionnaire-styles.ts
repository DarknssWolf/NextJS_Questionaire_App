import { cn } from '@/lib/utils';

export const getSidebarItemClasses = (
  isActive: boolean,
  isComplete: boolean
) => {
  return cn(
    'relative w-full px-6 py-4 text-left font-medium transition-colors',
    isActive && 'bg-brand-500 text-white',
    isComplete && !isActive && 'text-brand-500',
    !isActive && !isComplete && 'text-gray-700 hover:bg-gray-200'
  );
};

export const getQuestionStatusClasses = (isCompleted: boolean) => {
  return cn('mt-1', isCompleted ? 'text-brand-500' : 'text-gray-300');
};

export const getDocumentIconClasses = (isCompleted: boolean) => {
  return cn(
    'mt-1 h-5 w-5 flex-shrink-0',
    isCompleted ? 'text-accent-info' : 'text-accent-warning'
  );
};

export const getDocumentStatClasses = (type: 'uploaded' | 'missing') => {
  return cn(
    'flex items-center',
    type === 'uploaded' ? 'text-accent-info' : 'text-accent-warning'
  );
};
