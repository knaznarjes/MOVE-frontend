/* eslint-disable jsdoc/newline-after-description */
/* eslint-disable arrow-parens */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from 'environments/environment';
import { AdvancedSearchParams, ContentIndex, SearchResult } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = `${environment.apiUrl}/api/search`;
  private syncUrl = `${environment.apiUrl}/api/sync`;

  constructor(private http: HttpClient) {}

  /**
   * Perform an advanced search with the given parameters
   * @param params Search parameters including keyword, budget range, rating, etc.
   * @returns Observable of search result containing ContentIndex items
   */
  advancedSearch(params: AdvancedSearchParams): Observable<SearchResult<ContentIndex>> {
    let httpParams = new HttpParams();

    // Only add parameters that have values
    Object.keys(params).forEach((key) => {
      const value = (params as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<SearchResult<ContentIndex>>(`${this.apiUrl}/advanced`, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Error performing advanced search:', error);
          // Return empty search result on error with all required properties
          return of({
            content: [],
            pageNumber: 0,
            pageSize: 0,
            totalElements: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          });
        })
      );
  }

  /**
   * Get contents created by the current authenticated user
   * @returns Observable of search result containing user's ContentIndex items
   */
  getMyContents(page = 0, size = 10): Observable<SearchResult<ContentIndex>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<SearchResult<ContentIndex>>(`${this.apiUrl}/my-content`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching my content:', error);
          return of({
            content: [],
            pageNumber: 0,
            pageSize: 0,
            totalElements: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          });
        })
      );
  }

  /**
   * Get contents created by a specific user
   * @param userId The ID of the user whose contents to fetch
   * @param page Page number (zero-based)
   * @param size Number of items per page
   * @returns Observable of search result containing user's ContentIndex items
   */
  getUserContents(userId: string, page = 0, size = 10): Observable<SearchResult<ContentIndex>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<SearchResult<ContentIndex>>(`${this.apiUrl}/user/${userId}`, { params })
      .pipe(
        catchError(error => {
          console.error(`Error fetching user ${userId} content:`, error);
          return of({
            content: [],
            pageNumber: 0,
            pageSize: 0,
            totalElements: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          });
        })
      );
  }

  /**
   * Search for content accessible to all users (published content only)
   * @param keyword Search term
   * @param page Page number (zero-based)
   * @param size Number of items per page
   * @returns Observable of search result containing ContentIndex items
   */
  publicKeywordSearch(keyword: string, page = 0, size = 10): Observable<SearchResult<ContentIndex>> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<SearchResult<ContentIndex>>(`${this.apiUrl}/public/keyword`, { params })
      .pipe(
        catchError(error => {
          console.error('Error performing public keyword search:', error);
          return of({
            content: [],
            pageNumber: 0,
            pageSize: 0,
            totalElements: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          });
        })
      );
  }

  /**
   * Search for content accessible to the authenticated user
   * @param keyword Search term
   * @param page Page number (zero-based)
   * @param size Number of items per page
   * @returns Observable of search result containing ContentIndex items
   */
  keywordSearch(keyword: string, page = 0, size = 10): Observable<SearchResult<ContentIndex>> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<SearchResult<ContentIndex>>(`${this.apiUrl}/keyword`, { params })
      .pipe(
        catchError(error => {
          console.error('Error performing keyword search:', error);
          return of({
            content: [],
            pageNumber: 0,
            pageSize: 0,
            totalElements: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          });
        })
      );
  }

  /**
   * Synchronize a specific content to Elasticsearch
   * @param contentId ID of the content to synchronize
   * @returns Observable that completes when synchronization is done
   */
  syncContentToElasticsearch(contentId: string): Observable<string> {
    // FIX: Changed from this.apiUrl to this.syncUrl
    return this.http.post<string>(`${this.syncUrl}/${contentId}`, {})
      .pipe(
        catchError(error => {
          console.error(`Error synchronizing content ID ${contentId} to Elasticsearch:`, error);
          throw error;
        })
      );
  }

  /**
   * Trigger a full synchronization of all content to Elasticsearch
   * This method calls the sync endpoint from SyncController
   * @returns Observable with confirmation message
   */
  triggerFullSync(): Observable<string> {
    return this.http.get<string>(`${this.syncUrl}`)
      .pipe(
        catchError(error => {
          console.error('Error triggering full content synchronization:', error);
          throw error;
        })
      );
  }
/**
 * Get search suggestions based on a prefix
 * @param prefix The prefix to get suggestions for
 * @returns Observable of string array containing suggestions
 */
getSuggestions(prefix: string): Observable<string[]> {
  if (!prefix || prefix.trim().length === 0) {
    return of([]);
  }

  const params = new HttpParams().set('prefix', prefix.trim());

  return this.http.get<string[]>(`${this.apiUrl}/suggest`, { params })
    .pipe(
      map(response => {
        console.log('Raw suggestion response:', response);
        return response || [];
      }),
      catchError(error => {
        console.error('Error fetching search suggestions:', error);
        return of([]);
      })
    );
}
  /**
   * Find similar content based on a content ID
   * @param contentId The ID of the content to find similar items for
   * @param page Page number (zero-based)
   * @param size Number of items per page
   * @returns Observable of search result containing similar ContentIndex items
   */
  getSimilarContent(contentId: string, page = 0, size = 10): Observable<SearchResult<ContentIndex>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<SearchResult<ContentIndex>>(`${this.apiUrl}/similar/${contentId}`, { params })
      .pipe(
        catchError(error => {
          console.error(`Error fetching similar content for ${contentId}:`, error);
          return of({
            content: [],
            pageNumber: 0,
            pageSize: 0,
            totalElements: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          });
        })
      );
  }

  /**
   * Get trending content based on popularity and recency
   * @param page Page number (zero-based)
   * @param size Number of items per page
   * @returns Observable of search result containing trending ContentIndex items
   */
  getTrendingContent(page = 0, size = 10): Observable<SearchResult<ContentIndex>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<SearchResult<ContentIndex>>(`${this.apiUrl}/trending`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching trending content:', error);
          return of({
            content: [],
            pageNumber: 0,
            pageSize: 0,
            totalElements: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          });
        })
      );
  }

  /**
   * Search for content near a geographic location
   * @param latitude Latitude coordinate
   * @param longitude Longitude coordinate
   * @param distanceKm Distance in kilometers (default: 10)
   * @param keyword Optional keyword to filter results
   * @param isPublished Optional filter for published content
   * @param page Page number (zero-based)
   * @param size Number of items per page
   * @returns Observable of search result containing ContentIndex items
   */
  searchByLocation(latitude: number, longitude: number, distanceKm = 10,
                  keyword?: string, isPublished?: boolean,
                  page = 0, size = 10): Observable<SearchResult<ContentIndex>> {

    let params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('distanceKm', distanceKm.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    if (keyword !== undefined && keyword !== null) {
      params = params.set('keyword', keyword);
    }

    if (isPublished !== undefined && isPublished !== null) {
      params = params.set('isPublished', isPublished.toString());
    }

    return this.http.get<SearchResult<ContentIndex>>(`${this.apiUrl}/location`, { params })
      .pipe(
        catchError(error => {
          console.error('Error performing location-based search:', error);
          return of({
            content: [],
            pageNumber: 0,
            pageSize: 0,
            totalElements: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          });
        })
      );
  }

}
