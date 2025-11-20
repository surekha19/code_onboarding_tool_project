import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { postJSON } from '../api';
import { saveToken } from '../auth';

export default function Signup(){
  const [form, setForm] = useState({ email:'', password:'', name:'', age_group:'65-74' });
  const nav = useNavigate();
  async function onSubmit(e){
    e.preventDefault();
    if(!form.email.includes('@') || form.password.length<6){ alert('Enter valid email & min 6 char password'); return; }
    const res = await postJSON('/auth/signup', form);
    if(res && res.__unauthorized){ alert('Unauthorized'); return; }
    if(res.token){ saveToken(res.token); nav('/home'); } else { alert(res.error || 'Signup failed'); }
  }
  return (
    <div className="large-card">
      <h3 style={{fontWeight:700}}>Create account</h3>
      <form onSubmit={onSubmit} className="space-y-3" style={{marginTop:8}}>
        <input className="input" placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <input className="input" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <input className="input" placeholder="Password (min 6)" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <div style={{display:'flex', gap:8}}>
          <select className="input" value={form.age_group} onChange={e=>setForm({...form,age_group:e.target.value})}>
            <option>55-64</option>
            <option>65-74</option>
            <option>75+</option>
          </select>
          <button className="btn" type="submit">Sign up</button>
        </div>
      </form>
    </div>
  );
}
