import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { DayProgram } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DayProgramService {
  private apiUrl = `${environment.apiUrl}/api/day-programs`;

  constructor(private http: HttpClient) {}

  // Créer un jour de programme
  create(dayProgram: DayProgram): Observable<DayProgram> {
    return this.http.post<DayProgram>(this.apiUrl, dayProgram);
  }

  // Récupérer un jour de programme par ID
  getById(id: string): Observable<DayProgram> {
    return this.http.get<DayProgram>(`${this.apiUrl}/${id}`);
  }

  // Récupérer tous les jours de programme d'un contenu
  getAllByContent(contentId: string): Observable<DayProgram[]> {
    return this.http.get<DayProgram[]>(`${this.apiUrl}/content/${contentId}`);
  }

  // Mettre à jour un jour de programme
  update(id: string, dayProgram: DayProgram): Observable<DayProgram> {
    return this.http.put<DayProgram>(`${this.apiUrl}/${id}`, dayProgram);
  }

  // Supprimer un jour de programme
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
