import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
      .pipe(catchError(this.handleError));
  }

  uploadProfilePhoto(userId: string, file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<User>(`${this.usersApiUrl}/${userId}/uploadPhoto`, formData)
      .pipe(catchError(this.handleError));
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.usersApiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.usersApiUrl}/me`)
      .pipe(catchError(this.handleError));
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
      .pipe(catchError(this.handleError));
  }

  // Update account's password
  updatePassword(id: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.accountsApiUrl}/${id}/password`, newPassword)
      .pipe(catchError(this.handleError));
  }

  // Delete an account but preserve the user profile
  deleteAccount(id: string): Observable<void> {
    // Cette méthode supprime seulement le compte mais préserve l'utilisateur associé
    return this.http.delete<void>(`${this.accountsApiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Delete account by email but preserve the user profile
  deleteAccountByEmail(email: string): Observable<void> {
    // Cette méthode supprime seulement le compte mais préserve l'utilisateur associé
    return this.http.delete<void>(`${this.accountsApiUrl}/email/${email}`)
      .pipe(catchError(this.handleError));
  }

  // Delete a user profile
  deleteUser(id: string): Observable<void> {
    // Cette méthode supprime uniquement l'utilisateur
    return this.http.delete<void>(`${this.usersApiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Get user preferences
  getUserPreferences(userId: string): Observable<Preference[]> {
    return this.http.get<Preference[]>(`${this.preferencesApiUrl}/user/${userId}`)
      .pipe(catchError(this.handleError));
  }

  // Create a new preference
  createPreference(userId: string, preference: { category: string; priority: string }): Observable<Preference> {
    const preferenceData = { ...preference, userId };
    return this.http.post<Preference>(`${this.preferencesApiUrl}`, preferenceData)
      .pipe(catchError(this.handleError));
  }

  // Delete a preference
  deletePreference(id: string): Observable<void> {
    return this.http.delete<void>(`${this.preferencesApiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Error handler for HTTP requests
  private handleError(error: any): Observable<never> {
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
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
