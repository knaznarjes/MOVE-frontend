/* eslint-disable curly */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { ActivityPoint } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ActivityPointService {
  private apiUrl = `${environment.apiUrl}/api/activity-points`;

  constructor(private http: HttpClient) {}

  // Créer une activité
  create(activityPoint: ActivityPoint): Observable<ActivityPoint> {
    return this.http.post<ActivityPoint>(this.apiUrl, activityPoint);
  }

  // Récupérer une activité par ID
  getById(id: string): Observable<ActivityPoint> {
    return this.http.get<ActivityPoint>(`${this.apiUrl}/${id}`);
  }

  // 🔄 Récupérer toutes les activités liées à un DayProgram
  getAllByDayProgram(dayProgramId: string): Observable<ActivityPoint[]> {
    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/day-program/${dayProgramId}`);
  }

  // Mettre à jour une activité
  update(id: string, activityPoint: ActivityPoint): Observable<ActivityPoint> {
    return this.http.put<ActivityPoint>(`${this.apiUrl}/${id}`, activityPoint);
  }

  // Supprimer une activité
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Récupérer toutes les activités
  getAll(): Observable<ActivityPoint[]> {
    return this.http.get<ActivityPoint[]>(this.apiUrl);
  }

  // Récupérer les activités avec pagination
  getAllPaginated(page: number = 0, size: number = 10, sortBy: string = 'name', direction: string = 'asc'): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<any>(`${this.apiUrl}/paginated`, { params });
  }

  // Rechercher par nom
  findByName(name: string): Observable<ActivityPoint[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/search/name`, { params });
  }

  // Rechercher par localisation
  findByLocation(location: string): Observable<ActivityPoint[]> {
    const params = new HttpParams().set('location', location);
    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/search/location`, { params });
  }

  // Rechercher par coût maximum
  findByCostLessThanEqual(maxCost: number): Observable<ActivityPoint[]> {
    const params = new HttpParams().set('maxCost', maxCost.toString());
    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/search/cost`, { params });
  }

  // Rechercher par ID de contenu
  findByContentId(contentId: string): Observable<ActivityPoint[]> {
    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/content/${contentId}`);
  }

  // Recherche avancée avec plusieurs critères
  searchActivityPoints(name?: string, type?: string, location?: string, maxCost?: number): Observable<ActivityPoint[]> {
    let params = new HttpParams();
    if (name) params = params.set('name', name);
    if (type) params = params.set('type', type);
    if (location) params = params.set('location', location);
    if (maxCost !== undefined) params = params.set('maxCost', maxCost.toString());

    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/search`, { params });
  }
}
