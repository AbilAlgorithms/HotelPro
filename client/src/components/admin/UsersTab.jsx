import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';
import { fmtDate } from '../../utils';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/admin/users').then((r) => setUsers(r.data.users)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  const term = q.trim().toLowerCase();
  const shown = users.filter((u) => !term || [u.name, u.email, u.phone, u.role].some((v) => v?.toLowerCase().includes(term)));
  return (
    <>
      <ErrorMessage message={error} />
      <label htmlFor="uq" className="visually-hidden">Search users</label>
      <input id="uq" className="form-control mb-3" style={{ maxWidth: 420 }} placeholder="Search by name, email, phone or role" value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.length === 0 ? <div className="rm-panel text-center text-muted">No users match.</div> : (
        <div className="table-responsive rm-panel p-0">
          <table className="table table-hover mb-0 rm-table">
            <thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Registered</th></tr></thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u._id}><td className="small">{u._id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.phone}</td>
                  <td><span className={`rm-status ${u.role === 'admin' ? 'rm-status-pending' : 'rm-status-booked'}`}>{u.role}</span></td>
                  <td>{fmtDate(u.createdAt)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
