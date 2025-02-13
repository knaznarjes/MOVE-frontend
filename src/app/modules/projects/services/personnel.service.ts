import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from './../../../../environments/environment';
import { Personnel } from 'app/modules/projects/projet.model';

@Injectable({
  providedIn: 'root'
})
export class PersonnelService {
  private apiUrl = `${environment.apiUrl}/personnels`;

  constructor(private http: HttpClient) { }

  getAllPersonnel(): Observable<Personnel[]> {

    return this.http.get<Personnel[]>(this.apiUrl).pipe(
      catchError(this.handleError<Personnel[]>('getAllPersonnel', []))
    );
  }

  getPersonnelById(id: string): Observable<Personnel> {
    const url = `${this.apiUrl}/${id}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<Personnel>(url, { headers }).pipe(
      catchError(this.handleError<Personnel>(`getPersonnelById id=${id}`))
    );
  }

  createPersonnel(personnel: Personnel): Observable<Personnel> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<Personnel>(this.apiUrl, personnel, { headers }).pipe(
      catchError(this.handleError<Personnel>('createPersonnel'))
    );
  }

  updatePersonnel(id: string, personnel: Personnel): Observable<Personnel> {
    const url = `${this.apiUrl}/${id}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put<Personnel>(url, personnel, { headers }).pipe(
      catchError(this.handleError<Personnel>('updatePersonnel'))
    );
  }

  deletePersonnel(id: string): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete<void>(url, { headers }).pipe(
      catchError(this.handleError<void>('deletePersonnel'))
    );
  }

  getPersonnelsByIds(ids: string[]): Observable<Personnel[]> {
    const url = `${this.apiUrl}/by-ids`;
    return this.http.post<Personnel[]>(url, { ids }).pipe(
      catchError(this.handleError<Personnel[]>('getPersonnelsByIds', []))
    );
  }


  getProjetsByPersonnelId(id: string): Observable<string[]> {
    const url = `${this.apiUrl}/${id}/projets`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<string[]>(url, { headers }).pipe(
      catchError(this.handleError<string[]>(`getProjetsByPersonnelId id=${id}`, []))
    );
  }

  //récupérer les tâches associées à un personnel
  getTachesByPersonnelId(id: string): Observable<string[]> {
    const url = `${this.apiUrl}/${id}/taches`;
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<string[]>(url, { headers }).pipe(
      catchError(this.handleError<string[]>(`getTachesByPersonnelId id=${id}`, []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
