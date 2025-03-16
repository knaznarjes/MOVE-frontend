export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  
  // Configuration de l'application
  appName: 'gateway-auth-service',
  
  // Configuration de MongoDB
  mongodb: {
    host: 'localhost',
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
      uri: 'http://localhost:8081',
      path: '/api/content'
    },
    search: {
      uri: 'http://localhost:8082',
      path: '/api/search'
    },
    community: {
      uri: 'http://localhost:8083',
      path: '/api/community'
    }
  },
  
  // Endpoints publics (sans authentification)
  publicEndpoints: [
    '/api/auth/login',
    '/api/auth/register'
  ],
  
  // Configuration des logs
  logging: {
    security: 'DEBUG',
    auth: 'DEBUG',
    authSecurity: 'TRACE'
  }
};