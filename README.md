# Roomly: Hotel Management and Room Booking System

Roomly is a full-stack MERN web application (MongoDB, Express, React, Node.js). Customers browse rooms, check availability for their dates, book through a **demonstration** checkout, view their bookings and cancel eligible ones. Administrators manage room listings, see every booking and view registered users.

> **Honest status.** All source files were written and the date/booking logic unit tests pass (`npm test` in `server/`). The client JSX was syntax-checked. The app itself has **not** been run end to end by the author: the build environment had no network, so `npm install`, MongoDB, `vite build` and the API/UI workflows could not be executed. Follow the checklist in section 17 on your machine and fix anything it turns up.

## 1. Features and roles
- **Visitor:** homepage, room browsing, availability search, about page.
- **Customer:** register, log in, book, mock-pay, view own bookings, cancel (up to 24 h before check-in).
- **Admin:** dashboard statistics; all bookings (search, filter, cancel); all rooms (add, edit, delete/archive, image upload); all users. Admins are created only by the seed script.

## 2. Technology
React 18 + Vite, React Router 6, Axios, Bootstrap 5 (CSS) + custom CSS, react-icons, Context API. Express 4, Mongoose 8, JWT, bcryptjs, Multer, Helmet, express-rate-limit, cors, dotenv, nodemon.

## 3. Architecture
```
React (Axios) -> Express routes + middleware -> controllers -> Mongoose models -> MongoDB
```

## 4. Folder structure
```
Roomly/
├── client/   (Vite + React: src/api, context, components/{common,rooms,routing,admin}, pages)
├── server/   (config, models, controllers, routes, middleware, utils, scripts, test, docs, uploads)
├── .gitignore
└── README.md
```
Differences from the suggested layout: `server/config/env.js` (startup env validation), `utils/availability.js`, `scripts/seedRooms.js`, `components/admin/*`, `client/src/utils.js`.

## 5. Database schema
- **User:** name, email (unique, lowercase), password (bcrypt hash, never returned), phone, role (`customer`|`admin`), timestamps.
- **Room:** roomNumber (unique), type (Single|Double|Deluxe|Suite), description, photos[], rent (>0), count (integer >=1), amenities[], isActive, timestamps.
- **Booking:** roomId→Room, userId→User, guestName, phone, fromDate, toDate, totalDays, totalAmount (server-calculated), status (`booked`|`cancelled`), paymentStatus (`pending`|`paid`|`failed`|`refunded`), paymentReference, cancelledAt, timestamps. Indexes on user, room+status+dates, and status.

No card numbers, CVVs or other payment credentials exist anywhere in the schema or API.

## 6. API (all under `/api`)
| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | /health | Server status | Public |
| POST | /auth/register | Register a customer (role is always `customer`) | Public, rate-limited |
| POST | /auth/login | Log in, returns `{token,user}` | Public, rate-limited |
| GET | /auth/me | Current user | Authenticated |
| GET | /rooms?checkIn&checkOut&type | List rooms; with dates returns only rooms with free units and `availableUnits` | Public |
| GET | /rooms/:id?checkIn&checkOut | Room details (+ `availableUnits` with dates) | Public |
| POST | /rooms | Add room | Admin |
| PUT | /rooms/:id | Update room | Admin |
| DELETE | /rooms/:id | Delete room (see below) | Admin |
| POST | /rooms/upload | Upload up to 5 images (field `photos`) | Admin |
| POST | /bookings | Create booking (`roomId, fromDate, toDate, guestName, phone, paymentOutcome`) | Customer |
| GET | /bookings/my | Own bookings | Customer |
| PATCH | /bookings/:id/cancel | Cancel a booking | Owner or Admin |
| GET | /admin/bookings | All bookings (latest 1000) | Admin |
| GET | /admin/users | All users | Admin |
| GET | /admin/dashboard | Summary statistics | Admin |

Errors are JSON `{ "message": "..." }` with 400/401/403/404/409/402/500 codes. Ready-made requests are in `server/docs/api-requests.http`.

**Booking rules**
- Dates are `YYYY-MM-DD`, interpreted as UTC calendar dates. Check-in may be today or later (UTC date); maximum stay 30 nights.
- `totalDays` = check-out minus check-in. `totalAmount` = nights × the room's rent read from the database. Client totals are ignored.
- An existing booking blocks a stay when `existing.fromDate < requested.toDate AND existing.toDate > requested.fromDate`. Only `booked` bookings count, so cancelled ones free the room.
- A listing is available while overlapping bookings < `count`.
- **Cancellation policy:** customers up to 24 hours before check-in; admins at any time; never twice.
- **Room deletion:** blocked (409) while active future bookings exist; archived (hidden, `isActive:false`) if only past or cancelled history exists; hard-deleted if no bookings ever referenced it.
- Dashboard "Bookings" and "Cancelled" exclude failed-payment attempts.

## 7. Prerequisites
Node.js 18 or newer (22 tested for the unit tests), npm, and MongoDB Community Server or a MongoDB Atlas connection string.

## 8. Installation and run
```bash
# Backend
cd server
npm install
cp .env.example .env          # Windows: copy .env.example .env
# edit .env (see section 9), then:
npm run seed:admin            # creates the admin account
npm run seed:rooms            # optional demo rooms
npm run dev                   # http://localhost:8001

# Frontend (new terminal)
cd client
npm install
cp .env.example .env
npm run dev                   # http://localhost:5173
npm run build                 # production build check
```

## 9. Environment variables
`server/.env`: `PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET` (at least 32 random characters), `JWT_EXPIRES_IN`, `CLIENT_URL` (comma-separate several origins), `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 10 characters, not the example text).
Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
`client/.env`: `VITE_API_URL=http://localhost:8001/api`. Never put secrets in client variables; everything prefixed `VITE_` is public.

## 10. MongoDB setup
Local: install MongoDB Community, make sure the service is running, use `mongodb://127.0.0.1:27017/roomly`. Atlas: create a free cluster, add your IP to the access list, create a database user and paste the connection string into `MONGO_URI`. Compass can inspect the `roomly` database.

## 11. Using the app
1. Open the site, register, log in (customers land on their dashboard, admins on the admin dashboard).
2. Rooms → choose dates → Check availability → Book now.
3. On the booking page confirm dates and guest details, then use the demo checkout.
4. My bookings shows history; Cancel appears only when policy allows.
5. Admin: manage bookings, rooms (Add room tab doubles as Edit), users.

## 12. How the mock checkout works
The browser sends only identifiers, dates, guest contact details and the chosen outcome (`success` or `fail`). The server validates, re-checks availability, creates the booking as `booked`/`pending`, **verifies capacity again** (rolling back if concurrent requests oversold the room), then applies the simulated payment: success → `paid` with a `MOCK-XXXXXXXXXX` reference; failure → status `cancelled`, payment `failed` (inventory released, shown in history). To add a real provider later, replace the "mock payment" block in `bookingController.createBooking` with a sandbox payment-intent flow using the provider's hosted/tokenised fields; never route card data through this API.

## 13. Concurrency limitation
Overbooking is prevented by "insert, then re-count, then roll back if over capacity", which works on a standalone MongoDB. Under heavy simultaneous demand, two competing requests may both be rolled back (a safe but unlucky outcome). For strict guarantees, use a replica set (or Atlas) with multi-document transactions.

## 14. Security notes
bcrypt (cost 12) hashing; JWT verified on every request and the user re-loaded from the database; role checks on every admin route; booking owner taken from the token; prices computed server-side; input type-checked (blocks NoSQL operator injection); login/register rate-limited (20 per 15 minutes per IP); Helmet headers; CORS limited to `CLIENT_URL`; uploads limited to 5 files, 2 MB, JPEG/PNG/WebP, with magic-byte checks and random filenames; error stacks hidden in production.
**Known limitations:** the token is in `localStorage` (as the brief requires; HttpOnly cookies are safer in production); no email verification or password reset; no CSRF concerns because no cookies are used; uploads are stored on local disk; the admin booking list is capped at 1000 and filtered in the browser; amounts are in INR.

## 15. Testing
```bash
cd server && npm test      # 6 unit tests for dates, nights, overlap rule, cancellation policy, id validation
```
Use `server/docs/api-requests.http` for manual API checks.

## 16. Troubleshooting
- *MongoDB connection failed*: start MongoDB or fix `MONGO_URI`; the server exits on purpose.
- *Missing environment variables / JWT_SECRET*: edit `server/.env`.
- *CORS error in browser*: `CLIENT_URL` must match the exact origin (including port) shown by Vite.
- *Cannot reach the Roomly server*: start the API, confirm `VITE_API_URL`, restart `npm run dev` after editing `.env`.
- *Images do not load*: the API must be running; uploads are served from `/uploads`.
- *Seed admin refuses*: use a real password and an email not already registered as a customer.
- *npm test fails on old Node*: use Node 18+.

## 17. Verification checklist (run these yourself)
1. Register; duplicate email is rejected; wrong password is rejected; log in; refresh stays logged in.
2. Register with `"role":"admin"` in the body (see `.http` file): the user is a customer.
3. As customer, `GET /api/admin/users` returns 403.
4. As admin add a room with an image; edit it; it appears on the homepage and Rooms page.
5. Book 2 nights: nights/total match; a second booking beyond `count` for the same dates is refused (409).
6. Failed demo payment: history shows cancelled/failed and the room is still available.
7. Cancel a booking more than 24 h ahead; cancelling again is refused; availability returns.
8. Admin can't delete a room with an upcoming booking; deleting a room with only history archives it.
9. `cd client && npm run build` succeeds.

## 18. Implemented vs optional
Everything in sections 1 to 6 is implemented. Not implemented (optional in the brief): admin role management for users, real payment provider, automated API integration tests.
