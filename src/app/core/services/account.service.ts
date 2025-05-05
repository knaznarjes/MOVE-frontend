/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AccountDTO } from '../models/models';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/api/accounts`;

  constructor(private http: HttpClient) { }

  // Créer un nouveau compte
  createAccount(email: string, password: string): Observable<AccountDTO> {
    const credentials = { email, password };
    return this.http.post<AccountDTO>(this.apiUrl, credentials)
      .pipe(catchError(this.handleError));
  }

  // Récupérer tous les comptes (ADMIN ou MASTERADMIN)
  getAllAccounts(): Observable<AccountDTO[]> {
    return this.http.get<AccountDTO[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  // Récupérer un compte par ID
  getAccountById(id: string): Observable<AccountDTO> {
    return this.http.get<AccountDTO>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Récupérer un compte par email
  getAccountByEmail(email: string): Observable<AccountDTO> {
    return this.http.get<AccountDTO>(`${this.apiUrl}/email/${email}`)
      .pipe(catchError(this.handleError));
  }

  // Mettre à jour l'adresse email d'un compte
  updateAccount(id: string, accountDTO: AccountDTO): Observable<AccountDTO> {
    return this.http.put<AccountDTO>(`${this.apiUrl}/${id}`, accountDTO)
      .pipe(catchError(this.handleError));
  }
  updatePassword(id: string, newPassword: string): Observable<void> {
    // Send as a JSON object with a password property
    return this.http.put<void>(
      `${this.apiUrl}/${id}/password`,
      { password: newPassword }, // Structured as a JSON object
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }
    ).pipe(
      tap(response => console.log('Password update successful', response)),
      catchError(this.handleError)
    );
  }
  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Supprimer un compte par email
  deleteAccountByEmail(email: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/email/${email}`)
      .pipe(catchError(this.handleError));
  }

  // Gestion des erreurs
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client : ${error.error.message}`;
    } else {
      errorMessage = `Erreur serveur : ${error.status}`;
      if (error.error && typeof error.error === 'string') {
        errorMessage += ` - ${error.error}`;
      } else if (error.message) {
        errorMessage += ` - ${error.message}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
