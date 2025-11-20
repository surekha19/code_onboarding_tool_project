import React from 'react';
import { Link } from 'react-router-dom';
export default function Landing(){
  return (
    <div className="large-card">
      <h2 style={{fontSize:20, fontWeight:700}}>Welcome</h2>
      <p className="small-muted">A simple, friendly guide for new smartphone users.</p>
      <div style={{marginTop:12}}>
        <Link to="/signup" className="btn w-full" style={{display:'block', marginBottom:8}}>Begin Learning</Link>
        <Link to="/login" className="btn-ghost w-full" style={{display:'block'}}>Sign in</Link>
      </div>
    </div>
  );
}
