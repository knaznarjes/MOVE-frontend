import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) { }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`)
      .pipe(catchError(this.handleError));
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  updateUser(id: string, user: User): Observable<User> {
    // Create a DTO object that matches what the backend expects based on your models
    const userDTO = {
      fullName: user.fullName,
      email: user.email,
      photoProfile: user.photoProfile,
      preferences: user.preferences ? user.preferences.map(pref => ({
        id: pref.id,
        userId: pref.userId,
        category: pref.category,
        priority: pref.priority
      })) : []
    };

    return this.http.put<User>(`${this.apiUrl}/${id}`, userDTO)
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Method for uploading profile photo with progress tracking
  uploadProfilePhoto(userId: string, file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(
      `${this.apiUrl}/${userId}/uploadPhoto`,
      formData,
      { reportProgress: true, observe: 'events' }
    ).pipe(
      map((event) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            // Calculate and return upload progress
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            return { status: 'progress', progress };

          case HttpEventType.Response:
            // Return the final response
            return { status: 'complete', data: event.body };

          default:
            // Other event types
            return { status: 'event', type: event.type };
        }
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

      // Add more detail if available
      if (error.error) {
        try {
          const serverError = typeof error.error === 'string' ? JSON.parse(error.error) : error.error;
          if (serverError.message) {
            errorMessage += `\nDetails: ${serverError.message}`;
          }
        } catch (e) {
          console.error('Could not parse error response', e);
        }
      }
    }

    console.error('API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
