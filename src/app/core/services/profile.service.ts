import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  // User Profile Methods
  getProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profiles/${userId}`);
  }

  updateProfile(userId: string, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profiles/${userId}`, user);  // Fixed missing parenthesis
  }

  changePassword(userId: string, oldPassword: string, newPassword: string): Observable<void> {
    const params = { oldPassword, newPassword };
    return this.http.put<void>(`${this.apiUrl}/profiles/${userId}/password`, null, { params });
  }

  // Admin Methods
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/users/${userId}`);
  }

  updateUserRole(userId: string, newRole: string): Observable<User> {
    const params = { newRole };
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/role`, null, { params });
  }

  getAdminDashboardMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/dashboard`);
  }
}
