import React from 'react';
import { Link } from 'react-router-dom';

export default function Home(){
  // Home is protected by ProtectedRoute; simple large buttons link to sections
  return (
    <div>
      <div className="large-card">
        <h3 style={{fontWeight:700}}>Home</h3>
        <p className="small-muted">Pick a learning path below.</p>
      </div>

      <div style={{marginTop:12}} className="card-grid">
        <Link to="/apps" className="large-card" style={{textDecoration:'none', color:'inherit'}}>Apps & Lessons</Link>
        <Link to="/checklist" className="large-card" style={{textDecoration:'none', color:'inherit'}}>Checklist</Link>
        <Link to="/profile" className="large-card" style={{textDecoration:'none', color:'inherit'}}>Profile</Link>
      </div>
    </div>
  );
}
