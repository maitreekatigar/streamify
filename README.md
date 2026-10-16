# Streamify

Real-time language exchange app: accounts, friend requests, online presence, chat, and video calls.

The interface lives at [streamify-topaz-chi.vercel.app](https://streamify-topaz-chi.vercel.app). The API lives on Render. This copy fixes the bugs that stopped that split deployment from keeping a login, plus a few broken screens in the app itself.

## What was broken

- Login and signup set `SameSite=Lax` and `Secure=false`. The browser accepts that cookie on localhost, then drops it when the Vercel site calls the Render API. The login request succeeded and every following request looked logged out.
- Recommended users included password hashes. Onboarding also copied the whole request body onto the user, so a client could overwrite `friends` or `password`.
- "Already friends" compared an ObjectId to a string, so it never matched and another friend request could be sent.
- Opening a call crashed while the Stream token was still loading (`tokenData.token` on `undefined`), and the page could spin forever when chat was not configured.
- The socket URL did `.replace("/api", "")`, which also rewrites a host that starts with `api`.
- Profile save only showed an alert. The Friends page always said there were no recommendations, and its Friend Requests button did nothing.
- A network error on the login or signup form crashed the page.

Chat and video still need a [Stream](https://getstream.io/) API key. Without it, friends, profiles, and requests work, and chat explains that it is not configured.

## Run locally

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The dev server proxies `/api` and Socket.IO to the API, so that is the only address you use.

If `MONGO_URI` is unset, the API uses an in-memory database and the data disappears when the process stops. Copy `backend/.env.example` to `backend/.env` to use your own MongoDB, Stream keys, and `JWT_SECRET_KEY`.

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_STREAM_API_KEY` to the same Stream key. For a production build, also set `VITE_API_URL` to the API origin including `/api`.

```bash
cd backend && npm test
```
