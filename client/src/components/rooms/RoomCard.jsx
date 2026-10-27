import { assetUrl } from '../../api/axios';
import { money } from '../../utils';

export default function RoomCard({ room, nights, onBook }) {
  const img = assetUrl(room.photos?.[0]);
  return (
    <article className="card rm-card h-100">
      {img ? (
        <img src={img} className="rm-card-img" alt={`${room.type} room`} loading="lazy" />
      ) : (
        <div className="rm-card-img rm-img-empty">No photo yet</div>
      )}
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h3 className="h5 mb-1">{room.type} room</h3>
          <div className="text-end">
            <div className="rm-price">{money(room.rent)}</div>
            <div className="small text-muted">per night</div>
          </div>
        </div>
        <p className="text-muted small flex-grow-1 mb-2">{room.description}</p>
        <div className="d-flex flex-wrap gap-1 mb-3">
          {room.amenities?.map((a) => <span key={a} className="badge rm-badge">{a}</span>)}
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span className="small text-muted">
            {room.availableUnits != null ? `${room.availableUnits} left for your dates${nights ? ` · ${money(room.rent * nights)} for ${nights} night${nights > 1 ? 's' : ''}` : ''}` : `${room.count} rooms of this type`}
          </span>
          <button className="btn btn-primary" onClick={() => onBook(room)}>Book now</button>
        </div>
      </div>
    </article>
  );
}
