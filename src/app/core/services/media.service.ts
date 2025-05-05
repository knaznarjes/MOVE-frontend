import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { Media } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private apiUrl = `${environment.apiUrl}/api/media`;

  constructor(private http: HttpClient) { }

  // Récupérer tous les médias d'un contenu
  getMediaByContentId(contentId: string): Observable<Media[]> {
    return this.http.get<Media[]>(`${this.apiUrl}/content/${contentId}`);
  }

  // Uploader un média
  uploadMedia(
    file: File,
    contentId: string,
    title: string,
    description: string,
    mediaType: string = 'ALBUM',
    displayOrder?: number
  ): Observable<HttpEvent<Media>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentId', contentId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('mediaType', mediaType);

    if (displayOrder !== undefined) {
      formData.append('displayOrder', displayOrder.toString());
    }

    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true
    });

    return this.http.request<Media>(req);
  }

  // Mettre à jour les informations d'un média
  updateMediaInfo(
    mediaId: string,
    title: string,
    description: string,
    mediaType?: string,
    displayOrder?: number
  ): Observable<Media> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);

    if (mediaType) {
      formData.append('mediaType', mediaType);
    }

    if (displayOrder !== undefined) {
      formData.append('displayOrder', displayOrder.toString());
    }

    return this.http.put<Media>(`${this.apiUrl}/${mediaId}`, formData);
  }

  // Supprimer un média
  deleteMedia(mediaId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${mediaId}`);
  }
}
