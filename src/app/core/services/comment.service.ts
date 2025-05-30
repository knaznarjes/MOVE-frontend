/* eslint-disable quotes */
/* eslint-disable arrow-parens */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from 'environments/environment';
import { Comment } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = `${environment.apiUrl}/api/comments`;

  constructor(private http: HttpClient) {}

  /** 🔹 Récupérer les commentaires d’un contenu (avec ou sans pagination) */
  getCommentsByContentId(contentId: string, page?: number, size?: number): Observable<any> {
    let params = new HttpParams();
    if (page !== undefined && size !== undefined) {
      params = params.set('page', page).set('size', size);
    }

    return this.http.get<any>(`${this.apiUrl}/content/${contentId}`, { params })
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors du chargement des commentaires`, error);
          return of({ comments: [], contentId });
        })
      );
  }

  /** 🔹 Récupérer un commentaire par son ID */
  getCommentById(commentId: string): Observable<Comment> {
    return this.http.get<Comment>(`${this.apiUrl}/${commentId}`)
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors de la récupération du commentaire ${commentId}`, error);
          throw error;
        })
      );
  }

  /** 🔹 Obtenir le nombre de commentaires pour un contenu */
  getCommentCount(contentId: string): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/content/${contentId}/count`)
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors du comptage des commentaires`, error);
          return of(0);
        })
      );
  }

  /** 🔹 Obtenir les commentaires d’un utilisateur */
  getCommentsByUserId(userId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/user/${userId}`)
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors du chargement des commentaires de l'utilisateur ${userId}`, error);
          return of([]);
        })
      );
  }

  /** 🔹 Ajouter un commentaire */
  addComment(comment: Partial<Comment>): Observable<any> {
    return this.http.post<any>(this.apiUrl, comment)
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors de l'ajout du commentaire`, error);
          throw error;
        })
      );
  }

  /** 🔹 Mettre à jour un commentaire */
  updateComment(commentId: string, message: string): Observable<any> {
    const body = { message };
    return this.http.put<any>(`${this.apiUrl}/${commentId}`, body)
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors de la mise à jour du commentaire ${commentId}`, error);
          throw error;
        })
      );
  }

  /** 🔹 Supprimer un commentaire */
  deleteComment(commentId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${commentId}`)
      .pipe(
        catchError(error => {
          console.error(`❌ Erreur lors de la suppression du commentaire ${commentId}`, error);
          throw error;
        })
      );
  }

  /** 🔹 Health check */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`)
      .pipe(
        catchError(error => {
          console.error('❌ Health check échoué', error);
          throw error;
        })
      );
  }
}
