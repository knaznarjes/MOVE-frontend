import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { Account } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/api/accounts`;

  constructor(private http: HttpClient) { }

  createAccount(email: string, password: string): Observable<Account> {
    const payload = { email, password };
    return this.http.post<Account>(this.apiUrl, payload)
      .pipe(catchError(this.handleError));
  }

  getAccountById(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getAccountByEmail(email: string): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/email/${email}`)
      .pipe(catchError(this.handleError));
  }

  getAllAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  updateAccount(id: string, updatedAccount: Account): Observable<Account> {
    return this.http.put<Account>(`${this.apiUrl}/${id}`, updatedAccount)
      .pipe(catchError(this.handleError));
  }

  updatePassword(id: string, currentPassword: string, newPassword: string): Observable<string> {
    const payload = { currentPassword, newPassword };
    return this.http.put(`${this.apiUrl}/${id}/password`, payload, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client : ${error.error.message}`;
    } else {
      errorMessage = `Erreur serveur [${error.status}] : ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
