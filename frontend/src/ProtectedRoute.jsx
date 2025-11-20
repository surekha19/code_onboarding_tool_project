import React from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from './auth';

/**
 * Wrap protected routes:
 * <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
