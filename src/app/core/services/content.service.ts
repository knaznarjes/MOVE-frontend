import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { Content } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiUrl = `${environment.apiUrl}/api/contents`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les contenus (admin)
  getAllContents(): Observable<Content[]> {
    return this.http.get<Content[]>(`${this.apiUrl}/all`);
  }

  // Récupérer les contenus de l'utilisateur connecté
  getMyContents(): Observable<Content[]> {
    return this.http.get<Content[]>(`${this.apiUrl}/me`);
  }

  // Récupérer un contenu par son ID
  getContentById(id: string): Observable<Content> {
    return this.http.get<Content>(`${this.apiUrl}/${id}`);
  }

  // Créer un contenu
  createContent(content: Content): Observable<Content> {
    return this.http.post<Content>(this.apiUrl, content);
  }

  // Mettre à jour un contenu
  updateContent(id: string, content: Content): Observable<Content> {
    return this.http.put<Content>(`${this.apiUrl}/${id}`, content);
  }

  // Supprimer un contenu
  deleteContent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Récupérer les contenus par type (TravelStory ou Itinerary)
  getContentsByType(type: string): Observable<Content[]> {
    const params = new HttpParams().set('type', type);
    return this.http.get<Content[]>(`${this.apiUrl}/type`, { params });
  }

  // Contenus les mieux notés (avec pagination)
  getTopRatedContents(page: number = 0, size: number = 10): Observable<Content[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Content[]>(`${this.apiUrl}/top-rated`, { params });
  }

  // Publier un contenu
  publishContent(id: string): Observable<Content> {
    return this.http.put<Content>(`${this.apiUrl}/${id}/publish`, {});
  }

  // Dépublier un contenu
  unpublishContent(id: string): Observable<Content> {
    return this.http.put<Content>(`${this.apiUrl}/${id}/unpublish`, {});
  }

  // Bloquer un contenu (admin master)
  blockContentAsMaster(id: string): Observable<Content> {
    return this.http.put<Content>(`${this.apiUrl}/${id}/block`, {});
  }

  // Bloquer un contenu (admin normal avec rôle créateur)
  blockContentAsAdmin(id: string, ownerRole: string): Observable<Content> {
    const params = new HttpParams().set('ownerRole', ownerRole);
    return this.http.put<Content>(`${this.apiUrl}/${id}/block-admin`, {}, { params });
  }
}
