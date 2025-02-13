export const environment = {
    production: true,
    apiUrl: '/api', // In production, use relative path to handle different deployment domains
    jwt: {
      secret: '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970',
      expiration: 86400000 // 24 hours in milliseconds
    }
  };
