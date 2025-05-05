import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { Location } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = `${environment.apiUrl}/api/locations`;
  constructor(private http: HttpClient) { }

  // Récupérer tous les lieux
  getAllLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.apiUrl}/all`);
  }

  // Récupérer un lieu par ID
  getLocationById(id: string): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/${id}`);
  }

  // Créer un nouveau lieu
  createLocation(location: Location): Observable<Location> {
    return this.http.post<Location>(this.apiUrl, location);
  }

  // Mettre à jour un lieu
  updateLocation(id: string, location: Location): Observable<Location> {
    return this.http.put<Location>(`${this.apiUrl}/${id}`, location);
  }

  // Supprimer un lieu
  deleteLocation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Rechercher des lieux par pays
  getLocationsByCountry(country: string): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.apiUrl}/country`, {
      params: new HttpParams().set('country', country)
    });
  }

  // ✅ Liste des pays du monde (API gratuite REST Countries)
  getAllCountries(): Observable<any[]> {
    return this.http.get<any[]>('https://restcountries.com/v3.1/all');
  }
}
