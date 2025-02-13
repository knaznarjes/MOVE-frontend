import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, first } from 'rxjs/operators';
import { environment } from './../../../../environments/environment';
import { Projet, VersionProjet, Personnel, Tache } from 'app/modules/projects/projet.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projets`;

  constructor(private http: HttpClient) { }

  getAllProjets(): Observable<Projet[]> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<Projet[]>(this.apiUrl, { headers }).pipe(
      catchError(this.handleError<Projet[]>('getAllProjets', []))
    );
  }

  getProjetById(id: string): Observable<Projet> {
    const url = `${this.apiUrl}/${id}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<Projet>(url, { headers }).pipe(
      catchError(this.handleError<Projet>(`getProjetById id=${id}`))
    );
  }

  createProjet(projet: Projet): Observable<Projet> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<Projet>(this.apiUrl, projet, { headers }).pipe(
      catchError(this.handleError<Projet>('createProjet'))
    );
  }

  updateProjet(id: string, projet: Projet): Observable<Projet> {
    const url = `${this.apiUrl}/${id}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put<Projet>(url, projet, { headers }).pipe(
      catchError(this.handleError<Projet>('updateProjet'))
    );
  }

  deleteProjet(id: string): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete<void>(url, { headers }).pipe(
      catchError(this.handleError<void>('deleteProjet'))
    );
  }

  getPersonnelsByProjetId(id: string): Observable<Personnel[]> {
    const url = `${this.apiUrl}/${id}/personnels`;
    return this.http.get<Personnel[]>(url).pipe(
      catchError(this.handleError<Personnel[]>(`getPersonnelsByProjetId id=${id}`, []))
    );
  }

  getVersionsByProjetId(id: string): Observable<VersionProjet[]> {
    const url = `${this.apiUrl}/${id}/versions`;
    return this.http.get<VersionProjet[]>(url).pipe(
      first(),
      catchError(this.handleError<VersionProjet[]>('getVersionsByProjetId', []))
    );
  }

  getVersionById(versionId: string): Observable<VersionProjet> {
    const url = `${this.apiUrl}/versions/${versionId}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<VersionProjet>(url, { headers }).pipe(
      catchError(this.handleError<VersionProjet>(`getVersionById id=${versionId}`))
    );
  }

  addVersionToProjet(projetId: string, versionId: string): Observable<Projet> {
    const url = `${this.apiUrl}/${projetId}/versions/${versionId}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<Projet>(url, {}, { headers }).pipe(
      catchError(this.handleError<Projet>('addVersionToProjet'))
    );
  }

  createVersionForProjet(projetId: string, versionProjet: VersionProjet): Observable<VersionProjet> {
    const url = `${this.apiUrl}/${projetId}/versions`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<VersionProjet>(url, versionProjet, { headers }).pipe(
      catchError(this.handleError<VersionProjet>('createVersionForProjet'))
    );
  }

  createTaskForVersionForProjet(projetId: string, versionId: string, task: Tache): Observable<Tache> {
    const url = `${this.apiUrl}/${projetId}/versions/${versionId}/taches`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<Tache>(url, task, { headers }).pipe(
      catchError(this.handleError<Tache>('createTaskForVersionForProjet'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
