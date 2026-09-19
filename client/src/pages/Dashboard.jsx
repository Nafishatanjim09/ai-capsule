import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import CapsuleForm from '../components/CapsuleForm.jsx';
import CapsuleList from '../components/CapsuleList.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [editingCapsule, setEditingCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await api.me();
        const list = await api.listCapsules();
        if (!cancelled) {
          setUser(me);
          setCapsules(list);
        }
      } catch (err) {
        if (err.status === 401) {
          navigate('/');
        } else {
          setError('Could not load your capsules. Try refreshing the page.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleCreateOrUpdate(form) {
    setError('');
    try {
      if (editingCapsule) {
        const updated = await api.updateCapsule(editingCapsule.id, form);
        setCapsules((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
        setEditingCapsule(null);
      } else {
        const created = await api.createCapsule(form);
        setCapsules((cs) => [created, ...cs]);
      }
    } catch (err) {
      setError(editingCapsule ? 'Could not save your changes.' : 'Could not add this capsule.');
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.deleteCapsule(id);
      setCapsules((cs) => cs.filter((c) => c.id !== id));
      if (editingCapsule && editingCapsule.id === id) setEditingCapsule(null);
    } catch (err) {
      setError('Could not delete this capsule.');
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      navigate('/');
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="loading">Loading your archive…</p>
      </div>
    );
  }

  return (
    <div className="page dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Your archive</p>
          <h1>AI Capsule</h1>
        </div>
        <div className="user-bar">
          {user && <span className="user-name">{user.username}</span>}
          <button className="btn btn-ghost btn-small" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}

      <CapsuleForm
        onSubmit={handleCreateOrUpdate}
        editingCapsule={editingCapsule}
        onCancelEdit={() => setEditingCapsule(null)}
      />

      <div className="section-divider">
        <h2>Capsules on file</h2>
        <span className="count-badge">{capsules.length}</span>
      </div>

      <CapsuleList capsules={capsules} onEdit={setEditingCapsule} onDelete={handleDelete} />
    </div>
  );
}
