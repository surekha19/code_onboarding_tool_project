import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { postJSON } from '../api';
import { saveToken } from '../auth';

export default function Login(){
  const [form, setForm] = useState({ email:'', password:'' });
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    const res = await postJSON('/auth/login', form);
    if (res && res.__unauthorized) {
      alert('Unauthorized');
      return;
    }
    if (res.token) {
      saveToken(res.token);
      nav('/home');
    } else {
      alert(res.error || 'Login failed');
    }
  }

  return (
    <div className="large-card">
      <h3 style={{fontWeight:700}}>Sign in</h3>
      <form onSubmit={submit} className="space-y-3" style={{marginTop:8}}>
        <input className="input" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <button className="btn" type="submit">Sign in</button>
      </form>
    </div>
  );
}
