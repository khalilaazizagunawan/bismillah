import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { Toaster } from 'react-hot-toast'

import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "./lib/apolloClient";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <CartProvider>
          <App />
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={12}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px 24px',
                fontSize: '16px',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
                icon: '🎉',
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </ApolloProvider>
  </React.StrictMode>
)
