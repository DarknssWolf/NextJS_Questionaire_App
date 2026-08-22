'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getCompanyNotificationsAction,
  updateNotificationReadStatusAction,
  markAllNotificationsAsReadAction,
  getNotificationUnreadCountAction,
} from '@/lib/actions/notification.actions';
import { NotificationType } from '@/types/notification-data';

interface Notification {
  id: number;
  title: string;
  message: string;
  timestamp: Date | null;
  isRead: boolean;
  type?: 'info' | 'warning' | 'success' | 'error';
}

interface NotificationComponentProps {
  className?: string;
}

const mapNotificationType = (
  type: NotificationType | null | undefined
): 'info' | 'warning' | 'success' | 'error' => {
  switch (type) {
    case NotificationType.supplier_added:
      return 'info';
    case NotificationType.submission_completed:
      return 'success';
    case NotificationType.submission_reminder:
      return 'warning';
    case NotificationType.submission_auto_submitted:
      return 'info';
    default:
      return 'info';
  }
};

export function NotificationComponent({
  className,
}: NotificationComponentProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setIsLoading(true);
        const [fetchedNotifications, count] = await Promise.all([
          getCompanyNotificationsAction(),
          getNotificationUnreadCountAction(),
        ]);

        const mappedNotifications: Notification[] = fetchedNotifications.map(
          (n) => ({
            id: n.id,
            title: n.body.title,
            message: n.body.message,
            timestamp: n.createdAt ? new Date(n.createdAt) : null,
            isRead: n.isRead,
            type: mapNotificationType(n.type),
          })
        );

        setNotifications(mappedNotifications);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchNotifications();
  }, []);

  useEffect(() => {
    if (isOpen) {
      async function refreshNotifications() {
        try {
          const [fetchedNotifications, count] = await Promise.all([
            getCompanyNotificationsAction(),
            getNotificationUnreadCountAction(),
          ]);

          const mappedNotifications: Notification[] = fetchedNotifications.map(
            (n) => ({
              id: n.id,
              title: n.body.title,
              message: n.body.message,
              timestamp: n.createdAt,
              isRead: n.isRead,
              type: mapNotificationType(n.type),
            })
          );

          setNotifications(mappedNotifications);
          setUnreadCount(count);
        } catch (error) {
          console.error('Error refreshing notifications:', error);
        }
      }

      void refreshNotifications();
    }
  }, [isOpen]);

  const handleNotificationClick = async (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await updateNotificationReadStatusAction(notificationId, true);
    } catch (error) {
      console.error('Error updating notification status:', error);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    const previousUnreadCount = unreadCount;
    setUnreadCount(0);

    try {
      const result = await markAllNotificationsAsReadAction();
      if (!result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: false })));
        setUnreadCount(previousUnreadCount);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: false })));
      setUnreadCount(previousUnreadCount);
    }
  };

  const formatTimestamp = (date: Date | null): string => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationTypeColor = (type?: string): string => {
    switch (type) {
      case 'success':
        return 'bg-risk-green';
      case 'warning':
        return 'bg-risk-yellow';
      case 'error':
        return 'bg-risk-red';
      default:
        return 'bg-accent-info';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('relative', className)}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[400px] w-80 overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="text-muted-foreground px-2 py-6 text-center text-sm">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-muted-foreground px-2 py-6 text-center text-sm">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              className={cn(
                'flex cursor-pointer flex-col items-start gap-1 !border-0 p-3 !outline-none',
                'focus:!border-0 focus:!outline-none focus-visible:!border-0 focus-visible:!outline-none',
                'hover:!border-0 active:!border-0',
                !notification.isRead && 'bg-muted/50'
              )}
            >
              <div className="flex w-full items-start gap-2 border-0">
                <div
                  className={cn(
                    'mt-1 h-2 w-2 flex-shrink-0 rounded-full',
                    getNotificationTypeColor(notification.type)
                  )}
                />
                <div className="min-w-0 flex-1 border-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="bg-primary h-2 w-2 flex-shrink-0 rounded-full" />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {notification.message}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        {!isLoading && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-muted-foreground cursor-pointer justify-center text-center text-sm"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
