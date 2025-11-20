import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJSON, postJSON } from '../api';
import { getToken } from '../auth';

export default function TutorialPlayer() {
  const { id } = useParams(); // may be id or slug
  const [tut, setTut] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({}); // { stepIndex: true }
  const [saving, setSaving] = useState({}); // { stepIndex: boolean }
  const token = getToken();
  const nav = useNavigate();

  useEffect(() => {
    if (!id) return;

    (async () => {
      // 1) Try fetch tutorial by id/slug
      let tutorial = await getJSON('/tutorials/' + id, token);
      if (tutorial && tutorial.__unauthorized) {
        alert('Please sign in.');
        nav('/login');
        return;
      }

      // 2) Fallback: fetch list and try match by id or slug
      if (!tutorial || tutorial.error) {
        const list = await getJSON('/tutorials', token);
        if (Array.isArray(list)) {
          const found = list.find(x => String(x.id) === String(id) || String(x.slug) === String(id));
          if (found) {
            tutorial = await getJSON('/tutorials/' + found.id, token);
            if (tutorial && tutorial.__unauthorized) {
              alert('Please sign in.');
              nav('/login');
              return;
            }
          }
        }
      }

      if (!tutorial || tutorial.error) {
        console.error('Tutorial fetch error', tutorial);
        setTut(null);
        return;
      }

      setTut(tutorial);

      // 3) Fetch saved progress for this tutorial (auth required)
      if (token) {
        // endpoint must return { tutorial_id, completed: [stepIndex,...] }
        const prog = await getJSON('/tutorials/' + tutorial.id + '/progress', token);
        if (prog && prog.__unauthorized) {
          // token invalid - ask to login
          alert('Session expired. Please sign in again.');
          nav('/login');
          return;
        }
        if (prog && Array.isArray(prog.completed)) {
          const map = {};
          prog.completed.forEach(si => (map[si] = true));
          setCompletedSteps(map);
        }
      }
    })();
    // re-run when id changes
  }, [id, token, nav]);

  async function markCompleted(stepIndex) {
    if (!tut) return;
    if (!token) {
      alert('Please sign in to save progress.');
      nav('/login');
      return;
    }

    // Avoid duplicate saves
    if (saving[stepIndex]) return;

    // Optimistic UI update
    setCompletedSteps(prev => ({ ...prev, [stepIndex]: true }));
    setSaving(prev => ({ ...prev, [stepIndex]: true }));

    const res = await postJSON('/tutorials/' + tut.id + '/progress', { step_index: stepIndex, completed: true }, token);

    setSaving(prev => ({ ...prev, [stepIndex]: false }));

    if (res && res.__unauthorized) {
      alert('Session expired. Please sign in again.');
      // revert
      setCompletedSteps(prev => {
        const copy = { ...prev };
        delete copy[stepIndex];
        return copy;
      });
      nav('/login');
      return;
    }

    if (res && (res.ok || res.inserted || res.updated)) {
      // saved successfully; leave optimistic UI as-is.
      return;
    }

    // on error, revert and show message
    setCompletedSteps(prev => {
      const copy = { ...prev };
      delete copy[stepIndex];
      return copy;
    });

    alert(res && (res.error || res.__networkError || res.__parseError) ? (res.error || res.__networkError || 'Save failed') : 'Could not save progress. Try again.');
  }

  if (!tut) return <div className="large-card">Loading lesson...</div>;

  return (
    <div>
      <div className="large-card">
        <div style={{ fontWeight: 700 }}>{tut.title}</div>
        <div className="small-muted" style={{ marginTop: 6 }}>{tut.summary}</div>
      </div>

      <div style={{ marginTop: 10 }} className="space-y-2">
        {tut.steps && tut.steps.length > 0 ? (
          tut.steps.map(s => {
            const isDone = !!completedSteps[s.step_index];
            const isSaving = !!saving[s.step_index];
            return (
              <div key={s.id} className="large-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Step {s.step_index}:</strong> {s.title}
                  </div>
                  <div>
                    <button
                      className={isDone ? 'btn-complete' : 'btn-ghost'}
                      onClick={() => markCompleted(s.step_index)}
                      disabled={isDone || isSaving}
                      aria-pressed={isDone}
                      title={isDone ? 'Completed' : isSaving ? 'Saving...' : 'Mark this step as done'}
                    >
                      {isDone ? 'Done' : (isSaving ? 'Saving...' : 'Mark Done')}
                    </button>
                  </div>
                </div>
                <p className="small-muted" style={{ marginTop: 8 }}>{s.content}</p>
              </div>
            );
          })
        ) : (
          <div className="large-card">No steps found for this lesson.</div>
        )}
      </div>
    </div>
  );
}
