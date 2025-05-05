// day-program.service.ts
import { environment } from './../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DayProgram } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DayProgramService {
  private apiUrl = `${environment.apiUrl}/api/day-programs`;

  constructor(private http: HttpClient) { }

  // Récupérer un jour par ID
  getById(id: string): Observable<DayProgram> {
    return this.http.get<DayProgram>(`${this.apiUrl}/${id}`);
  }

  // Récupérer tous les jours d'un contenu
  getAllByContent(contentId: string): Observable<DayProgram[]> {
    return this.http.get<DayProgram[]>(`${this.apiUrl}/content/${contentId}`);
  }

  // Créer un nouveau jour
  create(day: DayProgram): Observable<DayProgram> {
    return this.http.post<DayProgram>(this.apiUrl, day);
  }

  // Mettre à jour un jour
  update(id: string, day: DayProgram): Observable<DayProgram> {
    return this.http.put<DayProgram>(`${this.apiUrl}/${id}`, day);
  }

  // Supprimer un jour
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
