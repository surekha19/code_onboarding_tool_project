import React, {useEffect,useState} from 'react';
import { getJSON } from '../api';
import { getToken, clearToken } from '../auth';
import { useNavigate } from 'react-router-dom';
export default function Profile(){
  const [profile, setProfile] = useState(null);
  const token = getToken();
  const nav = useNavigate();
  useEffect(()=>{ if(!token) return; getJSON('/users/me', token).then(setProfile).catch(()=>setProfile(null)); },[]);
  function logout(){ clearToken(); nav('/'); }
  if(!token) return <div className="large-card">Sign in to view profile</div>;
  if(!profile) return <div className="large-card">Loading...</div>;
  return (
    <div>
      <div className="large-card">
        <div style={{fontWeight:700}}>{profile.name || profile.email}</div>
        <div className="small-muted">Joined: {new Date(profile.created_at).toLocaleDateString()}</div>
        <button className="btn" style={{marginTop:10}} onClick={logout}>Sign out</button>
      </div>
      <div style={{marginTop:10}} className="large-card">
        <div style={{fontWeight:700}}>Progress</div>
        <div style={{marginTop:8}}>
          {profile.progress && profile.progress.length>0 ? (
            profile.progress.map(p => <div key={p.tutorial_id} className="small-muted">Tutorial {p.tutorial_id}: {p.completed_steps} steps done</div>)
          ) : (
            <div className="small-muted">No progress yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
