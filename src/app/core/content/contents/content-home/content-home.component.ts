/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable arrow-parens */
/* eslint-disable curly */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AdvancedSearchParams, Content, ContentIndex, ContentType, Media, Role, User } from 'app/core/models/models';
import { AuthService } from 'app/core/services/auth.service';
import { ContentFavorisService } from 'app/core/services/content.favoris.service';
import { ContentService } from 'app/core/services/content.service';
import { MediaService } from 'app/core/services/media.service';
import { SearchService } from 'app/core/services/search.service';
import { environment } from 'environments/environment';

import { catchError, finalize, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-content-home',
  templateUrl: './content-home.component.html',
  styleUrls: ['./content-home.component.scss']
})
export class ContentHomeComponent implements OnInit {
  myContents: Content[] = [];
  allContents: Content[] = [];
  travelStories: Content[] = [];
  itineraries: Content[] = [];
  topLikedContents: Content[] = [];
  myFavorites: Content[] = []; // New property for favorites
  contentMediaMap: Map<string, Media> = new Map();
  pendingContents: Content[] = [];
  loadingPending = false;
  searchForm: FormGroup;

  // Track loading states of media for each content
  mediaLoadingMap: Map<string, boolean> = new Map();
  mediaErrorMap: Map<string, boolean> = new Map();

  // Track loading states for content actions
  actionLoadingMap: Map<string, { like?: boolean, rate?: boolean, favorite?: boolean }> = new Map();

  //search
  searchKeyword: string = '';
  searchResults: Content[] = [];
  isSearching: boolean = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalSearchResults: number = 0;
  showSearchResults: boolean = false;

  // Advanced search properties
  advancedSearchEnabled: boolean = false;
  minBudget: number | null = null;
  maxBudget: number | null = null;
  minRating: number | null = null;
  selectedContentType: string | null = null;
  sortBy: string = 'rating';  // Default sort by rating
  sortDirection: string = 'desc';

  // Search suggestions
  suggestions: string[] = [];
  showSuggestions: boolean = false;
  suggestionsLoading: boolean = false;
  suggestionTimeout: any = null;

  // Track user interactions with content
  userLikedMap: Map<string, boolean> = new Map();
  userRatingMap: Map<string, number> = new Map();
  userNamesMap: Map<string, string> = new Map();
  userFavoritesMap: Map<string, boolean> = new Map(); // New property for favorites tracking

  loading = {
    myContents: true,
    allContents: true,
    topLiked: true,
    myFavorites: true // New loading state for favorites
  };

  contentTypes = ContentType;
  selectedTab = 'all';
  userRole: Role | null = null;
  currentUserId: string | null = null;

  constructor(
    private contentService: ContentService,
    private mediaService: MediaService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private searchService: SearchService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private contentFavorisService: ContentFavorisService // New service injection
  ) {
    // Initialize the form
    this.searchForm = this.fb.group({
      keyword: [''],
      // Add any other form controls you need for advanced search
      minBudget: [null],
      maxBudget: [null],
      minRating: [null],
      contentType: [null],
      sortBy: ['rating'],
      sortDirection: ['desc']
    });
  }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.currentUserId = this.authService.getUserId();
    if (this.userRole === Role.ADMIN || this.userRole === Role.MASTERADMIN) {
      this.loadPendingContents();
    }

    if (this.isTraveler()) {
      this.loadMyContents();
      this.loadMyFavorites(); // Load favorites for travelers
    }
    this.loadAllContents();
    this.loadTopLikedContents();

    // Load user interaction data
    this.loadUserInteractionData();
  }



  loadPendingContents(): void {
    this.loadingPending = true;
    this.contentService.getAllContents()
      .pipe(finalize(() => this.loadingPending = false))
      .subscribe({
        next: contents => {
          this.pendingContents = contents
            .filter(c => !c.isPublished)
            .sort((a, b) =>
              new Date(b.creationDate!).getTime() - new Date(a.creationDate!).getTime()
            );

          this.pendingContents.forEach(content => {
            if (content.id) this.loadContentCoverImage(content.id);
          });
        },
        error: err => {
          console.error('Failed to load pending contents:', err);
        }
      });
  }

  isAdmin(): boolean {
    return this.userRole === Role.ADMIN || this.userRole === Role.MASTERADMIN;
  }

  approve(content: Content, event: Event): void {
    event.stopPropagation();
    if (!content.id) return;

    this.contentService.approveContent(content.id).subscribe({
      next: updated => {
        this.pendingContents = this.pendingContents.filter(c => c.id !== content.id);
        this.allContents.unshift(updated); // Ajout direct aux contenus visibles
        this.snackBar.open('✅ Content approved and published!', 'Close', { duration: 3000 });
      },
      error: err => {
        console.error('Approval failed:', err);
        this.snackBar.open('❌ Failed to approve content', 'Close', { duration: 3000 });
      }
    });
  }


  // Check if favorite action is loading
  isFavoriteLoading(contentId: string): boolean {
    if (!contentId) return false;
    const state = this.actionLoadingMap.get(contentId);
    return state ? !!state.favorite : false;
  }

  loadMyContents(): void {
    this.loading.myContents = true;
    this.contentService.getMyContents()
      .pipe(finalize(() => this.loading.myContents = false))
      .subscribe({
        next: (contents) => {
          // No longer filtering for isPublished - show all contents
          this.myContents = contents
            .sort((a, b) =>
              new Date(b.lastModified || b.creationDate || 0).getTime() -
              new Date(a.lastModified || a.creationDate || 0).getTime()
            );
          this.travelStories = this.myContents.filter(c => c.type === ContentType.TRAVEL_STORY);
          this.itineraries = this.myContents.filter(c => c.type === ContentType.ITINERARY);
          this.myContents.forEach(content => {
            if (content.id) this.loadContentCoverImage(content.id);
          });
        },
        error: (error) => console.error('Error loading my contents:', error)
      });
  }

  // Load top liked contents
  loadTopLikedContents(): void {
    this.loading.topLiked = true;

    this.contentService.getTopLikedContents()
      .pipe(finalize(() => this.loading.topLiked = false))
      .subscribe({
        next: (contents) => {
          this.topLikedContents = contents
            .filter(content => content.isPublished)
            .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));

          this.topLikedContents.forEach(content => {
            if (content.id) {
              this.loadContentCoverImage(content.id);
            }

            // Charger le nom du créateur s'il n'est pas encore dans la map
            if (content.userId && !this.userNamesMap.has(content.userId)) {
              this.authService.getUserById(content.userId).subscribe({
                next: user => {
                  this.userNamesMap.set(content.userId!, user.fullName);
                },
                error: err => {
                  console.error(`Failed to load user fullName for ID ${content.userId}:`, err);
                  this.userNamesMap.set(content.userId!, 'Unknown');
                }
              });
            }
          });
        },
        error: (error) => {
          console.error('Error loading top liked contents:', error);
        }
      });
  }

  // Vérifier si l'utilisateur a aimé un contenu spécifique
  hasUserLiked(contentId: string): boolean {
    if (!contentId) return false;
    return this.userLikedMap.get(contentId) === true;
  }

  // Vérifier si une action spécifique est en cours de chargement
  isActionLoading(contentId: string, action: 'like' | 'rate' | 'favorite'): boolean {
    if (!contentId) return false;
    const state = this.actionLoadingMap.get(contentId);
    return state ? !!state[action] : false;
  }

  // Aimer/ne plus aimer un contenu
  likeContent(content: Content, event: Event): void {
    event.stopPropagation(); // Empêcher la navigation vers les détails du contenu
    if (!content.id || !this.currentUserId) {
      // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
      if (!this.currentUserId) {
        this.router.navigate(['/auth/login']);
        return;
      }
      return;
    }

    // Définir l'état de chargement pour l'action "j'aime" de ce contenu
    this.setActionLoadingState(content.id, { like: true });

    // Vérifier si l'utilisateur a déjà aimé ce contenu
    const alreadyLiked = this.userLikedMap.get(content.id) === true;

    const request = alreadyLiked
      ? this.contentService.unlikeContent(content.id)
      : this.contentService.likeContent(content.id);

    request.subscribe({
      next: (updatedContent) => {
        // Mettre à jour le nombre de "j'aime" du contenu
        content.likeCount = updatedContent.likeCount;

        // Mettre à jour le statut "j'aime" de l'utilisateur pour ce contenu
        this.userLikedMap.set(content.id!, !alreadyLiked);

        // Réinitialiser l'état de chargement
        this.setActionLoadingState(content.id!, { like: false });
      },
      error: (err) => {
        console.error('Erreur lors du traitement de l\'action like/unlike:', err);
        // Réinitialiser l'état de chargement en cas d'erreur
        this.setActionLoadingState(content.id!, { like: false });
      }
    });
  }

  // Méthode auxiliaire pour gérer les états de chargement des actions sur le contenu
  private setActionLoadingState(contentId: string, state: { like?: boolean, rate?: boolean, favorite?: boolean }): void {
    const currentState = this.actionLoadingMap.get(contentId) || {};
    this.actionLoadingMap.set(contentId, { ...currentState, ...state });
  }

  loadAllContents(): void {
    this.loading.allContents = true;
    this.contentService.getAllContents()
      .pipe(finalize(() => this.loading.allContents = false))
      .subscribe({
        next: (contents) => {
          // Filter only published contents
          this.allContents = contents
            .filter(content => content.isPublished)
            .sort((a, b) =>
              new Date(b.lastModified || b.creationDate || 0).getTime() -
              new Date(a.lastModified || a.creationDate || 0).getTime()
            );
          this.allContents.forEach(content => {
            if (content.id) this.loadContentCoverImage(content.id);
          });
        },
        error: (error) => console.error('Error loading all contents:', error)
      });
  }

  /**
   * Load the cover image for a content
   * Stores the media in contentMediaMap for later use in getContentCoverUrl
   */
  loadContentCoverImage(contentId: string): void {
    // Mark this content as loading media
    this.mediaLoadingMap.set(contentId, true);
    this.mediaErrorMap.set(contentId, false); // Reset any previous error

    this.mediaService.getCoverByContentId(contentId)
      .pipe(
        finalize(() => this.mediaLoadingMap.set(contentId, false)),
        catchError(err => {
          console.error(`Failed to load cover image for content ${contentId}:`, err);
          this.mediaErrorMap.set(contentId, true);
          return of(null);
        })
      )
      .subscribe({
        next: (media) => {
          if (media) {
            // Store the media object
            this.contentMediaMap.set(contentId, media);
          } else {
            // Set a null media to indicate we tried but no media was found
            this.contentMediaMap.set(contentId, { fileName: null } as Media);
          }
        }
      });
  }

  /**
   * Get the cover image URL for a content
   * Used in template to display content cover images
   */
  getContentCoverUrl(contentId: string): SafeUrl | string {
    // Default fallback image
    const defaultImage = 'assets/images/default-cover.jpg';

    // Check if we have media for this content
    const media = this.contentMediaMap.get(contentId);

    if (!media || !media.fileName) {
      return defaultImage;
    }

    try {
      let url: string;

      if (media.id) {
        // Use the media ID to get the URL if available
        url = this.mediaService.getMediaFileUrl(media.id);
      } else if (contentId && media.fileName) {
        // Fallback to using content ID and file name
        url = this.mediaService.getMediaFileUrlByPath(contentId, media.fileName);
      } else {
        return defaultImage;
      }

      return this.sanitizer.bypassSecurityTrustUrl(url);
    } catch (error) {
      console.error('Error creating media URL:', error);
      return defaultImage;
    }
  }

  // Check if media is loading for a content
  isMediaLoading(contentId: string): boolean {
    return this.mediaLoadingMap.get(contentId) === true;
  }

  // Check if media had an error for a content
  hasMediaError(contentId: string): boolean {
    return this.mediaErrorMap.get(contentId) === true;
  }

  navigateToContentDetails(content: Content): void {
    this.router.navigate(['/content', content.id]);
  }

  createNewContent(type: ContentType): void {
    this.router.navigate(['/add/content'], { queryParams: { type } });
  }

  formatDate(date: Date | string | undefined | number): string {
    return date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  }

  calculateDuration(content: Content): string {
    if (content.duration) return `${content.duration} days`;
    if (content.startDate && content.endDate) {
      const start = new Date(content.startDate);
      const end = new Date(content.endDate);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 0 ? '1 day' : `${diff} days`;
    }
    return 'N/A';
  }

  getLocationNames(content: Content): string {
    if (!content.locations || content.locations.length === 0) return 'Location not specified';
    return content.locations
      .map(location => location.country)
      .filter((country, index, self) => self.indexOf(country) === index)
      .join(', ');
  }

  publishContent(content: Content, event: Event): void {
    event.stopPropagation();
    if (!content.id) return;

    const serviceCall = content.isPublished
      ? this.contentService.unpublishContent(content.id)
      : this.contentService.publishContent(content.id);

    serviceCall.subscribe({
      next: (updatedContent) => {
        // Remove the content from all collections if it's unpublished
        if (!updatedContent.isPublished) {
          this.myContents = this.myContents.filter(c => c.id !== content.id);
          this.allContents = this.allContents.filter(c => c.id !== content.id);
          this.travelStories = this.travelStories.filter(c => c.id !== content.id);
          this.itineraries = this.itineraries.filter(c => c.id !== content.id);
          this.topLikedContents = this.topLikedContents.filter(c => c.id !== content.id);
          this.myFavorites = this.myFavorites.filter(c => c.id !== content.id);
        }
      },
      error: (error) => console.error(`Error ${content.isPublished ? 'unpublishing' : 'publishing'} content:`, error)
    });
  }

  deleteContent(content: Content, event: Event): void {
    event.stopPropagation();
    if (!content.id) return;
    if (confirm(`Are you sure you want to delete "${content.title}"?`)) {
      this.contentService.deleteContent(content.id).subscribe({
        next: () => {
          this.myContents = this.myContents.filter(c => c.id !== content.id);
          this.allContents = this.allContents.filter(c => c.id !== content.id);
          this.travelStories = this.travelStories.filter(c => c.id !== content.id);
          this.itineraries = this.itineraries.filter(c => c.id !== content.id);
          this.topLikedContents = this.topLikedContents.filter(c => c.id !== content.id);
          this.myFavorites = this.myFavorites.filter(c => c.id !== content.id);
        },
        error: (error) => console.error('Error deleting content:', error)
      });
    }
  }

  editContent(content: Content, event: Event): void {
    event.stopPropagation();
    if (content.id) {
      this.router.navigate(['/edit', content.id]);
    }
  }

  isTraveler(): boolean {
    return this.userRole === Role.TRAVELER;
  }

  selectTab(tab: string): void {
    const travelerOnlyTabs = ['my', 'stories', 'itineraries', 'favorites'];
    if (travelerOnlyTabs.includes(tab) && !this.isTraveler()) {
      alert('Access denied: this section is for Travelers only.');
      return;
    }
    this.selectedTab = tab;
  }

  getStarFill(content: Content, star: number): boolean {
    if (!content.id) return false;

    // Priorité à la note utilisateur s'il existe
    const userRating = this.userRatingMap.get(content.id);
    if (userRating !== undefined && userRating !== null) {
      return star <= userRating;
    }

    // Sinon, afficher les étoiles selon la moyenne (arrondi à l'entier inférieur)
    const avg = content.averageRating ?? 0;
    return star <= Math.floor(avg); // NE PAS utiliser Math.round() ici
  }

  getRatingTooltip(content: Content): string {
    if (!this.currentUserId) return 'Login to rate';

    const userRating = content.id ? this.userRatingMap.get(content.id) : undefined;

    if (userRating) {
      return `Your rating: ${userRating}/5 (click again to change)`;
    } else {
      return 'Click to rate';
    }
  }

  isRatingLoading(contentId: string): boolean {
    const state = this.actionLoadingMap.get(contentId);
    return state ? !!state.rate : false;
  }

  // Helper to format average rating with one decimal place
  formatAverageRating(rating: number | undefined): string {
    if (rating === undefined || rating === 0) return 'Not rated';
    return rating.toFixed(1);
  }

  formatLikeCount(likeCount: number | undefined): string {
    if (!likeCount || likeCount === 0) return '';
    return likeCount === 1 ? '1 like' : `${likeCount} likes`;
  }

  toggleAdvancedSearch(): void {
    this.advancedSearchEnabled = !this.advancedSearchEnabled;

    // Reset advanced search fields if disabling
    if (!this.advancedSearchEnabled) {
      this.searchForm.patchValue({
        minBudget: null,
        maxBudget: null,
        minRating: null,
        contentType: null,
        sortBy: 'rating',
        sortDirection: 'desc'
      });

      // If search is active, perform it again with reset filters
      if (this.showSearchResults) {
        this.currentPage = 0; // Reset to first page
        this.performSearch();
      }
    }
  }

  resetFilters(): void {
    this.minBudget = null;
    this.maxBudget = null;
    this.minRating = null;
    this.selectedContentType = null;
    this.sortBy = 'rating';
    this.sortDirection = 'desc';

    // If search is active, perform it again with reset filters
    if (this.showSearchResults) {
      this.currentPage = 0; // Reset to first page
      this.performSearch();
    }
  }
  performSearch(): void {
    // Don't perform search if no keyword and advanced search is disabled
    if (!this.searchKeyword.trim() && !this.advancedSearchEnabled) {
      this.showSearchResults = false;
      return;
    }

    this.isSearching = true;
    this.showSearchResults = true;

    // Build search parameters object
    const searchParams: AdvancedSearchParams = {
      page: this.currentPage,
      size: this.pageSize,
      isPublished: true // Only search for published content
    };

    // Add keyword if present
    const trimmedKeyword = this.searchKeyword?.trim();
    if (trimmedKeyword) {
      searchParams.keyword = trimmedKeyword;
    }

    // Add advanced filters if enabled
    if (this.advancedSearchEnabled) {
      if (this.minBudget !== null) {
        searchParams.minBudget = this.minBudget;
      }

      if (this.maxBudget !== null) {
        searchParams.maxBudget = this.maxBudget;
      }

      if (this.minRating !== null) {
        searchParams.minRating = this.minRating;
      }

      if (this.selectedContentType) {
        searchParams.type = this.selectedContentType;
      }

      searchParams.sortBy = this.sortBy || 'rating';
      searchParams.sortDirection = (this.sortDirection as 'asc' | 'desc') || 'desc';
    }

   const searchCall = this.advancedSearchEnabled
  ? this.searchService.advancedSearch(searchParams)
  : this.searchService.publicKeywordSearch(trimmedKeyword, this.currentPage, this.pageSize);

searchCall
  .pipe(
    finalize(() => this.isSearching = false),
    catchError(error => {
      console.error('Search failed:', error);
      this.snackBar.open('Search failed. Please try again.', 'Close', { duration: 3000 });
      this.searchResults = [];
      this.totalSearchResults = 0;
      return of(null);
    })
  )
  .subscribe({
    next: (result) => {
      if (!result) return;
      this.totalSearchResults = result.totalElements;
      this.searchResults = result.content.map(index => ({
        id: index.id,
        title: index.title,
        description: index.description,
        budget: index.budget,
        creationDate: index.creationDate,
        lastModified: index.lastModified,
        isPublished: index.isPublished,
        type: index.type,
        userId: index.userId,
        media: [],
        locations: [],
        dayPrograms: [],
        averageRating: index.averageRating || 0,
        likeCount: index.likeCount || 0
      }));
      this.loadSearchResultDetails();
    }
  });

  }

  loadSearchResultDetails(): void {
    // Create a map to track which user IDs we need to fetch
    const userIdsToFetch = new Set<string>();

    // Process each search result
    this.searchResults.forEach(content => {
      if (!content.id) return;

      // Load cover image
      this.loadContentCoverImage(content.id);

      // Track user IDs that need to be fetched
      if (content.userId && !this.userNamesMap.has(content.userId)) {
        userIdsToFetch.add(content.userId);
      }

      // Load full content details
      this.loadFullContentDetails(content);
    });

    // Fetch user details in batch if needed
    this.loadUserDetailsInBatch(Array.from(userIdsToFetch));
  }

  loadFullContentDetails(content: Content): void {
    if (!content.id) return;

    this.contentService.getContentById(content.id)
      .pipe(
        catchError(err => {
          console.error(`Error loading details for content ${content.id}:`, err);
          return of(null);
        })
      )
      .subscribe(fullContent => {
        if (!fullContent) return;

        // Find and update the content in our results array
        const index = this.searchResults.findIndex(c => c.id === content.id);
        if (index !== -1) {
          // Update only the properties we need
          this.searchResults[index] = {
            ...this.searchResults[index],
            locations: fullContent.locations || [],
            dayPrograms: fullContent.dayPrograms || [],
            averageRating: fullContent.averageRating || 0,
            likeCount: fullContent.likeCount || 0,
            startDate: fullContent.startDate,
            endDate: fullContent.endDate,
            duration: fullContent.duration
          };
        }
      });
  }

  loadUserDetailsInBatch(userIds: string[]): void {
    if (!userIds.length) return;

    // Create an array of observables for each user ID
    const userObservables = userIds.map(userId =>
      this.authService.getUserById(userId).pipe(
        catchError(err => {
          console.error(`Error loading user for ${userId}:`, err);
          return of({ id: userId, fullName: 'Unknown User' } as User);
        })
      )
    );

    // Use forkJoin to load all users in parallel
    forkJoin(userObservables).subscribe(users => {
      users.forEach(user => {
        if (user && user.id) {
          this.userNamesMap.set(user.id, user.fullName);
        }
      });
    });
  }

  onSearchSubmit(event: Event): void {
    event.preventDefault();

    // Update values from form
    this.searchKeyword = this.searchForm.get('keyword')?.value || '';

    if (this.advancedSearchEnabled) {
      this.minBudget = this.searchForm.get('minBudget')?.value;
      this.maxBudget = this.searchForm.get('maxBudget')?.value;
      this.minRating = this.searchForm.get('minRating')?.value;
      this.selectedContentType = this.searchForm.get('contentType')?.value;
      this.sortBy = this.searchForm.get('sortBy')?.value || 'rating';
      this.sortDirection = this.searchForm.get('sortDirection')?.value || 'desc';
    }

    this.currentPage = 0; // Reset to first page
    this.performSearch();
  }

  /**
   * Apply current filters
   */
  applyFilters(): void {
    this.currentPage = 0; // Reset to first page
    this.performSearch();
  }

  /**
   * Go to next page of search results
   */
  goToNextPage(): void {
    const totalPages = this.getTotalPages();
    if (this.currentPage < totalPages - 1) {
      this.currentPage++;
      this.performSearch();
      this.scrollToSearchResults();
    }
  }

  /**
   * Go to previous page of search results
   */
  goToPreviousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.performSearch();
      this.scrollToSearchResults();
    }
  }

  /**
   * Go to a specific page of search results
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.getTotalPages()) {
      this.currentPage = page;
      this.performSearch();
      this.scrollToSearchResults();
    }
  }

  /**
   * Scroll to search results container
   */
  scrollToSearchResults(): void {
    setTimeout(() => {
      const resultsElement = document.querySelector('.search-results-container');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }
getTotalPages(): number {
  return this.pageSize > 0 ?
    Math.ceil(this.totalSearchResults / this.pageSize) : 0;
}

/**
 * Get page numbers for pagination display
 */
getPageNumbers(): number[] {
  const totalPages = this.getTotalPages();
  const currentPage = this.currentPage;
  const pages: number[] = [];

  // Show at most 5 page numbers
  const maxPages = 5;

  if (totalPages <= maxPages) {
    // If there are 5 or fewer pages, show all of them
    for (let i = 0; i < totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always include first page
    pages.push(0);

    // Calculate start and end of page numbers to show
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(start + 2, totalPages - 1);

    // Adjust start if we're near the end
    if (end === totalPages - 1) {
      start = Math.max(1, end - 2);
    }

    // Add ellipsis after first page if needed
    if (start > 1) {
      pages.push(-1); // -1 represents ellipsis
    }

    // Add page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      pages.push(-2); // -2 represents ellipsis
    }

    // Always include last page
    if (totalPages > 1) {
      pages.push(totalPages - 1);
    }
  }

  return pages;
}

/**
 * Check if there are search results
 */
hasSearchResults(): boolean {
  return this.showSearchResults && this.searchResults.length > 0;
}

// Fixed fetchSuggestions and related methods for ContentHomeComponent

fetchSuggestions(event: any): void {
  const value = event?.target?.value?.trim();

  // Clear any existing timeout to prevent multiple API calls
  if (this.suggestionTimeout) {
    clearTimeout(this.suggestionTimeout);
  }

  // Reset suggestions if input is empty
  if (!value) {
    this.suggestions = [];
    this.showSuggestions = false;
    return;
  }

  // Add slight delay to avoid making API calls on every keystroke
  this.suggestionTimeout = setTimeout(() => {
    this.suggestionsLoading = true;

    this.searchService.getSuggestions(value)
      .pipe(finalize(() => this.suggestionsLoading = false))
      .subscribe({
        next: (results) => {
          console.log('Suggestions received:', results);
          this.suggestions = results || [];
          this.showSuggestions = (results && results.length > 0);
        },
        error: (error) => {
          console.error('Failed to fetch suggestions:', error);
          this.suggestions = [];
          this.showSuggestions = false;
        }
      });
  }, 300); // 300ms delay
}

onSearchInputChange(event: any): void {
  // Update search keyword as user types
  this.searchKeyword = event.target.value;

  // Clear results when search is emptied
  if (!this.searchKeyword.trim()) {
    this.clearSearch();
  } else {
    // Fetch suggestions as user types
    this.fetchSuggestions(event);
  }
}

onSuggestionSelected(suggestion: string): void {
  this.searchKeyword = suggestion;
  this.showSuggestions = false;
  this.currentPage = 0;
  this.searchForm.patchValue({ keyword: suggestion });
  this.performSearch();
}

// Make sure to add this method to handle clicks outside the suggestion box to close it
onClickOutside(): void {
  this.showSuggestions = false;
}
clearSearch(): void {
  this.searchKeyword = '';
  this.searchResults = [];
  this.showSearchResults = false;
  this.currentPage = 0;
  this.suggestions = [];
  this.showSuggestions = false;
  this.resetFilters();
}
















// Méthodes corrigées pour les favoris dans ContentHomeComponent

// 1. Correction de la méthode loadMyFavorites()
loadMyFavorites(): void {
  if (!this.currentUserId) return;

  this.loading.myFavorites = true;
  this.contentFavorisService.getUserFavorites(this.currentUserId)
    .pipe(finalize(() => this.loading.myFavorites = false))
    .subscribe({
      next: (favorites) => {
        const favoriteContentIds = favorites.map(f => f.contentId);

        if (favoriteContentIds.length === 0) {
          this.myFavorites = [];
          return;
        }

        // Load content details for each favorite
        const contentObservables = favoriteContentIds.map(contentId =>
          this.contentService.getContentById(contentId).pipe(
            catchError(err => {
              console.error(`Failed to load favorite content ${contentId}:`, err);
              return of(null);
            })
          )
        );

        forkJoin(contentObservables).subscribe({
          next: (contents) => {
            this.myFavorites = contents
              .filter(content => content && content.isPublished) // Only show published favorites
          .sort((a, b) => {
  const aFavorite = favorites.find(f => f.contentId === a!.id);
  const bFavorite = favorites.find(f => f.contentId === b!.id);
  const aDate = aFavorite?.dateAdded || new Date();
  const bDate = bFavorite?.dateAdded || new Date();
  return new Date(bDate).getTime() - new Date(aDate).getTime(); // du plus récent au plus ancien
});


            // Load cover images for favorites
            this.myFavorites.forEach(content => {
              if (content.id) this.loadContentCoverImage(content.id);
            });
          },
          error: (error) => console.error('Error loading favorite contents:', error)
        });
      },
      error: (error) => console.error('Error loading user favorites:', error)
    });
}

// 2. Correction de la méthode loadUserInteractionData()
loadUserInteractionData(): void {
  if (!this.currentUserId) return;

  // Load likes
  this.contentService.getUserLikes().subscribe({
    next: (likedContentIds) => {
      likedContentIds.forEach(contentId => {
        this.userLikedMap.set(contentId, true);
      });
    },
    error: (error) => console.error('Error loading user likes:', error)
  });

  // Load favorites - CORRIGÉ
  this.contentFavorisService.getFavoritedContentIds(this.currentUserId).subscribe({
    next: (favoritedContentIds) => {
      favoritedContentIds.forEach(contentId => {
        this.userFavoritesMap.set(contentId, true);
      });
    },
    error: (error) => console.error('Error loading user favorites:', error)
  });
}

// 3. Correction de la méthode toggleFavorite()
toggleFavorite(content: Content, event: Event): void {
  event.stopPropagation(); // Prevent navigation to content details

  if (!content.id || !this.currentUserId) {
    // If user is not logged in, redirect to login
    if (!this.currentUserId) {
      this.router.navigate(['/auth/login']);
      return;
    }
    return;
  }

  // Set loading state for favorite action
  this.setActionLoadingState(content.id, { favorite: true });

  const isCurrentlyFavorited = this.userFavoritesMap.get(content.id) === true;

  this.contentFavorisService.toggleFavorite(this.currentUserId, content.id)
    .subscribe({
      next: (result) => {
        // Update the favorites map
        this.userFavoritesMap.set(content.id!, !isCurrentlyFavorited);

        if (!isCurrentlyFavorited) {
          // Content was added to favorites
          this.snackBar.open('⭐ Added to favorites!', 'Close', { duration: 2000 });

          // Reload favorites list if currently viewing favorites tab
          if (this.selectedTab === 'favorites') {
            this.loadMyFavorites();
          }
        } else {
          // Content was removed from favorites
          this.snackBar.open('💔 Removed from favorites', 'Close', { duration: 2000 });

          // Remove from favorites list if currently viewing favorites
          if (this.selectedTab === 'favorites') {
            this.myFavorites = this.myFavorites.filter(c => c.id !== content.id);
          }
        }

        // Reset loading state
        this.setActionLoadingState(content.id!, { favorite: false });
      },
      error: (err) => {
        console.error('Error toggling favorite:', err);
        this.snackBar.open('❌ Failed to update favorites', 'Close', { duration: 3000 });
        this.setActionLoadingState(content.id!, { favorite: false });
      }
    });
}

// 4. Méthode alternative pour ajouter aux favoris (si nécessaire)
addToFavorites(content: Content, event: Event): void {
  event.stopPropagation();

  if (!content.id || !this.currentUserId) {
    if (!this.currentUserId) {
      this.router.navigate(['/auth/login']);
      return;
    }
    return;
  }

  this.setActionLoadingState(content.id, { favorite: true });

  this.contentFavorisService.addToFavorites(this.currentUserId, content.id)
    .subscribe({
      next: (favorite) => {
        this.userFavoritesMap.set(content.id!, true);
        this.snackBar.open('⭐ Added to favorites!', 'Close', { duration: 2000 });

        // Reload favorites if on favorites tab
        if (this.selectedTab === 'favorites') {
          this.loadMyFavorites();
        }

        this.setActionLoadingState(content.id!, { favorite: false });
      },
      error: (err) => {
        console.error('Error adding to favorites:', err);
        this.snackBar.open('❌ Failed to add to favorites', 'Close', { duration: 3000 });
        this.setActionLoadingState(content.id!, { favorite: false });
      }
    });
}

// 5. Méthode alternative pour retirer des favoris (si nécessaire)
removeFromFavorites(content: Content, event: Event): void {
  event.stopPropagation();

  if (!content.id || !this.currentUserId) return;

  this.setActionLoadingState(content.id, { favorite: true });

  this.contentFavorisService.removeFromFavorites(this.currentUserId, content.id)
    .subscribe({
      next: () => {
        this.userFavoritesMap.set(content.id!, false);
        this.snackBar.open('💔 Removed from favorites', 'Close', { duration: 2000 });

        // Remove from favorites list if currently viewing favorites
        if (this.selectedTab === 'favorites') {
          this.myFavorites = this.myFavorites.filter(c => c.id !== content.id);
        }

        this.setActionLoadingState(content.id!, { favorite: false });
      },
      error: (err) => {
        console.error('Error removing from favorites:', err);
        this.snackBar.open('❌ Failed to remove from favorites', 'Close', { duration: 3000 });
        this.setActionLoadingState(content.id!, { favorite: false });
      }
    });
}

// 6. Méthode pour vérifier si un contenu est en favoris (version améliorée)
isContentFavorited(contentId: string): boolean {
  if (!contentId || !this.currentUserId) return false;
  return this.userFavoritesMap.get(contentId) === true;
}

// 7. Méthode pour compter les favoris d'un contenu (si vous voulez l'afficher)
loadContentFavoriteCount(contentId: string): void {
  this.contentFavorisService.countContentFavorites(contentId)
    .subscribe({
      next: (count) => {
        // Vous pouvez stocker ce count dans une Map si nécessaire
        console.log(`Content ${contentId} has ${count} favorites`);
      },
      error: (err) => console.error(`Error counting favorites for content ${contentId}:`, err)
    });
}

// 8. Méthode pour supprimer tous les favoris d'un utilisateur (admin only)
removeAllUserFavorites(userId: string): void {
  if (!this.isAdmin()) return;

  if (confirm('Are you sure you want to remove all favorites for this user?')) {
    this.contentFavorisService.removeAllUserFavorites(userId)
      .subscribe({
        next: () => {
          this.snackBar.open('All user favorites removed successfully', 'Close', { duration: 3000 });
          // Reload data if necessary
          if (userId === this.currentUserId) {
            this.myFavorites = [];
            this.userFavoritesMap.clear();
          }
        },
        error: (err) => {
          console.error('Error removing all user favorites:', err);
          this.snackBar.open('Failed to remove user favorites', 'Close', { duration: 3000 });
        }
      });
  }
}}
