import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Preference } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {
  private apiUrl = `${environment.apiUrl}/api/preferences`;

  constructor(private http: HttpClient) { }

  getUserPreferences(userId: string): Observable<Preference[]> {
    return this.http.get<Preference[]>(`${this.apiUrl}/user/${userId}`)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Erreur lors de la récupération des préférences')))
      );
  }

  getPreferenceById(id: string): Observable<Preference> {
    return this.http.get<Preference>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Préférence non trouvée')))
      );
  }

  createPreference(preference: Preference): Observable<Preference> {
    return this.http.post<Preference>(this.apiUrl, preference)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Erreur lors de la création de la préférence')))
      );
  }

  updatePreference(id: string, preference: Preference): Observable<Preference> {
    return this.http.put<Preference>(`${this.apiUrl}/${id}`, preference)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Erreur lors de la mise à jour de la préférence')))
      );
  }

  deletePreference(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Erreur lors de la suppression de la préférence')))
      );
  }

  deleteUserPreferences(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/${userId}`)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Erreur lors de la suppression des préférences')))
      );
  }
}
