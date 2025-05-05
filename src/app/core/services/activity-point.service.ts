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

  constructor(private http: HttpClient) { }

  getById(id: string): Observable<ActivityPoint> {
    return this.http.get<ActivityPoint>(`${this.apiUrl}/${id}`);
  }

  getAllByDay(dayId: string): Observable<ActivityPoint[]> {
    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/day/${dayId}`);
  }

  getAll(): Observable<ActivityPoint[]> {
    return this.http.get<ActivityPoint[]>(this.apiUrl);
  }

  getAllPaginated(page: number = 0, size: number = 10, sortBy = 'name', direction = 'asc'): Observable<ActivityPoint> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);

    return this.http.get<ActivityPoint>(`${this.apiUrl}/paginated`, { params });
  }

  searchByName(name: string): Observable<ActivityPoint[]> {
    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/search/name`, { params: { name } });
  }

  searchByLocation(location: string): Observable<ActivityPoint[]> {
    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/search/location`, { params: { location } });
  }

  searchByCost(maxCost: number): Observable<ActivityPoint[]> {
    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/search/cost`, { params: { maxCost } });
  }

  getByContentId(contentId: string): Observable<ActivityPoint[]> {
    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/content/${contentId}`);
  }

  searchAdvanced(name?: string, type?: string, location?: string, maxCost?: number): Observable<ActivityPoint[]> {
    let params = new HttpParams();
    if (name) params = params.set('name', name);
    if (type) params = params.set('type', type);
    if (location) params = params.set('location', location);
    if (maxCost !== undefined) params = params.set('maxCost', maxCost.toString());

    return this.http.get<ActivityPoint[]>(`${this.apiUrl}/search`, { params });
  }

  create(activity: ActivityPoint): Observable<ActivityPoint> {
    return this.http.post<ActivityPoint>(this.apiUrl, activity);
  }

  update(id: string, activity: ActivityPoint): Observable<ActivityPoint> {
    return this.http.put<ActivityPoint>(`${this.apiUrl}/${id}`, activity);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
