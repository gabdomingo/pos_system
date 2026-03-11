# POS System (React + Node + SQLite)

This project has three active parts:

- `backend` - Node.js + Express + SQLite API
- `frontend` - React (Vite) web app
- `mobile` - React Native (Expo) mobile app with Material Design

## Requirements

- Node.js `20.x` (recommended LTS)
- npm `10+`

Why Node 20: this project uses native `sqlite3` bindings, and newer Node versions (for example v25) can fail to load them.

## 1. Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

## 2. Run the App

### Start Backend

```bash
cd backend
npm start
```

Expected log:

- `Database Connected`
- `Backend running on http://localhost:5000`

### Start Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in terminal (usually `http://localhost:5173`).

### Start Mobile App (React Native + Material Design)

```bash
cd mobile
npm install
npm run start
```

For full mobile setup/config details, see [`mobile/README.md`](mobile/README.md).

## 3. Optional: Seed Sample Data

```bash
cd backend
npm run seed
```

This adds sample products and a cashier account.

To seed or reset only login accounts (admin/cashier/customer):

```bash
cd backend
npm run seed:accounts
```

## Default Accounts

- Admin: `admin@local` / `admin123`
- Customer: `customer@local` / `cust123`
- Cashier (after seeding): `cashier@local` / `cashier123`

## Custom Port Setup

If port `5000` is already in use:

1. Start backend on another port:

```bash
cd backend
PORT=5001 npm start
```

2. Start frontend with matching API URL:

```bash
cd frontend
VITE_API=http://localhost:5001 npm run dev
```

## Troubleshooting

### `Could not locate the bindings file` (sqlite3)

Usually caused by incompatible Node version.

Fix:

1. Switch to Node 20 LTS.
2. Reinstall backend dependencies cleanly:

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### `Permission denied` while deleting `node_modules`

Some files were likely created by a different user/privilege level.

```bash
sudo chown -R "$(whoami)":staff backend/node_modules
sudo chown -R "$(whoami)":staff ~/.npm
```

Then reinstall:

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Backend health check

```bash
curl http://localhost:5000/
```

Expected response:

`POS Backend Running`
