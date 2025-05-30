/* eslint-disable jsdoc/newline-after-description */
/* eslint-disable arrow-parens */
/* eslint-disable @typescript-eslint/member-delimiter-style */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from 'environments/environment';
import { Content, ContentType } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiUrl = `${environment.apiUrl}/api/contents`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new content item
   * @param content The content object to create
   * @returns Observable of the created Content
   */
  createContent(content: Content): Observable<Content> {
    return this.http.post<Content>(this.apiUrl, content)
      .pipe(
        catchError(error => {
          console.error('Error creating content:', error);
          throw error;
        })
      );
  }

  /**
   * Update an existing content item
   * @param id Content ID to update
   * @param content The updated content object
   * @returns Observable of the updated Content
   */
  updateContent(id: string, content: Content): Observable<Content> {
    return this.http.put<Content>(`${this.apiUrl}/${id}`, content)
      .pipe(
        catchError(error => {
          console.error(`Error updating content ${id}:`, error);
          throw error;
        })
      );
  }

  /**
   * Get all content items belonging to the current user
   * @returns Observable of Content array
   */
  getMyContents(): Observable<Content[]> {
    return this.http.get<Content[]>(`${this.apiUrl}/me`)
      .pipe(
        catchError(error => {
          console.error('Error fetching my contents:', error);
          return of([]);
        })
      );
  }

  /**
   * Get all content items (admin access)
   * @returns Observable of Content array
   */
  getAllContents(): Observable<Content[]> {
    return this.http.get<Content[]>(`${this.apiUrl}/all`)
      .pipe(
        catchError(error => {
          console.error('Error fetching all contents:', error);
          return of([]);
        })
      );
  }

  /**
   * Get a specific content item by ID
   * @param id Content ID to retrieve
   * @returns Observable of the Content
   */
  getContentById(id: string): Observable<Content> {
    return this.http.get<Content>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching content ${id}:`, error);
          throw error;
        })
      );
  }

  /**
   * Delete a content item
   * @param id Content ID to delete
   * @returns Observable that completes when the deletion is successful
   */
  deleteContent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error deleting content ${id}:`, error);
          throw error;
        })
      );
  }

  /**
   * Get content items by type
   * @param type The content type to filter by
   * @returns Observable of Content array
   */
  getContentsByType(type: ContentType): Observable<Content[]> {
    const params = new HttpParams().set('type', type);
    return this.http.get<Content[]>(`${this.apiUrl}/type`, { params })
      .pipe(
        catchError(error => {
          console.error(`Error fetching contents of type ${type}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Get top rated content items
   * @param page Page number (zero-based)
   * @param size Number of items per page
   * @returns Observable of Content array
   */
  getTopRatedContents(page: number = 0, size: number = 10): Observable<Content[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Content[]>(`${this.apiUrl}/top-rated`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching top rated contents:', error);
          return of([]);
        })
      );
  }

  /**
   * Get top liked content items
   * @param page Page number (zero-based)
   * @param size Number of items per page
   * @returns Observable of Content array
   */
  getTopLikedContents(page: number = 0, size: number = 10): Observable<Content[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Content[]>(`${this.apiUrl}/top-liked`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching top liked contents:', error);
          return of([]);
        })
      );
  }

  /**
   * Block content as master admin
   * @param id Content ID to block
   * @returns Observable of the blocked Content
   */
  blockContentAsMaster(id: string): Observable<Content> {
    return this.http.put<Content>(`${this.apiUrl}/${id}/block`, {})
      .pipe(
        catchError(error => {
          console.error(`Error blocking content ${id} as master:`, error);
          throw error;
        })
      );
  }

  /**
   * Block content as admin with verification of owner role
   * @param id Content ID to block
   * @param ownerRole Role of the content owner
   * @returns Observable of the blocked Content
   */
  blockContentAsAdmin(id: string, ownerRole: string): Observable<Content> {
    const params = new HttpParams().set('ownerRole', ownerRole);
    return this.http.put<Content>(`${this.apiUrl}/${id}/block-admin`, {}, { params })
      .pipe(
        catchError(error => {
          console.error(`Error blocking content ${id} as admin:`, error);
          throw error;
        })
      );
  }

  /**
   * Like a content item
   * @param contentId Content ID to like
   * @returns Observable of the updated Content
   */
  likeContent(contentId: string): Observable<Content> {
    return this.http.post<Content>(`${this.apiUrl}/${contentId}/like`, {})
      .pipe(
        catchError(error => {
          console.error(`Error liking content ${contentId}:`, error);
          throw error;
        })
      );
  }

  /**
   * Unlike a content item
   * @param contentId Content ID to unlike
   * @returns Observable of the updated Content
   */
  unlikeContent(contentId: string): Observable<Content> {
    return this.http.post<Content>(`${this.apiUrl}/${contentId}/unlike`, {})
      .pipe(
        catchError(error => {
          console.error(`Error unliking content ${contentId}:`, error);
          throw error;
        })
      );
  }

  /**
   * Get IDs of content items liked by the current user
   * @returns Observable of string array containing content IDs
   */
  getUserLikes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/user/likes`)
      .pipe(
        catchError(error => {
          console.error('Error fetching user likes:', error);
          return of([]);
        })
      );
  }

  /**
   * Get ratings given by the current user
   * @returns Observable of array containing rating information
   */
  getUserRatings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/ratings`)
      .pipe(
        catchError(error => {
          console.error('Error fetching user ratings:', error);
          return of([]);
        })
      );
  }

  /**
   * Publish a content item (admin or master admin)
   * @param id Content ID to publish
   * @returns Observable of the published Content
   */
  publishContent(id: string): Observable<Content> {
    return this.http.put<Content>(`${this.apiUrl}/${id}/publish`, {})
      .pipe(
        catchError(error => {
          console.error(`Error publishing content ${id}:`, error);
          throw error;
        })
      );
  }

  /**
   * Unpublish a content item (admin or master admin)
   * @param id Content ID to unpublish
   * @returns Observable of the unpublished Content
   */
  unpublishContent(id: string): Observable<Content> {
    return this.http.put<Content>(`${this.apiUrl}/${id}/unpublish`, {})
      .pipe(
        catchError(error => {
          console.error(`Error unpublishing content ${id}:`, error);
          throw error;
        })
      );
  }

  /**
   * Approve a content item (admin or master admin)
   * @param id Content ID to approve
   * @returns Observable of the approved Content
   */
  approveContent(id: string): Observable<Content> {
    return this.http.put<Content>(`${this.apiUrl}/${id}/approve`, {})
      .pipe(
        catchError(error => {
          console.error(`Error approving content ${id}:`, error);
          throw error;
        })
      );
  }
}
