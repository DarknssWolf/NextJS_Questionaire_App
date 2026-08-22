import {
  type ActiveStep,
  DOCUMENTATION_STEP,
  type Section,
} from '@/models/Question';
import { useMemo } from 'react';

export interface SidebarItem {
  id: ActiveStep;
  name: string;
  isComplete: boolean;
}

export const useSidebarItems = (
  sections: Section[],
  isDocumentationComplete: () => boolean
) => {
  const sidebarItems = useMemo<SidebarItem[]>(
    () => [
      ...sections.map((section) => ({
        id: section.id,
        name: section.title,
        isComplete: section.isComplete ?? false,
      })),
      {
        id: DOCUMENTATION_STEP,
        name: 'Documentation',
        isComplete: isDocumentationComplete(),
      },
    ],
    [sections, isDocumentationComplete]
  );

  return { sidebarItems };
};
