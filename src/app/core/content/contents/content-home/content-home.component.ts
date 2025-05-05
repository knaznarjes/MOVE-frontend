/* eslint-disable prefer-const */
/* eslint-disable arrow-parens */
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

// Import all required services
import { ContentService } from 'app/core/services/content.service';
import { MediaService } from 'app/core/services/media.service';
import { DayProgramService } from 'app/core/services/day-program.service';
import { ActivityPointService } from 'app/core/services/activity-point.service';
import { environment } from 'environments/environment';
import { Content, ContentType } from 'app/core/models/models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-content-home',
  templateUrl: './content-home.component.html',
  styleUrls: ['./content-home.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('150ms', [
            animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class ContentHomeComponent implements OnInit {
  contents: Content[] = [];
  loading = true;
  showItineraryPreview = true;
  environment = environment;

  // Store itinerary data for each content
  itineraryData: { [contentId: string]: any } = {};

  constructor(
    private contentService: ContentService,
    private mediaService: MediaService,
    private dayProgramService: DayProgramService,
    private activityPointService: ActivityPointService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadContents();
  }

  loadContents(): void {
    this.loading = true;

    // Get all contents (or getMyContents() for user's own contents)
    this.contentService.getAllContents().pipe(
      finalize(() => this.loading = false)
    ).subscribe(
      (contents: Content[]) => {
        this.contents = contents;

        // Load media for each content
        this.contents.forEach(content => {
          // Load media for thumbnails if needed
          this.loadMediaForContent(content);

          // Load itinerary data if content is an itinerary
          if (content.type === ContentType.ITINERARY) {
            this.loadItineraryData(content.id);
          }
        });
      },
      (error) => {
        console.error('Error loading contents', error);
        this.showError('Unable to load contents. Please try again later.');
      }
    );
  }

  loadMediaForContent(content: Content): void {
    if (!content.media || content.media.length === 0) {
      this.mediaService.getMediaByContentId(content.id).pipe(
        catchError(error => {
          console.error(`Error loading media for content ${content.id}`, error);
          return of([]);
        })
      ).subscribe(media => {
        content.media = media;
      });
    }
  }

  loadItineraryData(contentId: string): void {
    this.dayProgramService.getAllByContent(contentId).pipe(
      catchError(error => {
        console.error(`Error loading day programs for content ${contentId}`, error);
        return of([]);
      })
    ).subscribe(days => {
      if (days && days.length > 0) {
        this.itineraryData[contentId] = {
          days: days,
          dayCount: days.length,
          activities: []
        };

        // Load activities for each day with improved error handling
        if (days.length > 0) {
          const activitiesObservables = days.map(day =>
            this.activityPointService.getAllByDay(day.id).pipe(
              catchError((error: HttpErrorResponse) => {
                if (error.status === 403) {
                  console.warn(`Access forbidden when loading activities for day ${day.id}. User may not have permission.`);
                } else {
                  console.error(`Error loading activities for day ${day.id}`, error);
                }
                return of([]);
              })
            )
          );

          forkJoin(activitiesObservables).subscribe(activitiesResults => {
            let allActivities = ([] as any[]).concat(...activitiesResults);
            this.itineraryData[contentId].activities = allActivities;
            this.itineraryData[contentId].activityCount = allActivities.length;
          });
        }
      }
    });
  }

  hasItinerary(contentId: string): boolean {
    return Boolean(this.itineraryData[contentId] &&
                   this.itineraryData[contentId].days &&
                   this.itineraryData[contentId].days.length > 0);
  }

  getItineraryDaysCount(contentId: string): number {
    return this.itineraryData[contentId]?.dayCount || 0;
  }

  getActivitiesCount(contentId: string): number {
    return this.itineraryData[contentId]?.activityCount || 0;
  }

  viewItinerary(contentId: string): void {
    this.router.navigate(['/content', contentId, 'itinerary']);
  }

  deleteContent(id: string): void {
    if (confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      this.contentService.deleteContent(id).subscribe(
        () => {
          this.contents = this.contents.filter(content => content.id !== id);
          this.showSuccess('Content deleted successfully');
        },
        (error) => {
          console.error('Error deleting content', error);
          this.showError('Unable to delete the content. Please try again later.');
        }
      );
    }
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
