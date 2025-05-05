/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable arrow-parens */
/* eslint-disable curly */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { Role, User, UserDTO, Preference, PreferenceDTO, AccountDTO } from '../models/models';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/api/users`;
  private adminUrl = `${environment.apiUrl}/api/users/admin`;

  private currentUserSubject = new BehaviorSubject<UserDTO | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private accountService: AccountService
  ) {
    // Subscribe to changes from AuthService to keep user data in sync
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // Récupérer l'email de l'utilisateur depuis le compte
        if (user.accountId) {
          this.accountService.getAccountById(user.accountId).subscribe(account => {
            const userDTO: UserDTO = {
              id: user.id,
              fullName: user.fullName,
              photoProfile: user.photoProfile,
              role: user.role,
              creationDate: user.creationDate,
              modifiedAt: user.modifiedAt,
              preferences: user.preferences,
              accountLocked: user.accountLocked,
              enabled: user.enabled,
              account: {
                id: user.accountId,
                email: account ? account.email : ''
              }
            };
            this.currentUserSubject.next(userDTO);
          });
        } else {
          // Cas où l'utilisateur n'a pas de compte associé
          const userDTO: UserDTO = {
            id: user.id,
            fullName: user.fullName,
            photoProfile: user.photoProfile,
            role: user.role,
            creationDate: user.creationDate,
            modifiedAt: user.modifiedAt,
            preferences: user.preferences,
            accountLocked: user.accountLocked,
            enabled: user.enabled
          };
          this.currentUserSubject.next(userDTO);
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  // USER PART
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

  // In UserService
updateUser(id: string, userDTO: UserDTO): Observable<UserDTO> {
    // Transformation du DTO pour correspondre à ce qu'attend le backend
    const backendUserData = {
      fullName: userDTO.fullName,
      email: userDTO.email || userDTO.account?.email, // Try both formats
      photoProfile: userDTO.photoProfile,
      preferences: userDTO.preferences?.map(pref => ({
        id: pref.id,
        userId: pref.userId || id, // S'assurer que l'userId est défini
        category: pref.category,
        priority: pref.priority
      }))
    };

    console.log('Sending to backend:', backendUserData);

    return this.http.put<UserDTO>(`${this.baseUrl}/${id}`, backendUserData).pipe(
      tap(updatedUser => {
        if (this.currentUserSubject.value?.id === id) {
          this.currentUserSubject.next(updatedUser);
        }
      }),
      catchError(this.handleError)
    );
  }
  deleteUser(id: string): Observable<void> {
    // On appelle directement la méthode de suppression d'utilisateur du backend
    // Le backend s'occupera de la logique de dissociation ou non du compte
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        if (this.currentUserSubject.value?.id === id) {
          this.currentUserSubject.next(null);
          this.authService.logout(); // Déconnexion si l'utilisateur courant est supprimé
        }
      }),
      catchError(this.handleError)
    );
  }

  uploadPhoto(id: string, file: File): Observable<UserDTO> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UserDTO>(`${this.baseUrl}/${id}/uploadPhoto`, formData).pipe(
      tap(updatedUser => {
        if (this.currentUserSubject.value?.id === id) {
          this.currentUserSubject.next(updatedUser);
        }
      }),
      catchError(this.handleError)
    );
  }

  // ADMIN PART
  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.adminUrl}`).pipe(
      catchError(this.handleError)
    );
  }

  createUser(userDTO: UserDTO): Observable<UserDTO> {
    // Transformer les données pour correspondre à l'attente du backend
    const backendData = {
      fullName: userDTO.fullName,
      email: userDTO.account?.email || userDTO.email, // Priorité à account.email si disponible
      role: userDTO.role,
      photoProfile: userDTO.photoProfile,
      preferences: userDTO.preferences?.map(pref => ({
        category: pref.category,
        priority: pref.priority
        // Pas besoin d'ID ou d'userId ici, ils seront générés par le backend
      }))
    };

    return this.http.post<UserDTO>(`${this.adminUrl}`, backendData).pipe(
      catchError(this.handleError)
    );
  }

  updateUserByAdmin(id: string, userDTO: UserDTO): Observable<UserDTO> {
    // Transformation pour correspondre à l'attente du backend
    const backendData = {
      fullName: userDTO.fullName,
      email: userDTO.account?.email || userDTO.email, // Priorité à account.email si disponible
      photoProfile: userDTO.photoProfile,
      role: userDTO.role,
      preferences: userDTO.preferences?.map(pref => ({
        id: pref.id,
        userId: pref.userId || id, // S'assurer que l'userId est défini
        category: pref.category,
        priority: pref.priority
      }))
    };

    return this.http.put<UserDTO>(`${this.adminUrl}/${id}`, backendData).pipe(
      catchError(this.handleError)
    );
  }

  deleteUserByAdmin(id: string): Observable<void> {
    // On appelle directement la méthode de suppression d'utilisateur du backend
    return this.http.delete<void>(`${this.adminUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  updateUserRole(id: string, role: Role): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.adminUrl}/${id}/role`, { role }).pipe(
      tap(user => {
        // Mise à jour du rôle de l'utilisateur courant si c'est lui
        if (this.currentUserSubject.value?.id === id) {
          const currentUser = this.currentUserSubject.value;
          currentUser.role = role;
          this.currentUserSubject.next(currentUser);
          this.authService.updateUserRole(role);
        }
      }),
      catchError(this.handleError)
    );
  }


  uploadPhotoByAdmin(id: string, file: File): Observable<UserDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserDTO>(`${this.adminUrl}/${id}/uploadPhoto`, formData).pipe(
      catchError(this.handleError)
    );
  }
  searchUsers(
    fullName?: string,
    email?: string,
    role?: Role
  ): Observable<UserDTO[]> {
    let params = new HttpParams();

    if (fullName) params = params.append('fullName', fullName);
    if (email) params = params.append('email', email);
    if (role) params = params.append('role', role.toString());

    // Le paramètre 'enabled' est supprimé car non pris en charge par le backend

    return this.http.get<UserDTO[]>(`${this.adminUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }
  // HELPER METHODS
  getAvailableRoles(): Role[] {
    if (this.isMasterAdmin()) {
      return [Role.ADMIN, Role.TRAVELER, Role.MASTERADMIN];
    } else if (this.isAdmin()) {
      return [Role.TRAVELER];
    }
    return [];
  }

  isMasterAdmin(): boolean {
    return this.authService.isMasterAdmin();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isTraveler(): boolean {
    return this.authService.isTraveler();
  }

  // Error handler pour les requêtes HTTP
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = 'Requête incorrecte. Veuillez vérifier les données envoyées.';
          break;
        case 401:
          errorMessage = 'Accès non autorisé. Veuillez vous connecter.';
          break;
        case 403:
          errorMessage = 'Accès interdit. Vous n\'avez pas les droits nécessaires.';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée.';
          break;
        default:
          errorMessage = `Erreur serveur: ${error.status}. ${error.message}`;
      }
    }

    console.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
