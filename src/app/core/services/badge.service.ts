import { Badge } from './../models/badge.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root',
})
export class BadgeService {
  private apiUrl = 'http://localhost:8080/api/badges'; 
  constructor(private http: HttpClient) {}

  getAllBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.apiUrl}`);
  }

  getBadgeById(id: string): Observable<Badge> {
    return this.http.get<Badge>(`${this.apiUrl}/${id}`);
  }

  createBadge(badge: Badge): Observable<Badge> {
    return this.http.post<Badge>(`${this.apiUrl}`, badge);
  }

  updateBadge(id: string, badge: Badge): Observable<Badge> {
    return this.http.put<Badge>(`${this.apiUrl}/${id}`, badge);
  }

  deleteBadge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getBadgesByCriteria(criteria: string): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.apiUrl}/criteria/${criteria}`);
  }
}
