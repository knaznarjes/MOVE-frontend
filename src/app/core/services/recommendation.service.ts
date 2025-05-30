/* eslint-disable jsdoc/check-alignment */
/* eslint-disable prefer-const */
/* eslint-disable jsdoc/newline-after-description */
/* eslint-disable arrow-parens */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from 'environments/environment';
import { Content, ContentItem } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = `${environment.apiUrl}/api/recommendation`;

  constructor(private http: HttpClient) {}

  /**
  * Get recommended contents similar to a specific content ID
  * @param contentId The ID of the content to base recommendations on
  * @param maxBudget Optional max budget to filter optimized recommendations
  * @returns Observable of recommended content items
  */
  getRecommendationsByContentId(contentId: string, maxBudget?: number): Observable<ContentItem[]> {
    let url = `${this.apiUrl}/${contentId}`;
    let params = new HttpParams();

    if (maxBudget !== undefined && maxBudget !== null) {
      params = params.set('maxBudget', maxBudget.toString());
    }

    return this.http.get<ContentItem[]>(url, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching recommendations for content ID ${contentId}:`, error);
        return of([]); // return empty array in case of error
      })
    );
  }
}
