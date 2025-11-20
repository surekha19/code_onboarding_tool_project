import React, {useEffect, useState} from 'react';
import { getJSON, del } from '../api';
import { getToken } from '../auth';
import { useNavigate } from 'react-router-dom';

export default function AdminPage(){
  const [users, setUsers] = useState([]);
  const token = getToken();
  const nav = useNavigate();

  useEffect(()=> {
    if(!token) { alert('Please sign in as admin'); nav('/login'); return; }
    load();
  }, []);

  async function load(){
    const res = await getJSON('/admin/users', token);
    if (res && res.__unauthorized) { alert('Unauthorized'); nav('/login'); return; }
    if (Array.isArray(res)) setUsers(res);
    else alert(res.error || 'Could not load users');
  }

  async function remove(u){
    if(!confirm('Delete user ' + (u.email || u.id) + '?')) return;
    const r = await del('/admin/users/' + u.id, token);
    if (r && r.__unauthorized) { alert('Unauthorized'); nav('/login'); return; }
    if (r && r.ok) {
      alert('Deleted');
      load();
    } else {
      alert(r.error || 'Delete failed');
    }
  }

  return (
    <div>
      <h3 style={{fontWeight:700}}>Admin — Users</h3>
      <div style={{marginTop:10}} className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="list-item">
            <div>
              <div style={{fontWeight:700}}>{u.name || u.email}</div>
              <div className="small-muted">{u.email} • role: {u.role}</div>
            </div>
            <div>
              <button className="btn-ghost" onClick={()=>remove(u)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
