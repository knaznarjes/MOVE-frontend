/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable arrow-parens */
/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { Account, User, Preference } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private accountsApiUrl = `${environment.apiUrl}/api/accounts`;
  private usersApiUrl = `${environment.apiUrl}/api/users`;
  private preferencesApiUrl = `${environment.apiUrl}/api/preferences`;

  constructor(private http: HttpClient) { }

  updateUserProfile(id: string, userData: {
    fullName?: string;
    email?: string;
    photoProfile?: string;
    preferences?: Preference[];
  }): Observable<User> {
    return this.http.put<User>(`${this.usersApiUrl}/${id}`, userData)
      .pipe(catchError((error) => this.handleError(error)));
  }

  uploadProfilePhoto(userId: string, file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<User>(`${this.usersApiUrl}/${userId}/uploadPhoto`, formData)
      .pipe(catchError((error) => this.handleError(error)));
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.usersApiUrl}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.usersApiUrl}/me`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  getAccountById(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.accountsApiUrl}/${id}`)
      .pipe(
        catchError((error) => {
          console.error(`Error fetching account with ID ${id}:`, error);
          return throwError(() => new Error(`Account with ID ${id} not found`));
        })
      );
  }

  // Get account by email
  getAccountByEmail(email: string): Observable<Account> {
    return this.http.get<Account>(`${this.accountsApiUrl}/email/${email}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  updatePassword(id: string, currentPassword: string, newPassword: string): Observable<string> {
    const payload = {
      currentPassword,
      newPassword
    };

    return this.http.put(`${this.accountsApiUrl}/${id}/password`, payload, {
      responseType: 'text'  // Ceci est crucial pour éviter l'erreur de parsing
    }).pipe(
      catchError(error => {
        console.error('Password update error:', error);
        return throwError(() => error);
      })
    );
  }
  // Delete an account but preserve the user profile
  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.accountsApiUrl}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // Delete account by email but preserve the user profile
  deleteAccountByEmail(email: string): Observable<void> {
    return this.http.delete<void>(`${this.accountsApiUrl}/email/${email}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // Delete a user profile
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.usersApiUrl}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // Get user preferences
  getUserPreferences(userId: string): Observable<Preference[]> {
    return this.http.get<Preference[]>(`${this.preferencesApiUrl}/user/${userId}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // Create a new preference
  createPreference(userId: string, preference: { category: string; priority: string }): Observable<Preference> {
    const preferenceData = { ...preference, userId };
    return this.http.post<Preference>(`${this.preferencesApiUrl}`, preferenceData)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // Delete a preference
  deletePreference(id: string): Observable<void> {
    return this.http.delete<void>(`${this.preferencesApiUrl}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // Error handler for HTTP requests
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      // Add more specific error messages based on status codes
      if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized access';
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden';
      } else if (error.status === 400) {
        errorMessage = 'Bad request. Please check the data sent.';
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
