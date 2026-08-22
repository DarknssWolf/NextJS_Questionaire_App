export enum NotificationType {
  supplier_added = 'supplier_added',
  submission_completed = 'submission_completed',
  submission_reminder = 'submission_reminder',
  submission_auto_submitted = 'submission_auto_submitted',
  submission_not_started = 'submission_not_started',
}

export interface NotificationTemplateVariables {
  supplierName?: string;
  supplierCount?: number;
  [key: string]: string | number | undefined;
}

export interface NotificationTemplate {
  title: string;
  message: string;
}

export const notificationTemplates: Record<
  NotificationType,
  NotificationTemplate
> = {
  [NotificationType.supplier_added]: {
    title: 'New Supplier Added',
    message: '{{supplierName}} has been added to your account',
  },
  [NotificationType.submission_completed]: {
    title: 'Questionnaire Completed',
    message: '{{supplierName}} has completed their questionnaire',
  },
  [NotificationType.submission_reminder]: {
    title: 'Questionnaire Reminder',
    message: '{{supplierName}} has still not started their questionnaire',
  },
  [NotificationType.submission_auto_submitted]: {
    title: 'Questionnaires Auto-Submitted',
    message: '{{supplierCount}} suppliers have been auto submitted',
  },
  [NotificationType.submission_not_started]: {
    title: 'Questionnaire Not Started',
    message:
      '{{supplierCount}} suppliers have still not started their questionnaires',
  },
};

export const notificationTemplatesPlural: Partial<
  Record<NotificationType, NotificationTemplate>
> = {
  [NotificationType.submission_completed]: {
    title: 'Questionnaires Completed',
    message: '{{supplierCount}} suppliers have completed their questionnaires',
  },
  [NotificationType.submission_reminder]: {
    title: 'Questionnaire Reminders',
    message:
      '{{supplierCount}} suppliers have questionnaires due to be auto submitted in the next 14 days',
  },
};
