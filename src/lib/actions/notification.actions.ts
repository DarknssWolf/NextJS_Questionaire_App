'use server';

import {
  getCompanyNotifications,
  updateCompanyNotificationReadStatus,
  markAllCompanyNotificationsAsRead,
  getCompanyNotificationUnreadCount,
} from '@/server/services/notification.service';
import { getCompanyIdCookie } from '@/lib/cookies';

export async function getCompanyNotificationsAction() {
  const companyId = await getCompanyIdCookie();
  if (!companyId) {
    return [];
  }
  return await getCompanyNotifications(companyId);
}

export async function updateNotificationReadStatusAction(
  notificationId: number,
  isRead: boolean
) {
  return await updateCompanyNotificationReadStatus(notificationId, isRead);
}

export async function markAllNotificationsAsReadAction() {
  const companyId = await getCompanyIdCookie();
  if (!companyId) {
    return { success: false, message: 'Company ID not found' };
  }
  return await markAllCompanyNotificationsAsRead(companyId);
}

export async function getNotificationUnreadCountAction() {
  const companyId = await getCompanyIdCookie();
  if (!companyId) {
    return 0;
  }
  return await getCompanyNotificationUnreadCount(companyId);
}
