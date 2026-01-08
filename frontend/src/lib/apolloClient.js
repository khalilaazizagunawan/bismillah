import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]:`, networkError);
    console.error(`[Network error details]:`, {
      message: networkError.message,
      statusCode: networkError.statusCode,
      result: networkError.result,
      response: networkError.response
    });
    // Check if it's a connection error
    if (networkError.message && (networkError.message.includes('Failed to fetch') || networkError.message.includes('NetworkError'))) {
      console.error('Backend server tidak dapat dijangkau. Pastikan backend berjalan di http://localhost:4000/graphql');
      console.error('Cek apakah gateway container running: docker ps | grep gateway');
    }
  }
});

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || "http://localhost:4000/graphql",   // ✅ backend port 4000
  // credentials: "include", // Removed to avoid CORS preflight issues
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
