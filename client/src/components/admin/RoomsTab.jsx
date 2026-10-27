import { useCallback, useEffect, useState } from 'react';
import api, { assetUrl, errMsg } from '../../api/axios';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';
import { money } from '../../utils';

export default function RoomsTab({ onEdit, onChanged }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => api.get('/rooms')
    .then((r) => setRooms(r.data.rooms))
    .catch((e) => setError(errMsg(e)))
    .finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);

  const remove = async (room) => {
    if (!window.confirm(`Delete room ${room.roomNumber} (${room.type})? Rooms with booking history are archived instead of erased.`)) return;
    setError(''); setNotice('');
    try {
      const r = await api.delete(`/rooms/${room._id}`);
      setNotice(r.data.message);
      await load(); onChanged?.();
    } catch (e) { setError(errMsg(e)); }
  };

  if (loading) return <Loading />;
  return (
    <>
      <ErrorMessage message={notice} variant="success" onClose={() => setNotice('')} />
      <ErrorMessage message={error} onClose={() => setError('')} />
      {rooms.length === 0 ? <div className="rm-panel text-center text-muted">No rooms yet. Use the Add room tab to create the first listing.</div> : (
        <div className="table-responsive rm-panel p-0">
          <table className="table align-middle mb-0 rm-table">
            <thead><tr><th>Photo</th><th>Number</th><th>Type</th><th>Description</th><th>Rent / night</th><th>Count</th><th>Amenities</th><th /></tr></thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r._id}>
                  <td>{r.photos?.[0] ? <img className="rm-thumb" src={assetUrl(r.photos[0])} alt={`Room ${r.roomNumber}`} /> : <span className="text-muted small">None</span>}
                    {r.photos?.length > 1 && <span className="small text-muted ms-1">+{r.photos.length - 1}</span>}</td>
                  <td>{r.roomNumber}</td><td>{r.type}</td>
                  <td className="small" style={{ minWidth: 220 }}>{r.description}</td>
                  <td>{money(r.rent)}</td><td>{r.count}</td>
                  <td className="small">{r.amenities?.join(', ')}</td>
                  <td className="text-nowrap">
                    <button className="btn btn-outline-primary btn-sm me-1" onClick={() => onEdit(r)}>Edit</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
