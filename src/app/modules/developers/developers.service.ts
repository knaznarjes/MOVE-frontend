import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Personnel } from './developers.model';

@Injectable({
  providedIn: 'root'
})
export class PersonnelService {
  private apiUrl = `${environment.apiUrl}/personnels`;

  constructor(private http: HttpClient) { }

  getAllPersonnel(query: string = ''): Observable<Personnel[]> {
    const url = query ? `${this.apiUrl}?search=${query}` : this.apiUrl;
    return this.http.get<Personnel[]>(url).pipe(
      catchError(this.handleError<Personnel[]>('getAllPersonnel', []))
    );
  }

  getPersonnelById(id: string): Observable<Personnel> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Personnel>(url).pipe(
      catchError(this.handleError<Personnel>('getPersonnelById'))
    );
  }

  createPersonnel(personnel: Personnel): Observable<Personnel> {
    return this.http.post<Personnel>(this.apiUrl, personnel).pipe(
      catchError(this.handleError<Personnel>('createPersonnel'))
    );
  }


  updatePersonnel(personnel: Personnel): Observable<Personnel> {
    const url = `${this.apiUrl}/${personnel.id}`;
    return this.http.put<Personnel>(url, personnel).pipe(
      catchError(this.handleError<Personnel>('updatePersonnel'))
    );
  }

  deletePersonnel(id: string): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      catchError(this.handleError<void>('deletePersonnel'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
