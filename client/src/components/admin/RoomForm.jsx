import { useEffect, useState } from 'react';
import api, { assetUrl, errMsg } from '../../api/axios';
import ErrorMessage from '../common/ErrorMessage';

const TYPES = ['Single', 'Double', 'Deluxe', 'Suite'];
const MAX_BYTES = 2 * 1024 * 1024;
const blank = { roomNumber: '', type: 'Single', description: '', rent: '', count: 1, amenities: '' };

// Used for both "Add room" and "Edit room" (when `room` is supplied).
export default function RoomForm({ room, onSaved, onCancel }) {
  const [form, setForm] = useState(blank);
  const [photos, setPhotos] = useState([]);   // already-saved paths
  const [files, setFiles] = useState([]);     // new File objects
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (room) {
      setForm({ roomNumber: room.roomNumber, type: room.type, description: room.description, rent: room.rent, count: room.count, amenities: (room.amenities || []).join(', ') });
      setPhotos(room.photos || []);
    } else { setForm(blank); setPhotos([]); }
    setFiles([]); setError('');
  }, [room]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pick = (e) => {
    const chosen = Array.from(e.target.files);
    e.target.value = '';
    if (photos.length + chosen.length > 5) return setError('A room can have at most 5 photos.');
    const bad = chosen.find((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > MAX_BYTES);
    if (bad) return setError(`"${bad.name}" must be a JPEG, PNG or WebP image under 2 MB.`);
    setError(''); setFiles(chosen);
  };

  const validate = () => {
    if (!form.roomNumber.trim()) return 'Enter a room number.';
    if (form.description.trim().length < 10) return 'The description needs at least 10 characters.';
    if (!(Number(form.rent) > 0)) return 'Rent per night must be greater than 0.';
    if (!Number.isInteger(Number(form.count)) || Number(form.count) < 1) return 'Inventory count must be a whole number of at least 1.';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    setBusy(true); setError('');
    try {
      let all = [...photos];
      if (files.length) {
        const fd = new FormData();
        files.forEach((f) => fd.append('photos', f));
        const up = await api.post('/rooms/upload', fd); // multipart boundary is set by the browser
        all = [...all, ...up.data.photos];
      }
      const body = { ...form, rent: Number(form.rent), count: Number(form.count), amenities: form.amenities, photos: all };
      const res = room ? await api.put(`/rooms/${room._id}`, body) : await api.post('/rooms', body);
      onSaved(res.data.room, !!room);
      if (!room) { setForm(blank); setPhotos([]); setFiles([]); }
    } catch (err) {
      setError(errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <form className="rm-panel" onSubmit={submit} noValidate>
      <h2 className="h5 mb-3">{room ? `Edit room ${room.roomNumber}` : 'Add a room'}</h2>
      <ErrorMessage message={error} onClose={() => setError('')} />
      <div className="row g-3">
        <div className="col-md-4"><label htmlFor="rf-num" className="form-label">Room number</label><input id="rf-num" className="form-control" value={form.roomNumber} onChange={set('roomNumber')} /></div>
        <div className="col-md-4"><label htmlFor="rf-type" className="form-label">Room type</label>
          <select id="rf-type" className="form-select" value={form.type} onChange={set('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div className="col-md-2"><label htmlFor="rf-rent" className="form-label">Rent / night (₹)</label><input id="rf-rent" type="number" min="1" step="1" className="form-control" value={form.rent} onChange={set('rent')} /></div>
        <div className="col-md-2"><label htmlFor="rf-count" className="form-label">Inventory count</label><input id="rf-count" type="number" min="1" step="1" className="form-control" value={form.count} onChange={set('count')} /></div>
        <div className="col-12"><label htmlFor="rf-desc" className="form-label">Description</label><textarea id="rf-desc" rows="3" className="form-control" value={form.description} onChange={set('description')} /></div>
        <div className="col-12"><label htmlFor="rf-am" className="form-label">Amenities</label><input id="rf-am" className="form-control" placeholder="Wi-Fi, Air conditioning, Breakfast" value={form.amenities} onChange={set('amenities')} /><div className="form-text">Separate with commas.</div></div>
        <div className="col-12">
          <label htmlFor="rf-photos" className="form-label">Photos</label>
          <input id="rf-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="form-control" onChange={pick} />
          <div className="form-text">Up to 5 images (JPEG, PNG or WebP, 2 MB each).</div>
          <div className="d-flex flex-wrap gap-2 mt-2">
            {photos.map((p) => (
              <div key={p} className="position-relative">
                <img className="rm-thumb" style={{ width: 96, height: 68 }} src={assetUrl(p)} alt="Saved room" />
                <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 py-0 px-1" aria-label="Remove photo" onClick={() => setPhotos(photos.filter((x) => x !== p))}>×</button>
              </div>
            ))}
            {previews.map((u, i) => <img key={u} className="rm-thumb" style={{ width: 96, height: 68 }} src={u} alt={`New upload ${i + 1}`} />)}
          </div>
        </div>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : room ? 'Save changes' : 'Add room'}</button>
        {room && <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancel editing</button>}
      </div>
    </form>
  );
}
