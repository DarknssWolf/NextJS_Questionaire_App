'use server';

import { db } from '@/server/db';
import { companyNotificationsTable } from '@/server/db/schema/companyNotifications';
import { supplierNotificationsTable } from '@/server/db/schema/supplierNotifications';
import { eq, and, desc, count } from 'drizzle-orm';
import {
  type NotificationType,
  type NotificationTemplateVariables,
  type NotificationTemplate,
  notificationTemplates,
  notificationTemplatesPlural,
} from '@/types/notification-data';

function replaceNotificationPlaceholders(
  template: string,
  variables: NotificationTemplateVariables
): string {
  let result = template;

  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const placeholder = `{{${key}}}`;
      result = result.replaceAll(placeholder, String(value));
    }
  });

  return result;
}

function getNotificationMessage(
  type: NotificationType,
  variables: NotificationTemplateVariables,
  usePlural = false
): NotificationTemplate {
  const template = usePlural
    ? (notificationTemplatesPlural[type] ?? notificationTemplates[type])
    : notificationTemplates[type];

  return {
    title: replaceNotificationPlaceholders(template.title, variables),
    message: replaceNotificationPlaceholders(template.message, variables),
  };
}

function createNotificationBody(
  type: NotificationType,
  variables: NotificationTemplateVariables
): { title: string; message: string } {
  const usePlural =
    variables.supplierCount !== undefined && variables.supplierCount > 1;

  return getNotificationMessage(type, variables, usePlural);
}

interface NotificationBody {
  title: string;
  message: string;
  count?: number;
}

interface CreateCompanyNotificationParams {
  companyId: number;
  type: NotificationType;
  variables: NotificationTemplateVariables;
}

interface CreateSupplierNotificationParams {
  supplierId: number;
  type: NotificationType;
  variables: NotificationTemplateVariables;
}

export async function createCompanyNotification(
  params: CreateCompanyNotificationParams
): Promise<{
  success: boolean;
  message?: string;
  notificationId?: number;
  updated?: boolean;
}> {
  try {
    if (!params.companyId || params.companyId <= 0) {
      return { success: false, message: 'Invalid company ID' };
    }

    const existingNotification = await db
      .select()
      .from(companyNotificationsTable)
      .where(
        and(
          eq(companyNotificationsTable.companyId, params.companyId),
          eq(companyNotificationsTable.type, params.type),
          eq(companyNotificationsTable.isRead, false)
        )
      )
      .orderBy(desc(companyNotificationsTable.createdAt))
      .limit(1);

    if (existingNotification.length > 0) {
      const existing = existingNotification[0];
      const existingBody = existing.body as NotificationBody;

      let updateVariables: NotificationTemplateVariables;

      if (params.variables.supplierCount !== undefined) {
        const newCount = params.variables.supplierCount;

        updateVariables = { supplierCount: newCount };
      } else if (params.variables.supplierName !== undefined) {
        updateVariables = {
          supplierName: params.variables.supplierName,
        };
      } else {
        const currentCount = existingBody.count ?? 1;
        const newCount = currentCount + 1;

        updateVariables = { supplierCount: newCount };
      }

      const newBody = createNotificationBody(params.type, updateVariables);

      const notificationBody: NotificationBody = {
        ...newBody,
        ...(updateVariables.supplierCount !== undefined
          ? { count: updateVariables.supplierCount }
          : {}),
      };

      const result = await db
        .update(companyNotificationsTable)
        .set({
          body: notificationBody,
          updatedAt: new Date(),
        })
        .where(eq(companyNotificationsTable.id, existing.id))
        .returning({ id: companyNotificationsTable.id });

      if (!result || result.length === 0) {
        return { success: false, message: 'Failed to update notification' };
      }

      return {
        success: true,
        message: 'Notification updated successfully',
        notificationId: result[0].id,
        updated: true,
      };
    }

    const useCount = params.variables.supplierCount !== undefined;
    const body = createNotificationBody(
      params.type,
      useCount
        ? { supplierCount: params.variables.supplierCount ?? 1 }
        : params.variables
    );

    const notificationBody: NotificationBody = {
      ...body,
      ...(useCount ? { count: params.variables.supplierCount ?? 1 } : {}),
    };

    const result = await db
      .insert(companyNotificationsTable)
      .values({
        companyId: params.companyId,
        type: params.type,
        body: notificationBody,
        isRead: false,
      })
      .returning({ id: companyNotificationsTable.id });

    if (!result || result.length === 0) {
      return { success: false, message: 'Failed to create notification' };
    }

    return {
      success: true,
      message: 'Notification created successfully',
      notificationId: result[0].id,
      updated: false,
    };
  } catch (error) {
    console.error('Error creating company notification:', error);
    return {
      success: false,
      message: 'Failed to create company notification',
    };
  }
}

export async function createSupplierNotification(
  params: CreateSupplierNotificationParams
): Promise<{
  success: boolean;
  message?: string;
  notificationId?: number;
  updated?: boolean;
}> {
  try {
    if (!params.supplierId || params.supplierId <= 0) {
      return { success: false, message: 'Invalid supplier ID' };
    }

    const existingNotification = await db
      .select()
      .from(supplierNotificationsTable)
      .where(
        and(
          eq(supplierNotificationsTable.supplierId, params.supplierId),
          eq(supplierNotificationsTable.type, params.type),
          eq(supplierNotificationsTable.isRead, false)
        )
      )
      .orderBy(desc(supplierNotificationsTable.createdAt))
      .limit(1);

    if (existingNotification.length > 0) {
      const existing = existingNotification[0];
      const existingBody = existing.body as NotificationBody;

      const currentCount = existingBody.count ?? 1;
      const newCount = currentCount + 1;

      const newBody = createNotificationBody(params.type, {
        supplierCount: newCount,
      });

      const result = await db
        .update(supplierNotificationsTable)
        .set({
          body: { ...newBody, count: newCount },
          updatedAt: new Date(),
        })
        .where(eq(supplierNotificationsTable.id, existing.id))
        .returning({ id: supplierNotificationsTable.id });

      if (!result || result.length === 0) {
        return { success: false, message: 'Failed to update notification' };
      }

      return {
        success: true,
        message: 'Notification updated successfully',
        notificationId: result[0].id,
        updated: true,
      };
    }

    const useCount = params.variables.supplierCount !== undefined;
    const body = createNotificationBody(
      params.type,
      useCount
        ? { supplierCount: params.variables.supplierCount ?? 1 }
        : params.variables
    );

    const notificationBody: NotificationBody = {
      ...body,
      ...(useCount ? { count: params.variables.supplierCount ?? 1 } : {}),
    };

    const result = await db
      .insert(supplierNotificationsTable)
      .values({
        supplierId: params.supplierId,
        type: params.type,
        body: notificationBody,
        isRead: false,
      })
      .returning({ id: supplierNotificationsTable.id });

    if (!result || result.length === 0) {
      return { success: false, message: 'Failed to create notification' };
    }

    return {
      success: true,
      message: 'Notification created successfully',
      notificationId: result[0].id,
      updated: false,
    };
  } catch (error) {
    console.error('Error creating supplier notification:', error);
    return {
      success: false,
      message: 'Failed to create supplier notification',
    };
  }
}

export async function updateCompanyNotificationReadStatus(
  notificationId: number,
  isRead: boolean
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!notificationId || notificationId <= 0) {
      return { success: false, message: 'Invalid notification ID' };
    }

    const result = await db
      .update(companyNotificationsTable)
      .set({ isRead })
      .where(eq(companyNotificationsTable.id, notificationId))
      .returning({ id: companyNotificationsTable.id });

    if (!result || result.length === 0) {
      return {
        success: false,
        message: 'Notification not found or update failed',
      };
    }

    return {
      success: true,
      message: 'Notification status updated successfully',
    };
  } catch (error) {
    console.error('Error updating company notification status:', error);
    return {
      success: false,
      message: 'Failed to update notification status',
    };
  }
}

export async function updateSupplierNotificationReadStatus(
  notificationId: number,
  isRead: boolean
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!notificationId || notificationId <= 0) {
      return { success: false, message: 'Invalid notification ID' };
    }

    const result = await db
      .update(supplierNotificationsTable)
      .set({ isRead })
      .where(eq(supplierNotificationsTable.id, notificationId))
      .returning({ id: supplierNotificationsTable.id });

    if (!result || result.length === 0) {
      return {
        success: false,
        message: 'Notification not found or update failed',
      };
    }

    return {
      success: true,
      message: 'Notification status updated successfully',
    };
  } catch (error) {
    console.error('Error updating supplier notification status:', error);
    return {
      success: false,
      message: 'Failed to update notification status',
    };
  }
}

export async function markAllCompanyNotificationsAsRead(
  companyId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!companyId || companyId <= 0) {
      return { success: false, message: 'Invalid company ID' };
    }

    await db
      .update(companyNotificationsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(companyNotificationsTable.companyId, companyId),
          eq(companyNotificationsTable.isRead, false)
        )
      );

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  } catch (error) {
    console.error('Error marking all company notifications as read:', error);
    return {
      success: false,
      message: 'Failed to mark all notifications as read',
    };
  }
}

export async function markAllSupplierNotificationsAsRead(
  supplierId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!supplierId || supplierId <= 0) {
      return { success: false, message: 'Invalid supplier ID' };
    }

    await db
      .update(supplierNotificationsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(supplierNotificationsTable.supplierId, supplierId),
          eq(supplierNotificationsTable.isRead, false)
        )
      );

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  } catch (error) {
    console.error('Error marking all supplier notifications as read:', error);
    return {
      success: false,
      message: 'Failed to mark all notifications as read',
    };
  }
}

export async function getCompanyNotifications(companyId: number): Promise<
  Array<{
    id: number;
    companyId: number | null;
    type: NotificationType | null;
    body: NotificationBody;
    isRead: boolean;
    createdAt: Date | null;
    updatedAt: Date | null;
  }>
> {
  try {
    if (!companyId || companyId <= 0) {
      return [];
    }

    const notifications = await db
      .select()
      .from(companyNotificationsTable)
      .where(
        and(
          eq(companyNotificationsTable.companyId, companyId),
          eq(companyNotificationsTable.isRead, false)
        )
      )
      .orderBy(desc(companyNotificationsTable.createdAt))
      .limit(25);

    return notifications.map((notification) => ({
      id: notification.id,
      companyId: notification.companyId,
      type: notification.type,
      body: notification.body as NotificationBody,
      isRead: notification.isRead ?? false,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching company notifications:', error);
    return [];
  }
}

export async function getSupplierNotifications(supplierId: number): Promise<
  Array<{
    id: number;
    supplierId: number | null;
    type: NotificationType | null;
    body: NotificationBody;
    isRead: boolean;
    createdAt: Date | null;
    updatedAt: Date | null;
  }>
> {
  try {
    if (!supplierId || supplierId <= 0) {
      return [];
    }

    const notifications = await db
      .select()
      .from(supplierNotificationsTable)
      .where(
        and(
          eq(supplierNotificationsTable.supplierId, supplierId),
          eq(supplierNotificationsTable.isRead, false)
        )
      )
      .orderBy(desc(supplierNotificationsTable.createdAt))
      .limit(25);

    return notifications.map((notification) => ({
      id: notification.id,
      supplierId: notification.supplierId,
      type: notification.type,
      body: notification.body as NotificationBody,
      isRead: notification.isRead ?? false,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching supplier notifications:', error);
    return [];
  }
}

export async function getCompanyNotificationUnreadCount(
  companyId: number
): Promise<number> {
  try {
    if (!companyId || companyId <= 0) {
      return 0;
    }

    const result = await db
      .select({ count: count() })
      .from(companyNotificationsTable)
      .where(
        and(
          eq(companyNotificationsTable.companyId, companyId),
          eq(companyNotificationsTable.isRead, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching company notification unread count:', error);
    return 0;
  }
}

export async function getSupplierNotificationUnreadCount(
  supplierId: number
): Promise<number> {
  try {
    if (!supplierId || supplierId <= 0) {
      return 0;
    }

    const result = await db
      .select({ count: count() })
      .from(supplierNotificationsTable)
      .where(
        and(
          eq(supplierNotificationsTable.supplierId, supplierId),
          eq(supplierNotificationsTable.isRead, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching supplier notification unread count:', error);
    return 0;
  }
}
