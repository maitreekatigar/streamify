# Streamify: Charms, Daily Quiz & Literature News

## Features added
- Star charms are persisted per user in MongoDB.
- Daily five-question language quiz. Each correct answer earns one star charm. Quiz submission is limited to once per India Standard Time calendar day.
- Literature/history news page loads headlines from The Guardian public RSS feeds through the authenticated backend. Feed availability depends on network/publisher access.
- Home page cards and sidebar navigation links to the quiz and news page.

## Install
1. Back up your existing project.
2. Extract this ZIP and copy its `frontend` and `backend` folders over your project, preserving `.env` and credentials.
3. Restart backend and frontend with `npm run dev` in each folder.
4. Open the home page and select Daily Charm Quiz or Literature & News.

## Charm rules currently implemented
- 1 charm per correct answer (maximum 5 from the daily quiz).
- Other activity-based charms (long sessions, translator usage, practice with multiple people) are not auto-awarded yet; doing this reliably requires tracking real activity events and anti-cheat limits.
