/* eslint-disable curly */
/* eslint-disable arrow-parens */
/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Content, ContentType, Media, DayProgram, Location } from 'app/core/models/models';
import { ContentService } from 'app/core/services/content.service';
import { MediaService } from 'app/core/services/media.service';
import { DayProgramService } from 'app/core/services/day-program.service';
import { LocationService } from 'app/core/services/location.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-content-details',
  templateUrl: './content-details.component.html',
  styleUrls: ['./content-details.component.scss']
})
export class ContentDetailsComponent implements OnInit, OnDestroy {
  contentId!: string;
  content?: Content;
  media: Media[] = [];
  dayPrograms: DayProgram[] = [];
  locations: Location[] = [];

  loading = true;
  mediaLoading = false;
  daysLoading = false;
  error = false;

  ContentType = ContentType; // For enum usage in the template

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService,
    private mediaService: MediaService,
    private dayProgramService: DayProgramService,
    private locationService: LocationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.contentId = id;
        this.loadContent();
      } else {
        this.handleError('Content ID not found');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContent(): void {
    this.loading = true;
    this.error = false;

    this.contentService.getContentById(this.contentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (data) => {
          this.content = data;
          this.loadRelatedData();
        },
        error: (err) => {
          console.error('Error loading content:', err);
          this.handleError('Failed to load the requested content');
        }
      });
  }

  loadRelatedData(): void {
    if (!this.content) return;

    // Load associated media
    this.mediaLoading = true;
    this.mediaService.getMediaByContentId(this.contentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.mediaLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.media = data;
        },
        error: (err) => {
          console.error('Error loading media:', err);
          this.showNotification('Failed to load associated media', 'error');
        }
      });

    // If it's an itinerary, load day programs
    if (this.content.type === ContentType.ITINERARY) {
      this.daysLoading = true;
      this.dayProgramService.getAllByContent(this.contentId)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.daysLoading = false)
        )
        .subscribe({
          next: (data) => {
            // Sort day programs by day number
            this.dayPrograms = data.sort((a, b) => a.dayNumber - b.dayNumber);
          },
          error: (err) => {
            console.error('Error loading day programs:', err);
            this.showNotification('Failed to load day programs', 'error');
          }
        });
    }

    // Load associated locations if available in the content
    if (this.content.locations && this.content.locations.length > 0) {
      this.locations = this.content.locations;
    }
  }

  handleError(message: string): void {
    this.error = true;
    this.loading = false;
    this.showNotification(message, 'error');
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: [`${type}-snackbar`]
    });
  }

  getContentTypeLabel(type: ContentType): string {
    switch (type) {
      case ContentType.TRAVEL_STORY:
        return 'Travel Story';
      case ContentType.ITINERARY:
        return 'Itinerary';
      default:
        return 'Unknown';
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Not defined';
    return new Date(date).toLocaleDateString();
  }

  getDuration(): string {
    if (!this.content) return 'Not defined';

    if (this.content.duration) {
      return `${this.content.duration} day${this.content.duration > 1 ? 's' : ''}`;
    }

    if (this.content.startDate && this.content.endDate) {
      const start = new Date(this.content.startDate);
      const end = new Date(this.content.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }

    return 'Not defined';
  }

  togglePublishStatus(): void {
    if (!this.content) return;

    const isPublished = this.content.isPublished;
    const action = isPublished ?
      this.contentService.unpublishContent(this.contentId) :
      this.contentService.publishContent(this.contentId);

    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedContent) => {
        this.content = updatedContent;
        const message = isPublished ?
          'Content successfully unpublished' :
          'Content successfully published';
        this.showNotification(message, 'success');
      },
      error: (err) => {
        console.error('Error changing publish status:', err);
        this.showNotification(
          `Failed to ${isPublished ? 'unpublish' : 'publish'} content`,
          'error'
        );
      }
    });
  }

  deleteContent(): void {
    if (confirm('Are you sure you want to delete this content? This action is irreversible.')) {
      this.contentService.deleteContent(this.contentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showNotification('Content successfully deleted', 'success');
            this.router.navigate(['/homecontent']);
          },
          error: (err) => {
            console.error('Error deleting content:', err);
            this.showNotification('Failed to delete content', 'error');
          }
        });
    }
  }

  goToEdit(): void {
    this.router.navigate(['/edit', this.content?.id]);
  }

  goBack(): void {
    this.router.navigate(['/homecontent']);
  }
}
