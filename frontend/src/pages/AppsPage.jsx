import React, {useEffect,useState} from 'react';
import { Link } from 'react-router-dom';
import { getJSON } from '../api';
import { getToken } from '../auth';

/**
 * AppsPage with client-side pagination
 * - pageSize: items per page (adjustable)
 * - shows Prev / Next buttons and page number buttons
 */

export default function AppsPage(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5; // items per page
  const token = getToken();

  useEffect(()=> {
    async function load(){
      setLoading(true);
      try {
        // prefer tutorials endpoint for lessons
        const tuts = await getJSON('/tutorials', token);
        if (Array.isArray(tuts) && tuts.length > 0) {
          setItems(tuts.map(t => ({ id: t.id, slug: t.slug, name: t.title, description: t.summary, safe_score: 95 })));
        } else {
          const apps = await getJSON('/apps', token);
          if (Array.isArray(apps)) {
            setItems(apps.map(a => ({ id: a.id, name: a.name, description: a.description, safe_score: a.safe_score || 90 })));
          } else {
            setItems([]);
          }
        }
      } catch (err) {
        console.error('Apps load error', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const pageItems = items.slice((current-1)*pageSize, current*pageSize);

  function go(p){
    if (p < 1 || p > totalPages) return;
    setPage(p);
    // scroll to top of phone-shell for a better UX
    const shell = document.querySelector('.phone-shell');
    if (shell) shell.scrollTop = 0;
  }

  if (loading) return <div className="large-card">Loading lessons...</div>;

  return (
    <div>
      <h3 style={{fontWeight:700}}>Curated Lessons</h3>

      {total === 0 && <div className="large-card small-muted" style={{marginTop:10}}>No lessons found.</div>}

      <div style={{marginTop:10}} className="card-grid">
        {pageItems.map(a => (
          <div key={a.id} className="large-card">
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:700}}>{a.name}</div>
                <div className="small-muted">{a.description}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="small-muted">{a.safe_score || '—'}/100</div>
                <Link to={'/tutorial/'+(a.slug || a.id)} className="btn" style={{marginTop:6}}>Open Lesson</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination" role="navigation" aria-label="Pagination">
          <button className="page-btn" onClick={()=>go(current-1)} disabled={current===1}>Prev</button>

          {/* show page numbers - for many pages you could shorten, here show all */}
          {Array.from({length: totalPages}).map((_, idx) => {
            const p = idx+1;
            return (
              <button
                key={p}
                className={'page-btn' + (p===current ? ' active' : '')}
                onClick={()=>go(p)}
                aria-current={p===current ? 'page' : undefined}
              >
                {p}
              </button>
            );
          })}

          <button className="page-btn" onClick={()=>go(current+1)} disabled={current===totalPages}>Next</button>
        </div>
      )}
    </div>
  );
}
