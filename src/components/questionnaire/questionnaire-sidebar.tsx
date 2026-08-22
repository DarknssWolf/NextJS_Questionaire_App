import { type SidebarItem } from '@/hooks/questionnaire/use-sidebar-items';
import { cn } from '@/lib/utils';
import { type ActiveStep } from '@/models/Question';
import { getSidebarItemClasses } from '@/lib/questionnaire-styles';
import { Check } from 'lucide-react';

interface QuestionnaireSidebarProps {
  sidebarItems: SidebarItem[];
  activeStep: ActiveStep;
  onStepChange: (step: ActiveStep) => void;
}

export default function QuestionnaireSidebar({
  sidebarItems,
  activeStep,
  onStepChange,
}: QuestionnaireSidebarProps) {
  return (
    <div className="bg-muted w-56 flex-shrink-0">
      {sidebarItems.map((item) => {
        const isActive = activeStep === item.id;

        return (
          <button
            key={String(item.id)}
            onClick={() => onStepChange(item.id)}
            className={getSidebarItemClasses(isActive, item.isComplete)}
          >
            <div className="flex items-center justify-between">
              <span>{item.name}</span>
              {item.isComplete && (
                <Check
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-white' : 'text-brand-500'
                  )}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
