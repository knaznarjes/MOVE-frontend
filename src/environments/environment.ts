// environment.ts (for development)
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8080',  // Points to your API Gateway port

    // Application configuration
    appName: 'move-app',

    // JWT configuration (matches backend settings)
    jwt: {
      expiration: 43200000,         // 12 hours (matches your backend)
      refreshExpiration: 2592000000  // 30 days (matches your backend)
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
      '/debug-token',
      '/service-discovery-status',
      '/actuator/**',
      '/health',
      '/v3/api-docs/**',
      '/swagger-ui/**',
      '/swagger-ui.html',
      '/error',

    ],

    // Logging configuration
    logging: {
      level: 'debug'  // More verbose for development
    }
  };
