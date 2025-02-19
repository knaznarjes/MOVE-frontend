import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Preference } from '../models/preference.model';

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {
  private apiUrl = 'http://localhost:8080/api/preferences';

  constructor(private http: HttpClient) { }

  getUserPreferences(userId: string): Observable<Preference[]> {
    return this.http.get<Preference[]>(`${this.apiUrl}?userId=${userId}`);
  }

  addPreference(preference: Preference): Observable<Preference> {
    return this.http.post<Preference>(this.apiUrl, preference);
  }

  updatePreference(id: string, preference: Preference): Observable<Preference> {
    return this.http.put<Preference>(`${this.apiUrl}/${id}`, preference);
  }

  deletePreference(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteUserPreferences(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/${userId}`);
  }
}
