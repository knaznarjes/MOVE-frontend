/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable jsdoc/newline-after-description */
/* eslint-disable arrow-body-style */
/* eslint-disable curly */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable arrow-parens */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit, OnDestroy, HostListener, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentType, Media, Content, DayProgram, ContentItem, User ,Comment, Role} from 'app/core/models/models';
import { ActivityPointService } from 'app/core/services/activity-point.service';
import { ContentService } from 'app/core/services/content.service';
import { DayProgramService } from 'app/core/services/day-program.service';
import { LocationService } from 'app/core/services/location.service';
import { MediaService } from 'app/core/services/media.service';
import { switchMap, Observable, of, forkJoin, Subject } from 'rxjs';
import { catchError, map, takeUntil, finalize } from 'rxjs/operators';
import { AuthService } from 'app/core/services/auth.service';
import { RecommendationService } from 'app/core/services/recommendation.service';
import { CommentService } from 'app/core/services/comment.service';
import { PickerModule } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-content-details',
  templateUrl: './content-details.component.html',
  styleUrls: ['./content-details.component.scss'],
    encapsulation: ViewEncapsulation.None

})
export class ContentDetailsComponent implements OnInit, OnDestroy {
  content: Content | null = null;
  coverImage: Media | null = null;
  albumPhotos: Media[] = [];
  videos: Media[] = [];
  isLoading = true;
  error: string | null = null;
  contentType = ContentType;
  contentId: string | null = null;

  // Authentication and permission variables
  currentUserId: string | null = null;
  userRole: string | null = null;
  isOwner = false;
  isAdmin = false;
  isMasterAdmin = false;

  // For carousel/gallery
  currentPhotoIndex = 0;
  similarContents: Content[] = [];
  showAllReco: boolean = false;
  pageSize: number = 3;

  // Comments variables
  comments: Comment[] = [];
  commentsCount = 0;
  isLoadingComments = false;
  commentError: string | null = null;
  newCommentText = '';
  isSubmittingComment = false;
  editingCommentId: string | null = null;
  editingCommentText = '';
  userDetails: { [userId: string]: User } = {}; // Cache pour les détails des utilisateurs

  // Subject for component destruction to clean up subscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService,
    private mediaService: MediaService,
    private locationService: LocationService,
    private dayProgramService: DayProgramService,
    private activityPointService: ActivityPointService,
    private authService: AuthService,
      private commentService: CommentService,
    private recommendationService: RecommendationService,
  ) {}

  ngOnInit(): void {
    // Listen to URL parameter changes instead of using snapshot
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const newContentId = params.get('id');

      if (!newContentId) {
        this.handleError('Content ID not found');
        return;
      }

      // If it's a new content or first load
      if (newContentId !== this.contentId) {
        this.contentId = newContentId;
        console.log('🔄 New content ID detected:', this.contentId);

        // Reset component state
        this.resetComponentState();

        // Load new content
        this.initializeUserPermissions();
        this.loadContent();
        this.loadComments();

      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return this.currentUserId !== null && this.currentUserId !== undefined && this.currentUserId !== '';
  }

  /**
   * Initialize user permissions
   */
  private initializeUserPermissions(): void {
    this.userRole = this.authService.getUserRole();
    this.currentUserId = this.authService.getUserId();
    this.isAdmin = this.authService.isAdmin();
    this.isMasterAdmin = this.authService.isMasterAdmin();

    console.log('✅ Permissions initialized - Role:', this.userRole);
    console.log('✅ Current User ID:', this.currentUserId);
    console.log('✅ isMasterAdmin:', this.isMasterAdmin);
    console.log('✅ isAuthenticated:', this.isAuthenticated);
  }

  get canEdit(): boolean {
    return this.canEditOrDelete();
  }

  canEditOrDelete(): boolean {
    return this.authService.isTraveler() && this.isOwner;
  }

  isAdminOrMaster(): boolean {
    return this.authService.isAdmin() || this.authService.isMasterAdmin();
  }

  loadContent(): void {
    if (!this.contentId) return;

    this.contentService.getContentById(this.contentId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(content => {
          this.content = content;
          console.log('✅ Content loaded:', content);

          // Check user permissions
          const currentUserId = this.authService.getUserId();
          this.isOwner = content.userId === currentUserId;
          this.isAdmin = this.authService.isAdmin();
          this.isMasterAdmin = this.authService.isMasterAdmin();

          console.log('📌 content.userId =', content.userId);
          console.log('👤 currentUserId =', currentUserId);
          console.log('✅ isOwner =', this.isOwner);
          console.log('🧳 isTraveler =', this.authService.isTraveler());

          // Initialize empty arrays if they're undefined to prevent null reference errors
          if (!this.content.dayPrograms) this.content.dayPrograms = [];

          return forkJoin({
            coverImage: this.mediaService.getCoverByContentId(this.contentId!)
              .pipe(catchError(err => {
                console.error('Error loading cover image:', err);
                return of(null);
              })),
            albumPhotos: this.mediaService.getMediaByContentIdAndType(this.contentId!, 'ALBUM')
              .pipe(catchError(err => {
                console.error('Error loading album photos:', err);
                return of([]);
              })),
            videos: this.mediaService.getMediaByContentIdAndType(this.contentId!, 'VIDEO')
              .pipe(catchError(err => {
                console.error('Error loading videos:', err);
                return of([]);
              })),
            dayPrograms: this.loadDayProgramsIfNeeded(content)
          });
        }),
        finalize(() => {
          this.isLoading = false;
        }),
        catchError(err => {
          this.handleError('Error loading content details', err);
          return of(null);
        })
      )
      .subscribe(result => {
        if (!result) return;

        this.coverImage = result.coverImage;
        this.albumPhotos = result.albumPhotos;
        this.videos = result.videos;

        if (this.content && this.content.type === ContentType.ITINERARY) {
          // Ensure day programs are properly assigned
          this.content.dayPrograms = result.dayPrograms || [];
          console.log('📊 Day Programs loaded:', this.content.dayPrograms);

          // Sort day programs by day number
          if (this.content.dayPrograms.length > 0) {
            this.content.dayPrograms.sort((a, b) => a.dayNumber - b.dayNumber);

            // Debug log to verify activities
            this.content.dayPrograms.forEach(day => {
              console.log(`Day ${day.dayNumber} activities:`, day.activities);
              // Initialize activities array if undefined
              if (!day.activities) day.activities = [];
            });
          }
        }

        // Load recommendations after content is successfully loaded
        this.loadRecommendations();

      });
  }

  // Updated loadRecommendations method with cover images
  loadRecommendations(): void {
    if (!this.contentId) return;

    console.log('🔄 Loading recommendations for content ID:', this.contentId);

    this.recommendationService.getRecommendationsByContentId(this.contentId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(recommendations => {
          console.log('📦 Raw recommendations received:', recommendations);

          if (!Array.isArray(recommendations)) {
            console.error('❌ Recommendations is not an array:', recommendations);
            return of([]);
          }

          // Map recommendations to Content objects
          const mappedContents = recommendations
            .map(item => this.mapToContent(item))
            .filter(content => content !== null);

          if (mappedContents.length === 0) {
            console.log('ℹ️ No valid recommendations to process');
            return of([]);
          }

          // Load cover images for each recommendation
          const contentWithCoverImages$ = mappedContents.map(content => {
            return this.mediaService.getCoverByContentId(content.id!)
              .pipe(
                map(coverImage => {
                  // Add cover image to the content's media array
                  if (coverImage) {
                    content.media = [coverImage, ...content.media];
                  }
                  return content;
                }),
                catchError(err => {
                  console.warn(`⚠️ No cover image found for content ${content.id}:`, err);
                  return of(content); // Return content without cover image
                })
              );
          });

          return forkJoin(contentWithCoverImages$).pipe(
            catchError(err => {
              console.error('❌ Error loading cover images for recommendations:', err);
              return of(mappedContents); // Return contents without cover images
            })
          );
        })
      )
      .subscribe({
        next: (recommendations) => {
          this.similarContents = recommendations;
          console.log('✅ Processed recommendations with cover images:', this.similarContents);
        },
        error: (err) => {
          console.error('❌ Error loading recommendations:', err);
          this.similarContents = [];
        }
      });
  }

  // Improved mapping function with more robust null handling
  private mapToContent(item: ContentItem): Content | null {
    if (!item || !item.id) {
      console.warn('⚠️ Invalid item to map:', item);
      return null;
    }

    // Create a complete Content object with all required properties
    return {
      id: item.id,
      title: item.title || 'No Title',
      description: item.description || 'No description available',
      budget: item.budget || 0,
      rating: item.rating || 0,
      likeCount: item.likeCount || 0,
      tags: item.tags || '',
      type: item.type || ContentType.TRAVEL_STORY,
      userId: item.userId || '',
      averageRating: item.averageRating || 0,
      isPublished: true,
      media: [],
      locations: [],
      dayPrograms: []
    };
  }

  get paginatedSimilarContents(): Content[] {
    // Filter out any null values that might have come from failed mapping
    const validContents = this.similarContents.filter(content => content !== null);

    return this.showAllReco
      ? validContents
      : validContents.slice(0, this.pageSize);
  }

  // Toggle function for "show more/less"
  toggleShowAllRecommendations(): void {
    this.showAllReco = !this.showAllReco;
  }

  /**
   * Navigate to recommended content details
   * @param contentId - ID of the content to navigate to
   */
  navigateToRecommendedContent(contentId: string): void {
    if (!contentId) {
      console.error('❌ Content ID is missing');
      return;
    }

    if (contentId === this.contentId) {
      console.log('ℹ️ Already viewing this content');
      return;
    }

    console.log('🔄 Navigating to recommended content:', contentId);

    // Navigate to the content details page
    // The paramMap observable in ngOnInit() will automatically detect the change
    this.router.navigate(['/content', contentId]).then(
      (success) => {
        if (success) {
          console.log('✅ Navigation successful');
        } else {
          console.error('❌ Navigation failed');
        }
      }
    ).catch(err => {
      console.error('❌ Navigation error:', err);
    });
  }

  // Updated method to load day programs with better error handling
  private loadDayProgramsIfNeeded(content: Content): Observable<DayProgram[]> {
    if (content.type !== ContentType.ITINERARY) {
      console.log('📝 Content is not an itinerary, skipping day programs');
      return of([]);
    }

    console.log('🔄 Loading day programs for content ID:', this.contentId);

    return this.dayProgramService.getAllByContent(this.contentId!)
      .pipe(
        switchMap(dayPrograms => {
          console.log('📅 Raw day programs received:', dayPrograms);

          if (!dayPrograms || dayPrograms.length === 0) {
            console.warn('⚠️ No day programs found for this content');
            return of([]);
          }

          // Load activities for each day program in parallel
          const dayProgramsWithActivities$ = dayPrograms.map(dayProgram => {
            console.log(`🔄 Loading activities for day program ID: ${dayProgram.id}, day ${dayProgram.dayNumber}`);

            if (!dayProgram.id) {
              console.error('❌ Day program ID is missing');
              dayProgram.activities = [];
              return of(dayProgram);
            }

            return this.activityPointService.getAllByDayProgram(dayProgram.id)
              .pipe(
                map(activities => {
                  console.log(`✅ Activities for day ${dayProgram.dayNumber}:`, activities);
                  dayProgram.activities = activities || [];
                  return dayProgram;
                }),
                catchError(err => {
                  console.error(`❌ Error loading activities for day ${dayProgram.dayNumber}:`, err);
                  dayProgram.activities = [];
                  return of(dayProgram);
                })
              );
          });

          return forkJoin(dayProgramsWithActivities$).pipe(
            catchError(err => {
              console.error('❌ Error loading day programs with activities:', err);
              return of(dayPrograms.map(dp => {
                dp.activities = [];
                return dp;
              }));
            })
          );
        }),
        catchError(err => {
          console.error('❌ Error loading day programs:', err);
          return of([]);
        })
      );
  }

  getMediaUrl(media: Media): string {
    if (!media || !media.id) return '';
    return this.mediaService.getMediaFileUrl(media.id);
  }

  navigateToMap(): void {
    if (this.content?.locations?.length > 0) {
      this.router.navigate(['/map'], {
        queryParams: { contentId: this.contentId }
      });
    }
  }

  getDateRangeDisplay(): string {
    if (!this.content?.startDate || !this.content?.endDate) {
      return '';
    }

    const startDate = new Date(this.content.startDate);
    const endDate = new Date(this.content.endDate);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return '';
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  }

  getDurationDisplay(): string {
    if (!this.content?.duration) {
      return '';
    }

    return this.content.duration === 1
      ? `${this.content.duration} day`
      : `${this.content.duration} days`;
  }

  // Gallery/carousel navigation
  nextPhoto(): void {
    if (this.albumPhotos.length > 0) {
      this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.albumPhotos.length;
    }
  }

  previousPhoto(): void {
    if (this.albumPhotos.length > 0) {
      this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.albumPhotos.length) % this.albumPhotos.length;
    }
  }

  showPhoto(index: number): void {
    if (index >= 0 && index < this.albumPhotos.length) {
      this.currentPhotoIndex = index;
    }
  }

  editContent(): void {
    if (!this.canEditOrDelete()) {
      this.showAccessDeniedMessage();
      return;
    }
    this.router.navigate(['/edit', this.contentId]);
  }

  showAccessDeniedMessage(): void {
    alert('⛔ Accès refusé : cette action est réservée au propriétaire du contenu (voyageur).');
  }

  deleteContent(): void {
    if (!this.canEditOrDelete()) {
      this.showAccessDeniedMessage();
      return;
    }

    if (!this.contentId) return;

    if (confirm('Are you sure you want to delete this content?')) {
      this.isLoading = true;

      this.contentService.deleteContent(this.contentId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: () => {
            alert('Content deleted successfully');
            this.router.navigate(['/homecontent']);
          },
          error: (err) => {
            this.handleError('Error deleting content', err);
          }
        });
    }
  }

  publishContent(): void {
    if (!this.contentId) return;
    this.isLoading = true;

    this.contentService.publishContent(this.contentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (updatedContent) => {
          this.content = updatedContent;
          alert('Content published successfully');
        },
        error: (err) => {
          this.handleError('Error publishing content', err);
        }
      });
  }

  unpublishContent(): void {
    if (!this.contentId) return;
    this.isLoading = true;

    this.contentService.unpublishContent(this.contentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (updatedContent) => {
          this.content = updatedContent;
          alert('Content unpublished successfully');
        },
        error: (err) => {
          this.handleError('Error unpublishing content', err);
        }
      });
  }

  blockContent(): void {
    if (!this.contentId) return;
    this.isLoading = true;

    const blockOperation = this.isMasterAdmin
      ? this.contentService.blockContentAsMaster(this.contentId)
      : this.isAdmin && this.content?.userId
        ? this.contentService.blockContentAsAdmin(this.contentId, 'TRAVELER')
        : null;

    if (!blockOperation) {
      this.handleError('⛔ Vous navez pas lautorisation pour bloquer ce contenu');
      this.isLoading = false;
      return;
    }

    blockOperation
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (updatedContent) => {
          this.content = updatedContent;
          alert('✅ Contenu bloqué avec succès.');
        },
        error: (err) => {
          if (err.status === 403) {
            this.handleError('⛔ Vous navez pas lautorisation pour cette action.');
          } else {
            this.handleError('❌ Erreur lors du blocage du contenu.', err);
          }
        }
      });
  }

  private handleError(message: string, err?: any): void {
    this.error = message;
    this.isLoading = false;
    console.error(message, err);
  }

  /**
   * Reset component state when navigating to different content
   */
  private resetComponentState(): void {
    this.content = null;
    this.coverImage = null;
    this.albumPhotos = [];
    this.videos = [];
    this.similarContents = [];
    this.isLoading = true;
    this.error = null;
    this.currentPhotoIndex = 0;
    this.showAllReco = false;
    this.isOwner = false;

    // Reset comments state
    this.comments = [];
    this.commentsCount = 0;
    this.isLoadingComments = false;
    this.commentError = null;
    this.newCommentText = '';
    this.isSubmittingComment = false;
    this.editingCommentId = null;
    this.editingCommentText = '';
    this.userDetails = {};
  }

// Ajouts et modifications à apporter dans content-details.component.ts

// 1. Nouvelles méthodes pour la gestion des permissions des commentaires
canDeleteComment(comment: Comment): boolean {
  // Admin, master admin ou propriétaire du commentaire peuvent supprimer
  return this.isAdmin || this.isMasterAdmin || (comment.userId === this.currentUserId);
}

canEditComment(comment: Comment): boolean {
  // Seul le propriétaire du commentaire peut le modifier
  return comment.userId === this.currentUserId;
}

canModerateComment(): boolean {
  // Seuls les admins et master admins peuvent modérer
  return this.isAdmin || this.isMasterAdmin;
}

loadComments(): void {
  if (!this.contentId) return;

  this.isLoadingComments = true;
  this.commentError = null;
this.commentService.getCommentsByContentId(this.contentId)
  .pipe(
    takeUntil(this.destroy$),
    finalize(() => this.isLoadingComments = false)
  )
  .subscribe({
    next: (response: any) => {
      const receivedComments = response.comments ?? [];

      if (!Array.isArray(receivedComments)) {
        console.error('❌ Format inattendu:', response);
        this.commentError = 'Format de données de commentaires inattendu';
        this.comments = [];
        return;
      }

      this.comments = receivedComments.filter(c => c && !c.deleted && c.valid !== false);
      this.commentsCount = this.comments.length;
      this.loadUserDetailsForComments();

      console.log('✅ Commentaires chargés:', this.comments);
    },
    error: (err) => {
      this.commentError = 'Erreur lors du chargement des commentaires';
      console.error('❌ Erreur loadComments:', err);
      this.comments = [];
    }
  });

}


private loadUserDetailsForComments(): void {
  const userIds = [...new Set(this.comments.map(comment => comment.userId))];

  userIds.forEach(userId => {
    // ✅ NE PAS APPELER L'API SI userId est vide ou undefined
    if (!userId || userId === 'undefined' || this.userDetails[userId]) return;

    this.authService.getUserById(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.userDetails[userId] = user;
        },
        error: (err) => {
          console.error(`❌ Erreur lors du chargement de l'utilisateur ${userId}:`, err);
          this.userDetails[userId] = {
            id: userId,
            fullName: 'Utilisateur inconnu',
            role: Role.TRAVELER,
            preferences: [],
            accountLocked: false,
            enabled: true
          };
        }
      });
  });
}



// 5. Méthode pour commencer l'édition d'un commentaire
startEditComment(comment: Comment): void {
  if (!this.canEditComment(comment)) {
    this.commentError = 'Vous ne pouvez modifier que vos propres commentaires';
    return;
  }

  this.editingCommentId = comment.id!;
  this.editingCommentText = comment.message;
  this.commentError = null;
}

// 6. Méthode pour annuler l'édition
cancelEditComment(): void {
  this.editingCommentId = null;
  this.editingCommentText = '';
  this.commentError = null;
}

// 7. Méthode pour sauvegarder les modifications d'un commentaire
saveEditComment(commentId: string): void {
  if (!this.editingCommentText.trim()) {
    this.commentError = 'Le commentaire ne peut pas être vide';
    return;
  }

  this.commentService.updateComment(commentId, this.editingCommentText.trim())
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (updatedComment) => {
        // Mettre à jour le commentaire dans la liste
        const index = this.comments.findIndex(c => c.id === commentId);
        if (index !== -1) {
          this.comments[index] = updatedComment;
        }

        // Réinitialiser l'état d'édition
        this.cancelEditComment();

        console.log('✅ Commentaire mis à jour:', updatedComment);
      },
      error: (err) => {
        this.commentError = 'Erreur lors de la modification du commentaire';
        console.error('❌ Erreur saveEditComment:', err);
      }
    });
}

// 8. Méthode améliorée pour supprimer un commentaire
deleteComment(commentId: string): void {
  const comment = this.comments.find(c => c.id === commentId);

  if (!comment) {
    this.commentError = 'Commentaire introuvable';
    return;
  }

  if (!this.canDeleteComment(comment)) {
    this.commentError = 'Vous n\'avez pas l\'autorisation de supprimer ce commentaire';
    return;
  }

  const confirmMessage = comment.userId === this.currentUserId
    ? 'Supprimer votre commentaire ?'
    : 'Supprimer ce commentaire ?';

  if (!confirm(confirmMessage)) return;

  this.commentService.deleteComment(commentId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        // Retirer le commentaire de la liste
        this.comments = this.comments.filter(c => c.id !== commentId);
        this.commentsCount--;

        // Réinitialiser l'état d'édition si ce commentaire était en cours d'édition
        if (this.editingCommentId === commentId) {
          this.cancelEditComment();
        }

        console.log('✅ Commentaire supprimé');
      },
      error: (err) => {
        this.commentError = 'Erreur lors de la suppression du commentaire';
        console.error('❌ Erreur deleteComment:', err);
      }
    });
}

getUserDisplayName(userId: string): string {
  const user = this.userDetails[userId];
  if (!user) return '⏳ Chargement...';
  return user.fullName || 'Utilisateur';
}


isCommentBeingEdited(commentId: string): boolean {
  return this.editingCommentId === commentId;
}

formatCommentDate(dateString: string | undefined): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('❌ Erreur formatage date:', error);
    return '';
  }
}

// 11. Méthode pour nettoyer les erreurs de commentaires
clearCommentError(): void {
  this.commentError = null;
}

// Méthode à ajouter dans content-details.component.ts

/**
 * TrackBy function pour optimiser les performances de la liste des commentaires
 * @param index - Index de l'élément dans la liste
 * @param comment - Objet commentaire
 * @returns Identifiant unique du commentaire
 */
trackCommentById(index: number, comment: Comment): string {
  return comment.id || index.toString();
}










// 1. Méthode de debug à ajouter dans content-details.component.ts
debugCommentButton(): void {
  console.log('🔍 Debug bouton commentaire:');
  console.log('- newCommentText:', `"${this.newCommentText}"`);
  console.log('- newCommentText.trim():', `"${this.newCommentText.trim()}"`);
  console.log('- newCommentText.length:', this.newCommentText.length);
  console.log('- isSubmittingComment:', this.isSubmittingComment);
  console.log('- isAuthenticated:', this.isAuthenticated);
  console.log('- contentId:', this.contentId);
  console.log('- currentUserId:', this.currentUserId);
  console.log('- Bouton désactivé:', !this.newCommentText.trim() || this.isSubmittingComment);
}

// 2. Getter pour vérifier si le bouton doit être activé
get canSubmitComment(): boolean {
  const hasText = this.newCommentText && this.newCommentText.trim().length > 0;
  const notSubmitting = !this.isSubmittingComment;
  const isAuth = this.isAuthenticated;
  const hasContentId = !!this.contentId;
  const hasUserId = !!this.currentUserId;
  console.log('🔍 Vérifications bouton commentaire:', {
    hasText,
    notSubmitting,
    isAuth,
    hasContentId,
    hasUserId,
    result: hasText && notSubmitting && isAuth && hasContentId && hasUserId
  });

  return hasText && notSubmitting && isAuth && hasContentId && hasUserId;
}
submitComment(): void {
  this.debugCommentButton();

  if (!this.isAuthenticated) {
    this.commentError = 'Vous devez être connecté pour commenter';
    return;
  }

  if (!this.contentId || !this.currentUserId) {
    this.commentError = 'ID du contenu ou utilisateur manquant';
    return;
  }

  if (!this.newCommentText || !this.newCommentText.trim()) {
    this.commentError = 'Veuillez saisir un commentaire';
    return;
  }

  const trimmedMessage = this.newCommentText.trim();
  if (trimmedMessage.length > 500) {
    this.commentError = 'Le commentaire ne peut pas dépasser 500 caractères';
    return;
  }

  this.isSubmittingComment = true;
  this.commentError = null;

  const newComment: Comment = {
      contentId: this.contentId,
      userId: this.currentUserId,
      message: trimmedMessage,
  contentOwnerId: this.content?.userId || '' // 💡 nécessaire selon le backend
  };

  this.commentService.addComment(newComment)
    .pipe(
      takeUntil(this.destroy$),
      switchMap((comment) => {
        const userId = comment.userId;
        if (userId && userId !== 'undefined' && !this.userDetails[userId]) {
          return this.authService.getUserById(userId).pipe(
            map(user => {
              this.userDetails[userId] = user;
              return comment;
            }),
            catchError(err => {
              console.error(`⚠️ Erreur récupération user ${userId}`, err);
              this.userDetails[userId] = {
                id: userId,
                fullName: 'Utilisateur inconnu',
                role: Role.TRAVELER,
                preferences: [],
                accountLocked: false,
                enabled: true
              };
              return of(comment);
            })
          );
        }
        return of(comment);
      }),
      finalize(() => this.isSubmittingComment = false)
    )
.subscribe({
  next: (response) => {
    const comment = response.comment || response; // supporte les deux formats

    if (!comment || !comment.id) {
      console.error('❌ Commentaire invalide :', response);
      return;
    }

    // Ajouter directement ou recharger toute la liste
    this.newCommentText = '';
    this.loadComments(); // recharge avec détails utilisateurs

    console.log('✅ Commentaire ajouté avec succès :', comment);
  },
  error: (err) => {
    this.commentError = 'Erreur lors de l\'ajout du commentaire';
    console.error('❌ submitComment error:', err);
  }
});

}






// Nouvelles propriétés à ajouter dans la classe ContentDetailsComponent

// Variables pour la gestion des emojis
showEmojiPicker = false;
cursorPosition = 0;

// Méthode pour basculer l'affichage du picker d'emojis
toggleEmojiPicker(): void {
  this.showEmojiPicker = !this.showEmojiPicker;
}

// Méthode pour fermer le picker d'emojis
closeEmojiPicker(): void {
  this.showEmojiPicker = false;
}

// Méthode appelée lors de la sélection d'un emoji
onEmojiSelect(event: any): void {
  if (!event || !event.emoji || !event.emoji.native) {
    console.warn('⚠️ Emoji invalide sélectionné:', event);
    return;
  }

  const emoji = event.emoji.native;
  const textArea = document.getElementById('commentTextArea') as HTMLTextAreaElement;

  if (textArea) {
    // Sauvegarder la position du curseur
    const startPos = textArea.selectionStart;
    const endPos = textArea.selectionEnd;

    // Insérer l'emoji à la position du curseur
    const textBefore = this.newCommentText.substring(0, startPos);
    const textAfter = this.newCommentText.substring(endPos);

    this.newCommentText = textBefore + emoji + textAfter;

    // Remettre le focus sur le textarea et repositionner le curseur
    setTimeout(() => {
      textArea.focus();
      const newPosition = startPos + emoji.length;
      textArea.setSelectionRange(newPosition, newPosition);
    }, 10);
  } else {
    // Fallback si le textarea n'est pas trouvé
    this.newCommentText += emoji;
  }

  // Fermer le picker après sélection
  this.closeEmojiPicker();

  console.log('✅ Emoji ajouté:', emoji);
}

// Méthode pour sauvegarder la position du curseur
saveCursorPosition(event: Event): void {
  const target = event.target as HTMLTextAreaElement;
  this.cursorPosition = target.selectionStart;
}

// Gestionnaire de clic à l'extérieur du picker pour le fermer
@HostListener('document:click', ['$event'])
onDocumentClick(event: Event): void {
  const target = event.target as HTMLElement;
  const emojiPicker = document.querySelector('.emoji-picker-container');
  const emojiButton = document.querySelector('.emoji-toggle-button');

  // Fermer le picker si on clique en dehors
  if (this.showEmojiPicker &&
      emojiPicker &&
      !emojiPicker.contains(target) &&
      emojiButton &&
      !emojiButton.contains(target)) {
    this.closeEmojiPicker();
  }
}

// Méthode pour gérer les raccourcis clavier dans le textarea
onTextareaKeydown(event: KeyboardEvent): void {
  // Échapper pour fermer le picker
  if (event.key === 'Escape' && this.showEmojiPicker) {
    this.closeEmojiPicker();
    event.preventDefault();
  }

  // Ctrl+E ou Cmd+E pour ouvrir/fermer le picker
  if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
    this.toggleEmojiPicker();
    event.preventDefault();
  }
}
}
