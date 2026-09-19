const CATEGORY_TAB_CLASS = {
  Coding: 'tab-coding',
  Writing: 'tab-writing',
  Research: 'tab-research',
  Other: 'tab-other',
};

export default function CapsuleList({ capsules, onEdit, onDelete }) {
  if (!capsules.length) {
    return (
      <div className="empty-state">
        <p>No capsules yet.</p>
        <p className="empty-hint">Add your first prompt above to start your archive.</p>
      </div>
    );
  }

  return (
    <div className="capsule-list">
      {capsules.map((c) => (
        <article
          className={`capsule-card ${CATEGORY_TAB_CLASS[c.category] || 'tab-other'}`}
          key={c.id}
        >
          <div className="capsule-header">
            <h3>{c.prompt_title}</h3>
            <span className="version-badge">{c.prompt_version || '—'}</span>
          </div>

          <p className="capsule-meta">
            {c.project_name}
            {c.category ? ` · ${c.category}` : ''}
            {c.usefulness ? ` · ${c.usefulness}` : ''}
          </p>

          <p className="capsule-text">{c.prompt_text}</p>

          {c.response_summary && (
            <p className="capsule-summary">
              <span className="capsule-summary-label">Response</span>
              {c.response_summary}
            </p>
          )}

          <div className="capsule-flags">
            <span className={c.reviewed ? 'flag flag-on' : 'flag'}>
              {c.reviewed ? 'Reviewed' : 'Not reviewed'}
            </span>
            <span className={c.improved ? 'flag flag-on' : 'flag'}>
              {c.improved ? 'Improved' : 'Not improved'}
            </span>
          </div>

          {c.notes && <p className="capsule-notes">{c.notes}</p>}

          {c.screenshot_url && (
            <a
              className="capsule-link"
              href={c.screenshot_url}
              target="_blank"
              rel="noreferrer"
            >
              View screenshot
            </a>
          )}

          <div className="capsule-actions">
            <button className="btn btn-small btn-ghost" onClick={() => onEdit(c)}>
              Edit
            </button>
            <button
              className="btn btn-small btn-danger"
              onClick={() => onDelete(c.id)}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
