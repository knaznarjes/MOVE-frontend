/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable curly */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { UserDTO } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/api/users`;
  private adminUrl = `${environment.apiUrl}/api/users/admin`;

  private currentUserSubject = new BehaviorSubject<UserDTO | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  //  USER PART
  getCurrentUser(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.baseUrl}/me`).pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError(this.handleError)
    );
  }

  getUserById(id: string): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(id: string, userDTO: UserDTO): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.baseUrl}/${id}`, userDTO).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  uploadPhoto(id: string, file: File): Observable<UserDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserDTO>(`${this.baseUrl}/${id}/uploadPhoto`, formData).pipe(
      catchError(this.handleError)
    );
  }

  //  ADMIN PART

  /**
   * Gets all users - admin access required
   *
   * @returns Observable with array of all users
   */
  getAllUsers(): Observable<UserDTO[]> {
    // Make sure we're accessing the correct endpoint
    return this.http.get<UserDTO[]>(`${this.adminUrl}`).pipe(
      catchError(this.handleError)
    );
  }

  getAdminUserById(id: string): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.adminUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createUser(userPayload: any): Observable<UserDTO> {
    return this.http.post<UserDTO>(`${this.adminUrl}`, userPayload).pipe(
      catchError(this.handleError)
    );
  }

  updateUserByAdmin(id: string, userDTO: UserDTO): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.adminUrl}/${id}`, userDTO).pipe(
      catchError(this.handleError)
    );
  }

  deleteUserByAdmin(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Updates a user's role - This function can only be called by a MasterAdmin
   * and can only assign ADMIN or TRAVEL roles
   *
   * @param id The ID of the user to update
   * @param role The new role (must be 'ADMIN' or 'TRAVELER')
   * @returns Observable with updated user data
   */
  updateUserRole(id: string, role: string): Observable<UserDTO> {
    // Validate the role before sending the request
    if (role !== 'ADMIN' && role !== 'TRAVELER') {
      return throwError(() => new Error('Invalid role. Only ADMIN or TRAVELER roles are allowed.'));
    }

    return this.http.put<UserDTO>(`${this.adminUrl}/${id}/role`, { role }).pipe(
      catchError((error) => {
        // Special error handling for forbidden access (not a MasterAdmin)
        if (error.status === 403) {
          return throwError(() => new Error('Only MasterAdmin users can update roles.'));
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Checks if the current user has MasterAdmin role
   *
   * @returns boolean indicating if user is a MasterAdmin
   */
  isMasterAdmin(): boolean {
    const currentUser = this.currentUserSubject.getValue();
    return currentUser?.role === 'MasterAdmin';
  }

  /**
   * Checks if the current user has Admin role
   *
   * @returns boolean indicating if user is an Admin
   */
  isAdmin(): boolean {
    const currentUser = this.currentUserSubject.getValue();
    return currentUser?.role === 'ADMIN' || currentUser?.role === 'MasterAdmin';
  }

  uploadPhotoByAdmin(id: string, file: File): Observable<UserDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserDTO>(`${this.adminUrl}/${id}/uploadPhoto`, formData).pipe(
      catchError(this.handleError)
    );
  }

  searchUsers(name?: string, email?: string, role?: string): Observable<UserDTO[]> {
    let params = new HttpParams();
    if (name) params = params.set('name', name);
    if (email) params = params.set('email', email);
    if (role) params = params.set('role', role);

    return this.http.get<UserDTO[]>(`${this.adminUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Gets the list of available roles that can be assigned by the current user
   *
   * @returns Array of role strings the current user can assign
   */
  getAvailableRoles(): string[] {
    if (this.isMasterAdmin()) {
      return ['ADMIN', 'TRAVELER'];
    }
    return [];
  }

  // Error handler for HTTP requests
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      // Add more specific error messages based on status codes
      if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized access';
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden';
      } else if (error.status === 400) {
        errorMessage = 'Bad request. Please check the data sent.';
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
