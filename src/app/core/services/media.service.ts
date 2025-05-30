/* eslint-disable curly */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { Media } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private apiUrl = `${environment.apiUrl}/api/media`;

  constructor(private http: HttpClient) {}

  /**
   * Upload général d'un média (photo, vidéo, etc.)
   */
  uploadMedia(
    file: File,
    contentId: string,
    title: string,
    description: string,
    mediaType: string = 'ALBUM',
    displayOrder?: number
  ): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentId', contentId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('mediaType', mediaType);
    if (displayOrder !== undefined) formData.append('displayOrder', displayOrder.toString());

    return this.http.post<Media>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Upload spécifique d'une image de couverture
   */
  uploadCoverImage(
    file: File,
    contentId: string,
    title: string,
    description: string
  ): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentId', contentId);
    formData.append('title', title);
    formData.append('description', description);

    return this.http.post<Media>(`${this.apiUrl}/upload/cover`, formData);
  }

  /**
   * Upload spécifique d'une photo d'album
   */
  uploadAlbumPhoto(
    file: File,
    contentId: string,
    title: string,
    description: string,
    displayOrder?: number
  ): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentId', contentId);
    formData.append('title', title);
    formData.append('description', description);
    if (displayOrder !== undefined) formData.append('displayOrder', displayOrder.toString());

    return this.http.post<Media>(`${this.apiUrl}/upload/photo`, formData);
  }

  /**
   * Upload spécifique d'une vidéo
   */
  uploadVideo(
    file: File,
    contentId: string,
    title: string,
    description: string,
    displayOrder?: number
  ): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentId', contentId);
    formData.append('title', title);
    formData.append('description', description);
    if (displayOrder !== undefined) formData.append('displayOrder', displayOrder.toString());

    return this.http.post<Media>(`${this.apiUrl}/upload/video`, formData);
  }

  /**
   * Récupérer l'image de couverture d'un contenu
   */
  getCoverByContentId(contentId: string): Observable<Media> {
    return this.http.get<Media>(`${this.apiUrl}/cover/${contentId}`);
  }

  /**
   * Récupérer toutes les photos d'un contenu
   */
  getPhotosByContentId(contentId: string): Observable<Media[]> {
    return this.http.get<Media[]>(`${this.apiUrl}/photos/${contentId}`);
  }

  /**
   * Récupérer toutes les vidéos d'un contenu
   */
  getVideosByContentId(contentId: string): Observable<Media[]> {
    return this.http.get<Media[]>(`${this.apiUrl}/videos/${contentId}`);
  }

  /**
   * Récupérer tous les médias associés à un contenu
   */
  getMediaByContentId(contentId: string): Observable<Media[]> {
    return this.http.get<Media[]>(`${this.apiUrl}/content/${contentId}`);
  }

  /**
   * Récupérer un média par son ID
   */
  getMediaById(mediaId: string): Observable<Media> {
    return this.http.get<Media>(`${this.apiUrl}/${mediaId}`);
  }

  /**
   * Récupérer l'URL d'un fichier média par son ID
   */
  getMediaFileUrl(mediaId: string): string {
    return `${this.apiUrl}/file/${mediaId}`;
  }

  /**
   * Récupérer l'URL d'un fichier média par contentId et fileName
   */
  getMediaFileUrlByPath(contentId: string, fileName: string): string {
    return `${this.apiUrl}/files/${contentId}/${fileName}`;
  }

  /**
   * Récupérer les médias d'un type spécifique pour un contenu
   */
  getMediaByContentIdAndType(contentId: string, mediaType: string): Observable<Media[]> {
    return this.http.get<Media[]>(`${this.apiUrl}/content/${contentId}/type/${mediaType}`);
  }

  /**
   * Mise à jour des infos (titre, description, mediaType, displayOrder)
   */
  updateMediaInfo(
    mediaId: string,
    title: string,
    description: string,
    mediaType?: string,
    displayOrder?: number
  ): Observable<Media> {
    let params = new HttpParams()
      .set('title', title)
      .set('description', description);

    if (mediaType) params = params.set('mediaType', mediaType);
    if (displayOrder !== undefined) params = params.set('displayOrder', displayOrder.toString());

    return this.http.put<Media>(`${this.apiUrl}/${mediaId}`, null, { params });
  }

  /**
   * Suppression d'un média
   */
  deleteMedia(mediaId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${mediaId}`);
  }
}
