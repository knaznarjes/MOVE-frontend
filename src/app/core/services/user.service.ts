/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { User, Preference } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin`)
      .pipe(catchError(error => this.handleError(error)));
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`)
      .pipe(catchError(error => this.handleError(error)));
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}`, user)
      .pipe(catchError(error => this.handleError(error)));
  }

  updateUser(id: string, user: User): Observable<User> {
    // Create a DTO object that matches what the backend expects
    const userDTO = {
      fullName: user.fullName,
      email: user.email, // Use the email directly from the User object
      photoProfile: user.photoProfile,
      preferences: user.preferences ? user.preferences.map(pref => ({
        id: pref.id,
        userId: pref.userId,
        category: pref.category,
        priority: pref.priority.toString()
      })) : []
    };

    return this.http.put<User>(`${this.apiUrl}/${id}`, userDTO)
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  uploadProfilePhoto(userId: string, file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);

    // Log details to help debug
    console.log('Uploading photo for user:', userId);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    const url = `${this.apiUrl}/${userId}/uploadPhoto`;
    console.log('Upload URL:', url);

    return this.http.post<any>(
      url,
      formData,
      {
        reportProgress: true,
        observe: 'events',
      }
    ).pipe(
      map((event) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            // Calculate and return upload progress
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            console.log(`Upload progress: ${progress}%`);
            return { status: 'progress', progress };

          case HttpEventType.Response:
            // Return the final response
            console.log('Upload complete, server response:', event.body);
            return { status: 'complete', data: event.body };

          default:
            // Other event types
            return { status: 'event', type: event.type };
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  updateUserRole(userId: string, role: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}/role`, { role })
      .pipe(catchError(error => this.handleError(error)));
  }

  updatePassword(userId: string, password: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${userId}/password`, { password })
      .pipe(catchError(error => this.handleError(error)));
  }

  updateUserPreferences(userId: string, preferences: Preference[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${userId}/preferences`, preferences)
      .pipe(catchError(error => this.handleError(error)));
  }

  searchUsers(name?: string, email?: string, role?: string): Observable<User[]> {
    let params = new HttpParams();

    if (name) {
      params = params.set('name', name);
    }

    if (email) {
      params = params.set('email', email);
    }

    if (role) {
      params = params.set('role', role);
    }

    return this.http.get<User[]>(`${this.apiUrl}/search`, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  isCurrentUserAdmin(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/isAdmin`)
      .pipe(catchError(error => this.handleError(error)));
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
