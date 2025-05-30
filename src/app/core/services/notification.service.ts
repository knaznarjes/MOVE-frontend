/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable quote-props */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable arrow-parens */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { Notification } from '../models/models';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private stompClient: Client;
  private notificationSubject = new Subject<Notification>();
  private readonly websocketUrl = 'http://localhost:8085/ws';
  private readonly topicPrefix = '/topic/notifications/';
  private readonly testDestination = '/app/notifications';
  private readonly apiUrl = `${environment.apiUrl}/api/notifications`;

  constructor(private http: HttpClient) {}

  /** Connexion STOMP WebSocket */
 connect(userId: string, token: string): void {
  this.stompClient = new Client({
    webSocketFactory: () => new SockJS(this.websocketUrl),
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    debug: str => console.log('STOMP DEBUG:', str),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('✅ STOMP connecté');
      this.stompClient.subscribe(
        this.topicPrefix + userId,
        (msg: IMessage) => {
          const notif: Notification = JSON.parse(msg.body);
          this.notificationSubject.next(notif);
        }
      );
    },
    onStompError: frame => {
      console.error('❌ STOMP erreur:', frame);
    }
  });

  this.stompClient.activate(); // ✅ sans argument
}

  /** Observer notifications */
  onNotification(): Observable<Notification> {
    return this.notificationSubject.asObservable();
  }

  /** Envoyer une notification de test (REST + STOMP) */
  sendTestNotification(message: string, token: string): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    const payload = { message };
    return this.http.post<string>(`${this.apiUrl}/test`, payload, { headers });
  }

  /** Récupérer les notifications par userId */
  getNotificationsByUser(userId: string, token: string): Observable<Notification[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

return this.http.get<Notification[]>(`${this.apiUrl}/${userId}`, { headers });
  }
/** Récupérer les notifications non lues */
  getUnreadNotifications(userId: string, token: string): Observable<Notification[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Notification[]>(`${this.apiUrl}/${userId}/unread`, { headers });
  }
  /** Supprimer une notification */
  deleteNotification(id: string, token: string): Observable<void> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.deactivate();
    }
  }
 /** Marquer une notification comme lue - CORRIGÉ */
  markAsRead(notificationId: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // ✅ Utilisation de PUT au lieu de PATCH pour correspondre au backend
    return this.http.put<any>(`${this.apiUrl}/${notificationId}/read`, {}, { headers });
  }

  /** Marquer toutes les notifications comme lues */
  markAllAsRead(userId: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<any>(`${this.apiUrl}/${userId}/read-all`, {}, { headers });
  }
}
