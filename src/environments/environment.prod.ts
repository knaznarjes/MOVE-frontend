// environment.prod.ts
export const environment = {
    production: true,
    apiUrl: 'https://api.move-app.com',  // Production URL

    // Application configuration
    appName: 'move-app',

    // JWT configuration (matching backend settings)
    jwt: {
      expiration: 43200000,         // 12 hours
      refreshExpiration: 2592000000  // 30 days
    },

    // Authentication endpoints
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      refresh: '/api/auth/refresh-token',  // Fixed to match backend endpoint
      me: '/api/auth/me'
    },

    // Public endpoints (no authentication required)
    publicEndpoints: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh-token',
      '/api/auth/refresh',
      '/v3/api-docs/**',
      '/swagger-ui/**',
      '/swagger-ui.html',
      '/error'
    ],

    // Logging configuration - reduced level in production
    logging: {
      level: 'error'
    }
  };
