/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable arrow-parens */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { Notification } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client;
  private notificationSubject = new Subject<Notification>();

  private readonly websocketUrl = 'http://localhost:8085/ws'; // 👈 Port direct vers microservice
  private readonly topicPrefix = '/topic/notifications/';
  private readonly testDestination = '/app/notifications';

  constructor() {}

  /** Connexion avec token JWT et abonnement */
 connect(userId: string, jwtToken: string): void {
  this.stompClient = new Client({
    webSocketFactory: () => new SockJS(this.websocketUrl),
    connectHeaders: {
      Authorization: `Bearer ${jwtToken}`
    },
    debug: str => console.log('🔧 STOMP DEBUG:', str),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('🟢 WebSocket connecté');
      this.stompClient.subscribe(
        this.topicPrefix + userId,
        (message: IMessage) => {
          const notif: Notification = JSON.parse(message.body);
          this.notificationSubject.next(notif);
        }
      );
    },
    onStompError: (frame) => {
      console.error('❌ STOMP error:', frame);
    }
  });

  this.stompClient.activate(); // ✅ Sans argument ici
}


  /** Observable pour les composants */
  onNotification(): Observable<Notification> {
    return this.notificationSubject.asObservable();
  }

  /** Envoyer une notification de test */
  sendTestNotification(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: this.testDestination,
        body: JSON.stringify({ message: '🚀 Notification de test !' })
      });
    } else {
      console.warn('WebSocket non connecté, test non envoyé');
    }
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.deactivate();
    }
  }
}
