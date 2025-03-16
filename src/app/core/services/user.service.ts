import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) { }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Erreur lors de la récupération du profil')))
      );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Utilisateur non trouvé')))
      );
  }

  updateUser(id: string, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Erreur lors de la mise à jour du profil')))
      );
  }

  updateProfilePhoto(id: string, photoFile: File): Observable<User> {
    const formData = new FormData();
    formData.append('photo', photoFile);

    return this.http.put<User>(`${this.apiUrl}/${id}/photo`, formData)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Erreur lors du téléchargement de la photo')))
      );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => throwError(() => new Error(error.error?.message || 'Erreur lors de la suppression du compte')))
      );
  }
}
