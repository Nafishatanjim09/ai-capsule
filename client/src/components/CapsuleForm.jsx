import { useEffect, useState } from 'react';

const emptyForm = {
  project_name: '',
  prompt_title: '',
  prompt_version: '',
  prompt_text: '',
  response_summary: '',
  category: 'Coding',
  usefulness: 'Good',
  reviewed: false,
  improved: false,
  screenshot_url: '',
  notes: '',
};

export default function CapsuleForm({ onSubmit, editingCapsule, onCancelEdit }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingCapsule) {
      setForm({
        ...emptyForm,
        ...editingCapsule,
        reviewed: !!editingCapsule.reviewed,
        improved: !!editingCapsule.improved,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingCapsule]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
    if (!editingCapsule) setForm(emptyForm);
  }

  return (
    <form className="capsule-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <h2>{editingCapsule ? 'Edit capsule' : 'New capsule'}</h2>
        {editingCapsule && <span className="editing-tag">Editing #{editingCapsule.id}</span>}
      </div>

      <div className="form-row">
        <label>
          Project name
          <input
            name="project_name"
            value={form.project_name}
            onChange={handleChange}
            placeholder="SmartFarm Irrigation"
            required
          />
        </label>
        <label>
          Prompt title
          <input
            name="prompt_title"
            value={form.prompt_title}
            onChange={handleChange}
            placeholder="Debug cloud deployment"
            required
          />
        </label>
      </div>

      <div className="form-row form-row-thirds">
        <label>
          Version
          <input
            name="prompt_version"
            value={form.prompt_version || ''}
            onChange={handleChange}
            placeholder="v1"
          />
        </label>
        <label>
          Category
          <select name="category" value={form.category || ''} onChange={handleChange}>
            <option>Coding</option>
            <option>Writing</option>
            <option>Research</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Usefulness
          <select name="usefulness" value={form.usefulness || ''} onChange={handleChange}>
            <option>Good</option>
            <option>Needs Improvement</option>
          </select>
        </label>
      </div>

      <label>
        Prompt text
        <textarea
          name="prompt_text"
          value={form.prompt_text}
          onChange={handleChange}
          placeholder="Why does my Node server fail on Render?"
          rows={3}
          required
        />
      </label>

      <label>
        Response summary
        <textarea
          name="response_summary"
          value={form.response_summary || ''}
          onChange={handleChange}
          placeholder="Check the start command and bound port"
          rows={2}
        />
      </label>

      <div className="form-row">
        <label className="checkbox">
          <input
            type="checkbox"
            name="reviewed"
            checked={!!form.reviewed}
            onChange={handleChange}
          />
          Reviewed
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            name="improved"
            checked={!!form.improved}
            onChange={handleChange}
          />
          Improved
        </label>
      </div>

      <label>
        Screenshot URL (optional)
        <input
          name="screenshot_url"
          value={form.screenshot_url || ''}
          onChange={handleChange}
          placeholder="https://..."
        />
      </label>

      <label>
        Notes
        <textarea
          name="notes"
          value={form.notes || ''}
          onChange={handleChange}
          placeholder="Tested and worked"
          rows={2}
        />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {editingCapsule ? 'Save changes' : 'Add capsule'}
        </button>
        {editingCapsule && (
          <button type="button" className="btn btn-ghost" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
