import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Home from './pages/Home';
import AppsPage from './pages/AppsPage';
import Checklist from './pages/Checklist';
import TutorialPlayer from './pages/TutorialPlayer';
import Profile from './pages/Profile';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './ProtectedRoute';

export default function App(){
  return (
    <div className="phone-shell">
      <header className="header mb-3">
        <div className="brand">Onboarding</div>
        <nav>
          <Link to="/home" style={{marginRight:8}}>Home</Link>
          <Link to="/apps" style={{marginRight:8}}>Apps</Link>
          <Link to="/profile" style={{marginRight:8}}>Profile</Link>
          <Link to="/admin" style={{color:'#0b61ff'}}>Admin</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          <Route path="/apps" element={
            <ProtectedRoute>
              <AppsPage />
            </ProtectedRoute>
          } />

          <Route path="/tutorial/:id" element={
            <ProtectedRoute>
              <TutorialPlayer />
            </ProtectedRoute>
          } />

          <Route path="/checklist" element={
            <ProtectedRoute>
              <Checklist />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}
