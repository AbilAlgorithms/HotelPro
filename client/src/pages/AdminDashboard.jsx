import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BookingsTab from '../components/admin/BookingsTab';
import RoomsTab from '../components/admin/RoomsTab';
import RoomForm from '../components/admin/RoomForm';
import UsersTab from '../components/admin/UsersTab';
import ErrorMessage from '../components/common/ErrorMessage';

const TABS = [
  { id: 'bookings', label: 'All bookings' },
  { id: 'rooms', label: 'All rooms' },
  { id: 'add', label: 'Add room' },
  { id: 'users', label: 'All users' },
];
const CARDS = [
  ['totalRooms', 'Room listings'], ['totalCustomers', 'Customers'], ['totalBookings', 'Bookings'],
  ['activeBookings', 'Active'], ['cancelledBookings', 'Cancelled'],
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('bookings');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [version, setVersion] = useState(0); // bump to remount tabs after data changes

  const loadStats = useCallback(() => api.get('/admin/dashboard').then((r) => setStats(r.data.stats)).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { loadStats(); }, [loadStats]);

  const changed = () => loadStats();
  const goto = (id) => { setTab(id); setNotice(''); if (id !== 'add') setEditing(null); };
  const edit = (room) => { setEditing(room); setTab('add'); setNotice(''); };
  const saved = (room, wasEdit) => {
    setNotice(wasEdit ? `Room ${room.roomNumber} updated.` : `Room ${room.roomNumber} added.`);
    setEditing(null); setVersion((v) => v + 1); loadStats();
    if (wasEdit) setTab('rooms');
  };

  return (
    <div className="container py-4">
      <h1 className="h2">Admin dashboard</h1>
      <p className="text-muted">Signed in as {user.name}.</p>
      <ErrorMessage message={error} onClose={() => setError('')} />
      <div className="row g-3 mb-4">
        {CARDS.map(([key, label]) => (
          <div className="col-6 col-md-4 col-lg" key={key}><div className="rm-stat"><strong>{stats ? stats[key] : '–'}</strong>{label}</div></div>
        ))}
      </div>
      <ul className="nav rm-tabs border-bottom mb-3 flex-nowrap overflow-auto" role="tablist">
        {TABS.map((t) => (
          <li className="nav-item" key={t.id}>
            <button role="tab" aria-selected={tab === t.id} className={`nav-link text-nowrap ${tab === t.id ? 'active' : ''}`} onClick={() => goto(t.id)}>{t.label}</button>
          </li>
        ))}
      </ul>
      <ErrorMessage message={notice} variant="success" onClose={() => setNotice('')} />
      {tab === 'bookings' && <BookingsTab key={`b${version}`} onChanged={changed} />}
      {tab === 'rooms' && <RoomsTab key={`r${version}`} onEdit={edit} onChanged={changed} />}
      {tab === 'add' && <RoomForm room={editing} onSaved={saved} onCancel={() => { setEditing(null); setTab('rooms'); }} />}
      {tab === 'users' && <UsersTab />}
    </div>
  );
}
