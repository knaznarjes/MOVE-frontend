export const environment = {
  production: true,
  apiUrl: 'https://api.move-app.com',  // URL de production hypothétique
  
  // Configuration de l'application
  appName: 'gateway-auth-service',
  
  // Configuration de MongoDB
  mongodb: {
    host: 'mongodb-server',  // Nom d'hôte de production
    port: 27017,
    database: 'move_auth_db',
    autoIndexCreation: true
  },
  
  // Configuration JWT
  jwt: {
    expiration: 43200000,         // 12 heures en millisecondes
    refreshExpiration: 2592000000  // 30 jours en millisecondes
  },
  
  // Services microservices
  services: {
    content: {
      uri: 'http://content-service:8081',  // Utilise les noms de services internes
      path: '/api/content'
    },
    search: {
      uri: 'http://search-service:8082',
      path: '/api/search'
    },
    community: {
      uri: 'http://community-service:8083',
      path: '/api/community'
    }
  },
  
  // Endpoints publics (sans authentification)
  publicEndpoints: [
    '/api/auth/login',
    '/api/auth/register'
  ],
  
  // Configuration des logs - niveaux réduits en production
  logging: {
    security: 'INFO',
    auth: 'INFO',
    authSecurity: 'INFO'
  }
};