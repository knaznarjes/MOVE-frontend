/* eslint-disable curly */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable jsdoc/newline-after-description */
/* eslint-disable arrow-parens */
/* eslint-disable @typescript-eslint/member-delimiter-style */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { environment } from 'environments/environment';
import { ContentFavorisDTO } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ContentFavorisService {
  private apiUrl = `${environment.apiUrl}/api/contents/favorites`;

  constructor(private http: HttpClient) {}

  addToFavorites(userId: string, contentId: string): Observable<ContentFavorisDTO> {
    return this.http.post<ContentFavorisDTO>(`${this.apiUrl}/users/${userId}/contents/${contentId}`, {})
      .pipe(
        catchError(error => {
          console.error(`Error adding content ${contentId} to favorites for user ${userId}:`, error);
          throw error;
        })
      );
  }

  removeFromFavorites(userId: string, contentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}/contents/${contentId}`)
      .pipe(
        catchError(error => {
          console.error(`Error removing favorite ${contentId} for user ${userId}:`, error);
          throw error;
        })
      );
  }

  getUserFavorites(userId: string): Observable<ContentFavorisDTO[]> {
    return this.http.get<ContentFavorisDTO[]>(`${this.apiUrl}/users/${userId}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching favorites for user ${userId}:`, error);
          return of([]);
        })
      );
  }

  isContentInFavorites(userId: string, contentId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/users/${userId}/contents/${contentId}/check`)
      .pipe(
        catchError(error => {
          console.error(`Error checking if content ${contentId} is in favorites for user ${userId}:`, error);
          return of(false);
        })
      );
  }

  getContentFavorites(contentId: string): Observable<ContentFavorisDTO[]> {
    return this.http.get<ContentFavorisDTO[]>(`${this.apiUrl}/contents/${contentId}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching favorites for content ${contentId}:`, error);
          return of([]);
        })
      );
  }

  countContentFavorites(contentId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/contents/${contentId}/count`)
      .pipe(
        catchError(error => {
          console.error(`Error counting favorites for content ${contentId}:`, error);
          return of(0);
        })
      );
  }

  removeAllUserFavorites(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`)
      .pipe(
        catchError(error => {
          console.error(`Error removing all favorites for user ${userId}:`, error);
          throw error;
        })
      );
  }

  // Méthodes utilitaires basées sur les nouvelles méthodes
  toggleFavorite(userId: string, contentId: string): Observable<ContentFavorisDTO | null> {
    return new Observable(observer => {
      this.isContentInFavorites(userId, contentId).subscribe({
        next: (isFavorite) => {
          if (isFavorite) {
            this.removeFromFavorites(userId, contentId).subscribe({
              next: () => {
                observer.next(null);
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          } else {
            this.addToFavorites(userId, contentId).subscribe({
              next: (newFavorite) => {
                observer.next(newFavorite);
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  getFavoritedContentIds(userId: string): Observable<string[]> {
    return this.getUserFavorites(userId)
      .pipe(
        catchError(() => of([])),
        map(favorites => favorites.map(f => f.contentId))
      );
  }

  // Alias pour compatibilité avec l'ancienne API
  isFavorited(contentId: string, userId: string): Observable<boolean> {
    return this.isContentInFavorites(userId, contentId);
  }

  getFavorite(contentId: string, userId: string): Observable<ContentFavorisDTO | null> {
    return this.isContentInFavorites(userId, contentId)
      .pipe(
        map(isFavorite => isFavorite ? { userId, contentId } as ContentFavorisDTO : null),
        catchError(() => of(null))
      );
  }

  removeFavorite(contentId: string, userId: string): Observable<void> {
    return this.removeFromFavorites(userId, contentId);
  }
}
