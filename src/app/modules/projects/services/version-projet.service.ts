import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from './../../../../environments/environment';
import { VersionProjet } from 'app/modules/projects/projet.model';

@Injectable({
  providedIn: 'root'
})
export class VersionProjetService {
  private apiUrl = `${environment.apiUrl}/versions`;

  constructor(private http: HttpClient) { }

  getAllVersions(): Observable<VersionProjet[]> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<VersionProjet[]>(this.apiUrl, { headers }).pipe(
      catchError(this.handleError<VersionProjet[]>('getAllVersions', []))
    );
  }

  getVersionById(id: string): Observable<VersionProjet> {
    const url = `${this.apiUrl}/${id}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<VersionProjet>(url, { headers }).pipe(
      catchError(this.handleError<VersionProjet>(`getVersionById id=${id}`))
    );
  }

  createVersion(version: VersionProjet): Observable<VersionProjet> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<VersionProjet>(this.apiUrl, version, { headers }).pipe(
      catchError(this.handleError<VersionProjet>('createVersion'))
    );
  }

  updateVersion(id: string, version: VersionProjet): Observable<VersionProjet> {
    const url = `${this.apiUrl}/${id}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put<VersionProjet>(url, version, { headers }).pipe(
      catchError(this.handleError<VersionProjet>('updateVersion'))
    );
  }

  deleteVersion(id: string): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete<void>(url, { headers }).pipe(
      catchError(this.handleError<void>('deleteVersion'))
    );
  }

  getTachesByVersionId(id: string): Observable<string[]> {
    const url = `${this.apiUrl}/${id}/taches`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<string[]>(url, { headers }).pipe(
      catchError(this.handleError<string[]>(`getTachesByVersionId id=${id}`, []))
    );
  }

  // le projet associé à une version
  getProjetByVersionId(id: string): Observable<string> {
    const url = `${this.apiUrl}/${id}/projet`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<string>(url, { headers }).pipe(
      catchError(this.handleError<string>(`getProjetByVersionId id=${id}`))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
