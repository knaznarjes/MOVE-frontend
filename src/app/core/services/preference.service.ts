import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { Preference } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {
  private apiUrl = `${environment.apiUrl}/api/preferences`;

  constructor(private http: HttpClient) { }

  getUserPreferences(userId: string): Observable<Preference[]> {
    return this.http.get<Preference[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getPreferenceById(id: string): Observable<Preference> {
    return this.http.get<Preference>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getUserPreferenceByCategory(userId: string, category: string): Observable<Preference> {
    return this.http.get<Preference>(`${this.apiUrl}/user/${userId}/category/${category}`)
      .pipe(catchError(this.handleError));
  }

  createPreference(preference: Preference): Observable<Preference> {
    return this.http.post<Preference>(this.apiUrl, preference)
      .pipe(catchError(this.handleError));
  }

  updatePreference(id: string, preference: Preference): Observable<Preference> {
    return this.http.put<Preference>(`${this.apiUrl}/${id}`, preference)
      .pipe(catchError(this.handleError));
  }

  deletePreference(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  deleteUserPreferences(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/${userId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
