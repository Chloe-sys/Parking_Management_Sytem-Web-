const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Parking Management System API',
      version: '1.0.0',
      description: 'API documentation for the Parking Management System',
      contact: {
        name: 'Chloe Ishimwe',
        email: 'karlychloee12@gmail.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:8082',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs; 