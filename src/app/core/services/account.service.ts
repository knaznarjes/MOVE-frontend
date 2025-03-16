import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/api/accounts`;

  constructor(private http: HttpClient) {}


  getAccountById(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/${id}`);
  }


  getAccountByEmail(email: string): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/email/${email}`);
  }

  getAllAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl);
  }


  updatePassword(id: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/password`, newPassword);
  }


  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


  canAccessAccount(accountId: string, currentUserId: string, currentUserRole: string): boolean {
    return currentUserRole === 'ADMIN' || currentUserId === accountId;
  }
}
