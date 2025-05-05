import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PreferenceDTO } from '../models/models';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {
  private apiUrl = `${environment.apiUrl}/api/preferences`;

  constructor(private http: HttpClient) { }

  /**
   * Get preferences for the current authenticated user
   * Uses the base endpoint which extracts user from token
   */
  getCurrentUserPreferences(): Observable<PreferenceDTO[]> {
    return this.http.get<PreferenceDTO[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get preference by ID
   * Note: This endpoint is secured with @PreAuthorize and will check ownership
   */
  getPreferenceById(id: string): Observable<PreferenceDTO> {
    return this.http.get<PreferenceDTO>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get user preference by category
   * Only works if you are the user or have ADMIN permissions
   */
  getUserPreferenceByCategory(userId: string, category: string): Observable<PreferenceDTO> {
    return this.http.get<PreferenceDTO>(`${this.apiUrl}/user/${userId}/category/${category}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create preference for the current authenticated user
   * Backend will set userId from authentication
   */
  createPreference(preference: PreferenceDTO): Observable<PreferenceDTO> {
    // Remove userId if it's set to avoid conflicts with backend authentication
    const payload = { ...preference };
    delete payload.userId;

    return this.http.post<PreferenceDTO>(this.apiUrl, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update preference by ID
   * Note: Backend will validate ownership before allowing update
   */
  updatePreference(id: string, preference: PreferenceDTO): Observable<PreferenceDTO> {
    // Remove userId if it's set to avoid conflicts with backend validation
    const payload = { ...preference };
    delete payload.userId;

    return this.http.put<PreferenceDTO>(`${this.apiUrl}/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update multiple preferences in a batch
   * Useful for saving all preferences at once
   */
  updatePreferences(preferences: PreferenceDTO[]): Observable<PreferenceDTO[]> {
    return this.http.put<PreferenceDTO[]>(`${this.apiUrl}/batch`, preferences)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete preference by ID
   * Note: Backend will validate ownership before allowing deletion
   */
  deletePreference(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete all preferences for a user
   * Only works if you are the user or have ADMIN permissions
   */
  deleteUserPreferences(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/${userId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Generic error handler for http requests
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status}`;
      if (error.error && typeof error.error === 'string') {
        errorMessage += ` - ${error.error}`;
      } else if (error.message) {
        errorMessage += ` - ${error.message}`;
      }
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
