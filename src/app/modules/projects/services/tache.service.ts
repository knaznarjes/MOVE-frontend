import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs'; // Ajoutez throwError ici
import { catchError } from 'rxjs/operators';
import { environment } from './../../../../environments/environment';
import { Tache } from 'app/modules/projects/projet.model';

@Injectable({
  providedIn: 'root'
})
export class TacheService {
  private apiUrl = `${environment.apiUrl}/taches`;

  constructor(private http: HttpClient) { }

  getAllTaches(): Observable<Tache[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<Tache[]>(this.apiUrl, { headers }).pipe(
      catchError(this.handleError<Tache[]>('getAllTaches', []))
    );
  }

  getTacheById(id: string): Observable<Tache> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.createAuthHeaders();
    return this.http.get<Tache>(url, { headers }).pipe(
      catchError(this.handleError<Tache>(`getTacheById id=${id}`))
    );
  }

  createTache(tache: Tache): Observable<Tache> {
    const headers = this.createAuthHeaders();
    return this.http.post<Tache>(this.apiUrl, tache, { headers }).pipe(
      catchError(this.handleError<Tache>('createTache'))
    );
  }

  updateTache(tache: Tache): Observable<Tache> {
    const url = `${this.apiUrl}/${tache.id}`;
    const headers = this.createAuthHeaders();
    return this.http.put<Tache>(url, tache, { headers }).pipe(
      catchError(this.handleError<Tache>('updateTache'))
    );
  }

  deleteTache(id: string): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.createAuthHeaders();
    return this.http.delete<void>(url, { headers }).pipe(
      catchError(this.handleError<void>('deleteTache'))
    );
  }

  addTaskToVersion(versionId: string, tache: Tache): Observable<Tache> {
    const url = `${this.apiUrl}/addToVersion/${versionId}`;
    const headers = this.createAuthHeaders();
    return this.http.post<Tache>(url, tache, { headers }).pipe(
      catchError(this.handleError<Tache>('addTaskToVersion'))
    );
  }

  getTachesByVersionId(versionId: string): Observable<Tache[]> {
    const url = `${this.apiUrl}/version/${versionId}`;
    const headers = this.createAuthHeaders();
    return this.http.get<Tache[]>(url, { headers }).pipe(
      catchError(this.handleError<Tache[]>('getTachesByVersionId', []))
    );
  }

  createTacheInVersion(versionId: string, projetId: string, tache: Tache): Observable<Tache> {
    if (!versionId || !projetId) {
      console.error('Version ID or Project ID is undefined');
      return throwError(() => new Error('Version ID or Project ID is undefined'));
    }

    const url = `${this.apiUrl}/createInVersion/${versionId}/${projetId}`;
    console.log('Request URL:', url); // Debugging line
    const headers = this.createAuthHeaders();
    return this.http.post<Tache>(url, tache, { headers }).pipe(
      catchError(this.handleError<Tache>('createTacheInVersion'))
    );
  }
  deleteTacheFromVersion(versionId: string, tacheId: string): Observable<void> {
    const url = `${this.apiUrl}/version/${versionId}/tache/${tacheId}`;
    const headers = this.createAuthHeaders();
    return this.http.delete<void>(url, { headers }).pipe(
      catchError(this.handleError<void>('deleteTacheFromVersion'))
    );
  }



  private createAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
