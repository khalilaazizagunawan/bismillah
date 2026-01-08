const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs } = require('./schema');
const resolvers = require('./resolvers');

const app = express();
// Enable CORS with proper configuration - allow all origins for development
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: false // Set to false since we removed credentials from frontend
}));
// Increase body parser limit to handle base64 images (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (err) => {
      // Don't return the full error object if it contains circular references
      console.error("GraphQL Error:", err.message);
      return {
        message: err.message,
        path: err.path,
        extensions: {
          code: err.extensions?.code,
          // Exclude details that might have circular references
        },
      };
    },
  });

  await server.start();
  server.applyMiddleware({ app, cors: false }); // Disable CORS di applyMiddleware karena sudah di-set di Express

  app.listen(4000, '0.0.0.0', () => {
    console.log('🚀 Gateway running at http://localhost:4000/graphql');
  });
}

startServer();
