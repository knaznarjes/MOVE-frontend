/* eslint-disable arrow-parens */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable curly */
// notification.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Notification } from 'app/core/models/models';
import { AuthService } from 'app/core/services/auth.service';
import { NotificationService } from 'app/core/services/notification.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  @Input() notifications: Notification[] = [];
  @Input() showActions: boolean = true;
  @Input() maxNotifications: number = 10;
  @Input() autoConnect: boolean = true;
  @Output() notificationDeleted = new EventEmitter<string>();
  @Output() notificationClicked = new EventEmitter<Notification>();
  @Output() notificationReceived = new EventEmitter<Notification>();

  loading = false;
  error: string | null = null;
  isConnected = false;
  unreadCount = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    if (this.autoConnect) {
      this.connectToWebSocket();
    }
    this.setupRealtimeNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.notificationService.disconnect();
  }

  /**
   * Load user notifications from API
   */
  loadNotifications(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.error = 'Authentication required';
      return;
    }

    this.loading = true;
    this.error = null;

    const userSub = this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (!user || !user.id) {
          this.loading = false;
          this.error = 'User information not available';
          return;
        }

        const notifSub = this.notificationService.getNotificationsByUser(user.id, token).subscribe({
          next: (notifications) => {
            this.notifications = notifications
              .slice(0, this.maxNotifications)
              .map(notif => ({
                ...notif,
                read: this.isNotificationRead(notif)
              }));

            this.updateUnreadCount();
            this.loading = false;
          },
          error: (error) => {
            console.error('Failed to load notifications:', error);
            this.error = 'Failed to load notifications';
            this.loading = false;
          }
        });

        this.subscriptions.push(notifSub);
      },
      error: (error) => {
        console.error('Failed to get current user:', error);
        this.error = 'Failed to get user information';
        this.loading = false;
      }
    });

    this.subscriptions.push(userSub);
  }

  /**
   * Connect to WebSocket for real-time notifications
   */
  connectToWebSocket(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const userSub = this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id) {
          this.notificationService.connect(user.id, token);
          this.isConnected = true;
        }
      },
      error: (error) => {
        console.error('Failed to connect to WebSocket:', error);
        this.isConnected = false;
      }
    });

    this.subscriptions.push(userSub);
  }

  /**
   * Setup real-time notification listener
   */
  setupRealtimeNotifications(): void {
    const realtimeSub = this.notificationService.onNotification().subscribe({
      next: (notification) => {
        // Add new notification to the beginning of the list
        this.notifications.unshift({
          ...notification,
          read: false
        });

        // Keep only max notifications
        if (this.notifications.length > this.maxNotifications) {
          this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        this.updateUnreadCount();
        this.notificationReceived.emit(notification);

        // Optional: Show browser notification if permission granted
        this.showBrowserNotification(notification);
      },
      error: (error) => {
        console.error('Real-time notification error:', error);
      }
    });

    this.subscriptions.push(realtimeSub);
  }

  /**
   * Get icon based on notification type with enhanced mapping
   */
  getNotificationIcon(type?: string): string {
    switch (type?.toUpperCase()) {
      case 'COMMENT':
        return 'comment';
      case 'LIKE':
        return 'favorite';
      case 'FOLLOW':
        return 'person_add';
      case 'CONTENT':
        return 'article';
      case 'SYSTEM':
        return 'info';
      case 'WARNING':
        return 'warning';
      case 'SUCCESS':
        return 'check_circle';
      case 'ERROR':
        return 'error';
      default:
        return 'notifications';
    }
  }

  /**
   * Get notification type label with enhanced mapping
   */
  getTypeLabel(type?: string): string {
    switch (type?.toUpperCase()) {
      case 'COMMENT':
        return 'Commentaire';
      case 'LIKE':
        return 'J\'aime';
      case 'FOLLOW':
        return 'Abonnement';
      case 'CONTENT':
        return 'Contenu';
      case 'SYSTEM':
        return 'Système';
      case 'WARNING':
        return 'Attention';
      case 'SUCCESS':
        return 'Succès';
      case 'ERROR':
        return 'Erreur';
      default:
        return 'Notification';
    }
  }

  /**
   * Get notification type class for styling
   */
  getTypeClass(type?: string): string {
    switch (type?.toUpperCase()) {
      case 'LIKE':
        return 'type-like';
      case 'COMMENT':
        return 'type-comment';
      case 'FOLLOW':
        return 'type-follow';
      case 'CONTENT':
        return 'type-content';
      case 'WARNING':
        return 'type-warning';
      case 'ERROR':
        return 'type-error';
      case 'SUCCESS':
        return 'type-success';
      case 'SYSTEM':
        return 'type-system';
      default:
        return 'type-default';
    }
  }

  /**
   * Format timestamp to relative time with enhanced formatting
   */
  getRelativeTime(timestamp?: string): string {
    if (!timestamp) return 'À l\'instant';

    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMs = now.getTime() - notificationTime.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;

    return notificationTime.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Handle notification click
   */
  onNotificationClick(notification: Notification): void {
    // Mark as read
    this.markAsRead(notification);
    this.notificationClicked.emit(notification);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notification: Notification): void {
    if (!notification.read) {
      notification.read = true;
      this.updateUnreadCount();
      // You could call an API to mark as read on the server
      // this.notificationService.markAsRead(notification.id, token);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(notif => {
      if (!notif.read) {
        notif.read = true;
      }
    });
    this.updateUnreadCount();
  }

  /**
   * Delete notification
   */
  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();

    if (!notification.id) return;

    const token = this.authService.getToken();
    if (!token) return;

    const deleteSub = this.notificationService.deleteNotification(notification.id, token).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        this.updateUnreadCount();
        this.notificationDeleted.emit(notification.id);
      },
      error: (error) => {
        console.error('Failed to delete notification:', error);
        this.error = 'Impossible de supprimer la notification';
      }
    });

    this.subscriptions.push(deleteSub);
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const deletePromises = this.notifications
      .filter(n => n.id)
      .map(n => this.notificationService.deleteNotification(n.id!, token).toPromise());

    Promise.all(deletePromises).then(() => {
      this.notifications = [];
      this.updateUnreadCount();
    }).catch((error) => {
      console.error('Failed to clear notifications:', error);
      this.error = 'Impossible de supprimer toutes les notifications';
    });
  }

  /**
   * Refresh notifications
   */
  refreshNotifications(): void {
    this.loadNotifications();
  }

  /**
   * Send test notification
   */
  sendTestNotification(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const testSub = this.notificationService.sendTestNotification('Test notification message', token).subscribe({
      next: (response) => {
        console.log('Test notification sent:', response);
      },
      error: (error) => {
        console.error('Failed to send test notification:', error);
      }
    });

    this.subscriptions.push(testSub);
  }

  /**
   * Track by function for ngFor performance
   */
  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id || index.toString();
  }

  /**
   * Check if notification is read (implement your logic)
   */
  private isNotificationRead(notification: Notification): boolean {
    // You can implement your read status logic here
    // For now, assume all are unread by default
    return false;
  }

  /**
   * Update unread count
   */
  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  /**
   * Show browser notification if permission granted
   */
  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(this.getTypeLabel(notification.type), {
        body: notification.message,
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/badge-icon.png'
      });
    }
  }

  /**
   * Request browser notification permission
   */
  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    return this.isConnected ? 'Connecté' : 'Déconnecté';
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): number {
    return this.unreadCount;
  }
}
