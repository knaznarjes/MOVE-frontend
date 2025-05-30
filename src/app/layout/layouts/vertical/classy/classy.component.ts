/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable arrow-parens */
/* eslint-disable curly */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Role, User, Notification } from 'app/core/models/models'; // Import Notification type
import { AccountService } from 'app/core/services/account.service';
import { UserService } from 'app/core/services/user.service';
import { AuthService } from 'app/core/services/auth.service';
import { NotificationService } from 'app/core/services/notification.service';

@Component({
    selector: 'classy-layout',
    templateUrl: './classy.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./classy.component.scss']
})
export class ClassyLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall = false;
    navigation: Navigation = {
        default: [],
        compact: [],
        futuristic: [],
        horizontal: []
    };
    user: User | null = null;
    notifications: Notification[] = []; // Proper typing
    unreadCount = 0;
    selectedNotification: Notification | null = null;
    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _userService: UserService,
        private _accountService: AccountService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _authService: AuthService,
        private _notificationService: NotificationService
    ) {}

    get currentYear(): number {
        return new Date().getFullYear();
    }

    ngOnInit(): void {
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                if (navigation) {
                    this.navigation = navigation;
                } else {
                    console.warn('Navigation is undefined or null');
                }
            });

        this._userService.getCurrentUser()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (userDTO) => {
                    if (userDTO) {
                        this.user = {
                            id: userDTO.id,
                            fullName: userDTO.fullName,
                            role: userDTO.role,
                            photoProfile: userDTO.photoProfile,
                            creationDate: userDTO.creationDate,
                            accountId: userDTO.account?.id,
                            preferences: userDTO.preferences ?? [],
                            accountLocked: !!userDTO.accountLocked,
                            enabled: userDTO.enabled !== false
                        };
                        this.initializeNotifications();
                    }
                },
                error: (error) => {
                    console.error('Error loading user:', error);
                }
            });

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.isScreenSmall = !matchingAliases.includes('md');
            });
    }

    ngOnDestroy(): void {
        this._notificationService.disconnect();
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    toggleNavigation(name: string): void {
        const navigation = this._fuseNavigationService.getComponent(name);
        if (navigation instanceof FuseVerticalNavigationComponent) {
            navigation.toggle();
        }
    }

    logout(): void {
        this._notificationService.disconnect();
        this._authService.logout();
    }

    goToProfile(): void {
        if (!this.user || !this.user.role) return;

        let route = '';
        switch (this.user.role) {
            case Role.TRAVELER:
                route = '/profile';
                break;
            case Role.ADMIN:
                route = '/admin/profile';
                break;
            case Role.MASTERADMIN:
                route = '/master/admin/profile';
                break;
            default:
                console.warn('Rôle inconnu:', this.user.role);
                return;
        }

        this._router.navigate([route]).catch(err =>
            console.error('Navigation échouée:', err)
        );
    }

    /** Marquer une notification comme lue */
    markNotificationAsRead(notificationId: string, event: Event): void {
        event.stopPropagation();

        const token = this._authService.getToken();
        if (!token) {
            console.error('❌ Token manquant');
            return;
        }

        console.log('🔄 Marquage notification comme lue:', notificationId);

        this._notificationService.markAsRead(notificationId, token).subscribe({
            next: (response) => {
                console.log('✅ Notification marquée comme lue:', response);

                // Mettre à jour localement
                const notif = this.notifications.find(n => n.id === notificationId);
                if (notif && !notif.read) {
                    notif.read = true;
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                }
            },
            error: (err) => {
                console.error('❌ Erreur marquage comme lu:', err);
                if (err.status) {
                    console.error(`Status: ${err.status}, Message: ${err.message}`);
                }
                if (err.error) {
                    console.error('Error details:', err.error);
                }
            }
        });
    }


    /** Fermer les détails de notification */
    closeNotificationDetails(): void {
        this.selectedNotification = null;
    }

    /** Marquer toutes les notifications comme lues */
    markAllAsRead(): void {
        if (!this.user?.id) return;

        const token = this._authService.getToken();
        if (!token) return;

        this._notificationService.markAllAsRead(this.user.id, token).subscribe({
            next: (response) => {
                console.log('✅ Toutes les notifications marquées comme lues');

                // Mettre à jour localement
                this.notifications.forEach(notif => notif.read = true);
                this.unreadCount = 0;
            },
            error: (err) => {
                console.error('❌ Erreur marquage toutes comme lues:', err);
            }
        });
    }

    /** Aller à la page des notifications */
    goToNotificationsPage(): void {
        this._router.navigate(['/notifications']).catch(err =>
            console.error('Navigation vers notifications échouée:', err)
        );
    }

    /** TrackBy function pour optimiser les performances */
    trackByNotificationId(index: number, item: Notification): string {
        return item.id || index.toString();
    }

    /** Obtenir l'icône appropriée selon le type de notification */
    getNotificationIcon(type: string): string {
        switch (type) {
            case 'BOOKING_CONFIRMED':
                return 'event_available';
            case 'BOOKING_CANCELLED':
                return 'event_busy';
            case 'PAYMENT_SUCCESS':
                return 'payment';
            case 'PAYMENT_FAILED':
                return 'payment_failed';
            case 'REMINDER':
                return 'schedule';
            case 'PROMOTION':
                return 'local_offer';
            case 'SYSTEM':
                return 'info';
            case 'COMMENT':
                return 'comment';
            case 'LIKE':
                return 'favorite';
            case 'FOLLOW':
                return 'person_add';
            default:
                return 'notification_important';
        }
    }

    /** Formater la date de notification */
    formatNotificationDate(timestamp: string | number | Date): string {
        if (!timestamp) {
            return 'Date inconnue';
        }

        let date: Date;

        try {
            if (timestamp instanceof Date) {
                date = timestamp;
            } else if (typeof timestamp === 'number') {
                date = timestamp.toString().length === 10
                    ? new Date(timestamp * 1000)
                    : new Date(timestamp);
            } else if (typeof timestamp === 'string') {
                if (/^\d{10}$/.test(timestamp)) {
                    date = new Date(parseInt(timestamp, 10) * 1000);
                } else if (/^\d{13}$/.test(timestamp)) {
                    date = new Date(parseInt(timestamp, 10));
                } else {
                    date = new Date(timestamp);
                }
            } else {
                console.warn('Format de timestamp non supporté:', typeof timestamp, timestamp);
                return 'Format invalide';
            }

            if (isNaN(date.getTime())) {
                console.warn('Date invalide créée à partir de:', timestamp);
                return 'Date invalide';
            }

        } catch (error) {
            console.error('Erreur lors du parsing de la date:', timestamp, error);
            return 'Erreur de date';
        }

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();

        if (diffMs < 0) {
            return 'À l\'instant';
        }

        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'À l\'instant';
        } else if (diffMins < 60) {
            return `Il y a ${diffMins}min`;
        } else if (diffHours < 24) {
            return `Il y a ${diffHours}h`;
        } else if (diffDays < 7) {
            return `Il y a ${diffDays}j`;
        } else {
            try {
                return date.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } catch (localeError) {
                return date.toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        }
    }

    /** Méthode pour nettoyer et normaliser les notifications reçues */
    private normalizeNotifications(notifications: any[]): Notification[] {
        return notifications.map(notif => {
            let normalizedTimestamp = notif.timestamp;

            if (!normalizedTimestamp || normalizedTimestamp === 'Invalid Date') {
                normalizedTimestamp = notif.createdAt || new Date().toISOString();
            }

            return {
                ...notif,
                timestamp: normalizedTimestamp,
                read: notif.read || false
            } as Notification;
        });
    }

    /** Initialiser les notifications */
    private initializeNotifications(): void {
        if (!this.user || !this.user.id) return;

        // Ne pas initialiser pour les admins/masteradmins
        if (this.user.role !== Role.TRAVELER) return;

        const token = this._authService.getToken();
        if (!token) return;

        // Charger toutes les notifications existantes
        this._notificationService.getNotificationsByUser(this.user.id, token)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: any) => {
                    const notifList = response.notifications ?? [];
                    const normalizedNotifications = this.normalizeNotifications(notifList);

                    this.notifications = normalizedNotifications.sort((a, b) => {
                        const dateA = new Date(a.timestamp).getTime();
                        const dateB = new Date(b.timestamp).getTime();
                        return dateB - dateA; // Plus récent en premier
                    });

                    this.unreadCount = normalizedNotifications.filter(n => !n.read).length;

                    console.log('Notifications chargées:', this.notifications.length);
                },
                error: (err) => {
                    console.error('Erreur chargement notifications :', err);
                }
            });

        // Connexion WebSocket
        this._notificationService.connect(this.user.id, token);

        this._notificationService.onNotification()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((notif) => {
                const normalizedNotif = this.normalizeNotifications([notif])[0];
                this.notifications.unshift(normalizedNotif);
                if (!normalizedNotif.read) {
                    this.unreadCount++;
                }
            });
    }

    /** Parser et formater les métadonnées de notification pour un affichage lisible */
    parseNotificationMetadata(notification: Notification): { [key: string]: string } | null {
        if (!notification.metadata) {
            return null;
        }

        try {
            const parsed = JSON.parse(notification.metadata);
            const formatted: { [key: string]: string } = {};

            // Pour les commentaires
            if (notification.type === 'COMMENT') {
                if (parsed.message) {
                    formatted['Commentaire'] = this.truncateText(parsed.message, 100);
                }
                if (parsed.contentTitle) {
                    formatted['Contenu'] = parsed.contentTitle;
                }
            }

            // Pour les likes
            if (notification.type === 'LIKE') {
                formatted['Action'] = 'A aimé votre contenu';
                if (parsed.contentTitle) {
                    formatted['Contenu'] = parsed.contentTitle;
                }
            }

            // Pour les follows
            if (notification.type === 'FOLLOW') {
                formatted['Action'] = 'Vous suit maintenant';
            }

            // Pour les réservations
            if (notification.type === 'BOOKING_CONFIRMED') {
                formatted['Action'] = 'Réservation confirmée';
                if (parsed.bookingId) {
                    formatted['Réservation'] = `#${parsed.bookingId}`;
                }
            }

            if (notification.type === 'BOOKING_CANCELLED') {
                formatted['Action'] = 'Réservation annulée';
                if (parsed.bookingId) {
                    formatted['Réservation'] = `#${parsed.bookingId}`;
                }
            }

            // Pour les paiements
            if (notification.type === 'PAYMENT_SUCCESS') {
                formatted['Action'] = 'Paiement réussi';
                if (parsed.amount) {
                    formatted['Montant'] = `${parsed.amount}€`;
                }
            }

            if (notification.type === 'PAYMENT_FAILED') {
                formatted['Action'] = 'Échec du paiement';
                if (parsed.amount) {
                    formatted['Montant'] = `${parsed.amount}€`;
                }
            }

            // Ajouter l'utilisateur si disponible
            if (parsed.userName && parsed.userName !== 'System') {
                formatted['De'] = parsed.userName;
            }

            // Ajouter l'email si c'est un admin/system
            if (parsed.userEmail && notification.type === 'SYSTEM') {
                formatted['Email'] = parsed.userEmail;
            }

            return Object.keys(formatted).length > 0 ? formatted : null;

        } catch (error) {
            console.warn('Erreur parsing metadata:', error);
            return null;
        }
    }

    /** Obtenir un titre plus lisible pour la notification */
    getNotificationTitle(notification: Notification): string {
        const titles: { [key: string]: string } = {
            'COMMENT': 'New Comment',
            'LIKE': '❤️ Nouveau like',
            'FOLLOW': '👥 Nouveau follower',
            'BOOKING_CONFIRMED': '✅ Réservation confirmée',
            'BOOKING_CANCELLED': '❌ Réservation annulée',
            'PAYMENT_SUCCESS': '💳 Paiement réussi',
            'PAYMENT_FAILED': '⚠️ Échec de paiement',
            'REMINDER': '⏰ Rappel',
            'PROMOTION': '🎉 Promotion',
            'SYSTEM': '🔧 Notification système'
        };

        return titles[notification.type] || '🔔 Notification';
    }

    /** Obtenir une description enrichie du message */
    getEnhancedMessage(notification: Notification): string {
        // Si le message est déjà descriptif, le retourner tel quel
        if (notification.message && notification.message.length > 20) {
            return notification.message;
        }

        // Sinon, créer un message plus descriptif basé sur le type
        const metadata = this.parseNotificationMetadata(notification);

        switch (notification.type) {
            case 'COMMENT':
                const contentTitle = metadata?.['Contenu'] || 'votre contenu';
                return `Nouveau commentaire sur ${contentTitle}`;

            case 'LIKE':
                const likedContent = metadata?.['Contenu'] || 'votre contenu';
                return `Quelqu'un a aimé ${likedContent}`;

            case 'FOLLOW':
                const follower = metadata?.['De'] || 'Quelqu\'un';
                return `${follower} a commencé à vous suivre`;

            case 'BOOKING_CONFIRMED':
                return 'Votre réservation a été confirmée';

            case 'BOOKING_CANCELLED':
                return 'Votre réservation a été annulée';

            case 'PAYMENT_SUCCESS':
                return 'Votre paiement a été traité avec succès';

            case 'PAYMENT_FAILED':
                return 'Échec du traitement de votre paiement';

            default:
                return notification.message || 'Nouvelle notification';
        }
    }

    /** Utilitaire pour tronquer le texte */
    private truncateText(text: string, maxLength: number): string {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }

    /** Obtenir l'icône avec emoji pour une meilleure visibilité */
    getNotificationIconWithEmoji(type: string): { icon: string; emoji: string } {
        const iconMap: { [key: string]: { icon: string; emoji: string } } = {
            'COMMENT': { icon: 'comment', emoji: '💬' },
            'LIKE': { icon: 'favorite', emoji: '❤️' },
            'FOLLOW': { icon: 'person_add', emoji: '👥' },
            'BOOKING_CONFIRMED': { icon: 'event_available', emoji: '✅' },
            'BOOKING_CANCELLED': { icon: 'event_busy', emoji: '❌' },
            'PAYMENT_SUCCESS': { icon: 'payment', emoji: '💳' },
            'PAYMENT_FAILED': { icon: 'payment', emoji: '⚠️' },
            'REMINDER': { icon: 'schedule', emoji: '⏰' },
            'PROMOTION': { icon: 'local_offer', emoji: '🎉' },
            'SYSTEM': { icon: 'info', emoji: '🔧' }
        };

        return iconMap[type] || { icon: 'notification_important', emoji: '🔔' };
    }

    /** Obtenir la couleur du statut selon le type */
    getNotificationStatusColor(type: string): string {
        const colorMap: { [key: string]: string } = {
            'COMMENT': '#10b981',
            'LIKE': '#ef4444',
            'FOLLOW': '#8b5cf6',
            'BOOKING_CONFIRMED': '#059669',
            'BOOKING_CANCELLED': '#dc2626',
            'PAYMENT_SUCCESS': '#10b981',
            'PAYMENT_FAILED': '#ef4444',
            'REMINDER': '#f59e0b',
            'PROMOTION': '#ec4899',
            'SYSTEM': '#6b7280'
        };

        return colorMap[type] || '#3b82f6';
    }

    /** Vérifier si une notification nécessite une action */
    requiresAction(notification: Notification): boolean {
        const actionTypes = ['PAYMENT_FAILED', 'BOOKING_CANCELLED', 'REMINDER'];
        return actionTypes.includes(notification.type);
    }

    /** Obtenir le message du commentaire à partir des métadonnées */
    getCommentMessage(notification: Notification): string {
        try {
            if (!notification.metadata) return notification.message || 'Commentaire sans contenu';

            const parsed = JSON.parse(notification.metadata);
            return parsed.message || parsed.commentMessage || notification.message || 'Commentaire sans contenu';
        } catch (error) {
            return notification.message || 'Commentaire sans contenu';
        }
    }

    /** Obtenir le titre du contenu à partir des métadonnées */
    getContentTitle(notification: Notification): string {
        try {
            if (!notification.metadata) return 'Contenu sans titre';

            const parsed = JSON.parse(notification.metadata);
            return parsed.contentTitle || parsed.title || 'Contenu sans titre';
        } catch (error) {
            return 'Contenu sans titre';
        }
    }

    /** Naviguer vers le contenu associé à la notification */
    viewContent(notification: Notification): void {
        try {
            if (!notification.metadata) {
                console.warn('Aucune métadonnée pour naviguer vers le contenu');
                return;
            }

            const parsed = JSON.parse(notification.metadata);
            const contentId = parsed.contentId || parsed.sourceId;

            if (contentId) {
                // Navigation vers la page de détail du contenu
                this._router.navigate(['/content', contentId]).catch(err =>
                    console.error('Erreur navigation vers contenu:', err)
                );

                // Fermer le modal de détails
                this.closeNotificationDetails();
            } else {
                console.warn('Aucun ID de contenu trouvé dans les métadonnées');
            }
        } catch (error) {
            console.error('Erreur lors de la navigation vers le contenu:', error);
        }
    }


/** Méthode de debug pour analyser les métadonnées de notification */
debugNotificationMetadata(notification: Notification): void {
  console.group('🔍 Debug Notification Metadata');
  console.log('Notification ID:', notification.id);
  console.log('Type:', notification.type);
  console.log('Message:', notification.message);
  console.log('Raw metadata:', notification.metadata);

  // Propriétés directes
  console.log('Direct properties:');
  console.log('- fromUserName:', notification.fromUserName);
  console.log('- senderName:', notification.senderName);

  if (notification.metadata) {
    try {
      const parsed = JSON.parse(notification.metadata);
      console.log('Parsed metadata:', parsed);
      console.log('Available keys:', Object.keys(parsed));

      // Chercher toutes les clés qui pourraient contenir un nom
      const possibleNameKeys = Object.keys(parsed).filter(key =>
        key.toLowerCase().includes('name') ||
        key.toLowerCase().includes('user') ||
        key.toLowerCase().includes('author') ||
        key.toLowerCase().includes('commenter')
      );
      console.log('Possible name keys:', possibleNameKeys);

      possibleNameKeys.forEach(key => {
        console.log(`- ${key}:`, parsed[key]);
      });

    } catch (error) {
      console.error('Error parsing metadata:', error);
    }
  }
  console.groupEnd();
}

/** Appeler cette méthode dans openNotificationDetails pour debug */
openNotificationDetails(notification: Notification): void {
  // Ajoutez cette ligne pour debug
  this.debugNotificationMetadata(notification);

  this.selectedNotification = notification;

  // Marquer comme lue si pas encore lu
  if (!notification.read && notification.id) {
    this.markNotificationAsRead(notification.id, new Event('click'));
  }
}

/** Obtenir les initiales de l'utilisateur - CORRIGÉ */
getUserInitials(notification: Notification): string {
    const userName = this.getUserName(notification);

    if (userName === 'Utilisateur inconnu' || userName.startsWith('Utilisateur #')) {
        return '?';
    }

    try {
        return userName
            .split(' ')
            .map((name: string) => name.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    } catch (error) {
        return '?';
    }
}

















/** Obtenir le nom de l'utilisateur à partir des métadonnées - SOLUTION CORRIGÉE */
getUserName(notification: Notification): string {
    try {
        // 1. Vérifier d'abord les propriétés directes de la notification
        if (notification.fromUserName && notification.fromUserName !== 'undefined') {
            return notification.fromUserName;
        }
        if (notification.senderName && notification.senderName !== 'undefined') {
            return notification.senderName;
        }

        // 2. Vérifier les métadonnées
        if (!notification.metadata) {
            return 'Utilisateur inconnu';
        }

        const parsed = JSON.parse(notification.metadata);

        // 3. Chercher toutes les variations possibles de nom d'utilisateur
        const possibleNameFields = [
            'userName', 'userFullName', 'senderName', 'fromUserName',
            'commenterName', 'authorName', 'fullName', 'name',
            'userDisplayName', 'displayName'
        ];

        for (const field of possibleNameFields) {
            if (parsed[field] && typeof parsed[field] === 'string' && parsed[field] !== 'undefined') {
                return parsed[field];
            }
        }

        // 4. SOLUTION TEMPORAIRE : Si on a un userId, récupérer le nom via le service utilisateur
        if (parsed.userId) {
            // Option 1: Appel synchrone si vous avez une cache
            const cachedUser = this.getCachedUserName(parsed.userId);
            if (cachedUser) {
                return cachedUser;
            }

            // Option 2: Affichage temporaire + chargement asynchrone
            this.loadUserNameAsync(parsed.userId, notification);
            return `Chargement...`; // Sera mis à jour une fois le nom chargé
        }

        return 'Utilisateur inconnu';

    } catch (error) {
        console.error('Erreur getUserName:', error);
        return 'Utilisateur inconnu';
    }
}

/** Cache des noms d'utilisateurs pour éviter les appels répétés */
private userNameCache = new Map<string, string>();

/** Récupérer un nom d'utilisateur depuis le cache */
private getCachedUserName(userId: string): string | null {
    return this.userNameCache.get(userId) || null;
}

/** Charger le nom d'utilisateur de manière asynchrone et mettre à jour l'affichage */
private loadUserNameAsync(userId: string, notification: Notification): void {
    // Éviter les appels multiples pour le même utilisateur
    if (this.userNameCache.has(userId)) {
        return;
    }

    // Marquer comme en cours de chargement
    this.userNameCache.set(userId, 'Chargement...');

    const token = this._authService.getToken();
    if (!token) {
        this.userNameCache.set(userId, 'Utilisateur inconnu');
        return;
    }

    // Appel au service utilisateur pour récupérer les infos
    this._userService.getUserById(userId) // Vous devrez peut-être ajouter cette méthode
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe({
            next: (user) => {
                const userName = user.fullName || `Utilisateur #${userId.substring(0, 8)}`;
                this.userNameCache.set(userId, userName);

                // Déclencher une mise à jour de l'affichage si nécessaire
                // Angular détectera automatiquement le changement lors du prochain cycle
            },
            error: (error) => {
                console.error('Erreur chargement nom utilisateur:', error);
                this.userNameCache.set(userId, `Utilisateur #${userId.substring(0, 8)}`);
            }
        });
}

}
