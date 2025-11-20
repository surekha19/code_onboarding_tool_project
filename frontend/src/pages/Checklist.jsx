import React, {useEffect, useState} from 'react';
import { getJSON, postJSON } from '../api';
import { getToken } from '../auth';

/**
 * Checklist page:
 * - If logged in: fetch /users/me/checklist to get completed state
 * - If not logged in: fetch /checklist (generic), completed is false
 * - Toggle completion via POST /users/me/checklist (requires login)
 * - Update UI immediately when toggling
 */

export default function Checklist(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(()=> {
    async function load(){
      setLoading(true);
      try {
        if (token) {
          // fetch user-specific checklist which includes completed state
          const res = await getJSON('/users/me/checklist', token);
          if (res && res.__unauthorized) {
            // token invalid - treat as not logged in
            console.warn('Unauthorized fetching user checklist');
            const fallback = await getJSON('/checklist');
            setItems((fallback || []).map(it => ({ ...it, completed: false })));
          } else {
            // normalize items: some endpoints use item_id or id keys; we keep id field
            const normalized = (res || []).map(it => ({
              id: it.item_id || it.id,
              key: it.key,
              title: it.title,
              description: it.description,
              importance: it.importance,
              completed: !!it.completed
            }));
            setItems(normalized);
          }
        } else {
          const res = await getJSON('/checklist');
          setItems((res || []).map(it => ({ id: it.id, key: it.key, title: it.title, description: it.description, importance: it.importance, completed: false })));
        }
      } catch (err) {
        console.error('Checklist load error', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function toggle(item) {
    // If user not logged in, prompt them to login to save progress
    if (!token) {
      alert('Please sign in to mark checklist items as done.');
      return;
    }
    // optimistic UI update
    setItems(items.map(it => it.id === item.id ? { ...it, completed: !it.completed } : it));
    try {
      const resp = await postJSON('/users/me/checklist', { item_id: item.id, completed: !item.completed }, token);
      if (resp && resp.__unauthorized) {
        alert('Session expired. Please sign in again.');
        // revert change
        setItems(items.map(it => it.id === item.id ? { ...it, completed: item.completed } : it));
      } else if (resp && resp.ok) {
        // success
      } else {
        // some error, revert UI and show message
        setItems(items.map(it => it.id === item.id ? { ...it, completed: item.completed } : it));
        alert(resp.error || 'Could not update checklist');
      }
    } catch (err) {
      console.error('Error updating checklist', err);
      // revert UI
      setItems(items.map(it => it.id === item.id ? { ...it, completed: item.completed } : it));
      alert('Network error while updating checklist');
    }
  }

  if (loading) return <div className="large-card">Loading checklist...</div>;

  return (
    <div>
      <h3 style={{fontWeight:700}}>Setup Checklist</h3>
      <div style={{marginTop:10}} className="space-y-2">
        {items.length === 0 && <div className="large-card small-muted">No checklist items found.</div>}
        {items.map(it => (
          <div key={it.id} className="list-item">
            <div>
              <div style={{fontWeight:700}}>{it.title}</div>
              <div className="small-muted">{it.description}</div>
            </div>
            <div>
              <button
                className={it.completed ? 'btn-complete' : 'btn-incomplete'}
                onClick={() => toggle(it)}
                aria-pressed={it.completed}
              >
                {it.completed ? 'Completed' : 'Mark Done'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
