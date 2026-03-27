# Charlie PC POS System

Charlie PC is a multi-platform point-of-sale and inventory system with:

- a **Node + Express + SQLite** backend
- a **React + Vite** web app
- a **React Native + Expo** mobile app

The current version supports customer shopping, cashier checkout, admin inventory/sales management, admin-issued staff accounts, and secured password reset flows.

## Project Structure

- `backend` – API, authentication, product catalog, sales, reports, SQLite database
- `frontend` – web app for customer and admin workflows
- `mobile` – Expo app for customer, cashier, and admin workflows
- `docs` – flowcharts, diagrams, and defense materials

## Core Features

### Authentication and Security

- role-based login for `customer`, `cashier`, and `admin`
- extra **security code** required for `cashier` and `admin` login
- forgot-password flow with:
  - 6-digit reset codes
  - password reset expiry
  - real SMTP email delivery when configured
  - dev fallback preview code when SMTP is not configured
- customer-only self-registration
- admin-only staff account creation for `cashier` and `admin`
- basic failed-login throttling on the backend

### Catalog and Product Management

- seeded demo catalog with **5 products per category**
- all seeded products include photos
- supported categories include:
  - `Processor`
  - `Motherboard`
  - `Graphics Card`
  - `Memory`
  - `SSD`
  - `Power Supply`
  - `PC Case`
  - `Laptops`
  - `Accessories`
  - `Monitor`
- products without photos are removed from the visible catalog
- category-based fallback product images
- custom product photo selection in admin forms

### Mobile App

- customer storefront
- cashier cart and payment flow
- admin dashboard, product management, sales review, and staff account creation
- customer-only account creation on mobile
- cleaner mobile login/forgot-password flow

### Web App

- customer browsing and shopping flow
- admin product management
- category dropdown in product forms
- photo picker workflow in product forms
- improved login and forgot-password flow

## Requirements

- Node.js `20.x`
- npm `10+`

Node 20 is recommended because the project uses native `sqlite3` bindings.

## Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

### Mobile

```bash
cd mobile
npm install
```

## Running the System

### 1. Start the Backend

```bash
cd backend
npm start
```

Default backend port:

- `http://localhost:5001`

Expected log:

- `Database Connected`
- `Backend running on http://localhost:5001`

### 2. Start the Web App

```bash
cd frontend
npm run dev
```

Default web app URL:

- `http://localhost:5173`

The web app uses:

- `VITE_API=http://localhost:5001` by default

To override it:

```bash
cd frontend
VITE_API=http://localhost:5001 npm run dev
```

### 3. Start the Mobile App

```bash
cd mobile
npx expo start --lan -c
```

For real devices, always point Expo to your Mac's LAN IP:

```bash
cd mobile
EXPO_PUBLIC_API_URL=http://192.168.1.10:5001 npx expo start --lan -c
```

Mobile fallback behavior:

- Android emulator: `http://10.0.2.2:5001`
- iOS/web/dev fallback: `http://localhost:5001`

For full mobile details, see [mobile/README.md](/Users/celmargalindez/GABRIEL%20DOMINGO/pos_system/mobile/README.md).

## Seed Data

### Full Demo Seed

```bash
cd backend
npm run seed
```

This seeds:

- demo accounts
- demo products
- category photos
- cleanup of stale or photo-less demo products

### Account Seed Only

```bash
cd backend
npm run seed:accounts
```

## Demo Accounts

These are the seeded demo accounts:

- Admin: `admin@charliepc.ph` / `admin123`
- Cashier: `cashier@charliepc.ph` / `cashier123`
- Cashier 2: `claire@charliepc.ph` / `claire123`
- Customer: `customer@charliepc.ph` / `cust123`
- Demo Customer: `gabriel@charliepc.ph` / `gabriel123`
- Demo Customer 2: `carl@charliepc.ph` / `carl12345`

### Default Staff Security Codes

- Admin code: `CP-ADMIN-2468`
- Cashier code: `CP-CASH-1357`

For real deployments, set these through environment variables:

- `ADMIN_SECURITY_CODE`
- `CASHIER_SECURITY_CODE`

## Staff Account Creation

Staff accounts do **not** need manual database insertion anymore.

Current flow:

1. Sign in as `admin`
2. Open the **Staff** tab in the mobile admin app
3. Create a `cashier` or `admin` account
4. Share the email/password securely
5. Share the role security code separately

Customer self-registration remains available.

## Forgot Password / Email Delivery

Forgot-password is now backed by a reset-code workflow.

### In development

If SMTP is not configured, the API returns a preview reset code for testing/demo purposes.

### For real email delivery

Create a backend environment file using [backend/.env.example](/Users/celmargalindez/GABRIEL%20DOMINGO/pos_system/backend/.env.example) and configure:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

Example:

```env
PORT=5001
JWT_SECRET=change-me-before-production
ADMIN_SECURITY_CODE=CP-ADMIN-2468
CASHIER_SECURITY_CODE=CP-CASH-1357
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
MAIL_FROM="Charlie PC Store <your-email@example.com>"
```

Restart the backend after changing env values.

## Product Management Notes

### Web

- category field is now a dropdown
- image URL input was removed
- photo is chosen through the UI

### Mobile Admin

- image URL field was removed
- barcode field was removed from the mobile admin form
- custom photo can be chosen from library or camera
- if no custom image is set, the system uses the category photo

### Cashier Mobile

- cashier no longer has a manage-products screen
- cashier stays focused on product browsing and payment flow

## Verification Commands

### Backend health check

```bash
curl http://localhost:5001/
```

Expected response:

`Charlie PC Backend Running`

### Product endpoint check

```bash
curl http://localhost:5001/products
```

### Mobile device LAN check

Open this on your phone browser before using Expo Go:

```text
http://YOUR-MAC-LAN-IP:5001/products
```

If JSON loads on the phone, the backend is reachable for the app.

## Troubleshooting

### `sqlite3` binding errors

Usually caused by an incompatible Node version.

Fix:

1. switch to Node 20
2. reinstall backend dependencies

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Expo mobile says `load failed`

Usually caused by the wrong backend URL or LAN IP.

Fix:

1. make sure backend is running on `5001`
2. confirm phone and laptop are on the same Wi-Fi
3. start Expo with your current LAN IP

```bash
cd mobile
EXPO_PUBLIC_API_URL=http://YOUR-MAC-LAN-IP:5001 npx expo start --lan -c
```

### Web login says `load failed`

Make sure the backend is running on `5001`.

If needed:

```bash
cd frontend
VITE_API=http://localhost:5001 npm run dev
```

### Password reset email is not sent

If reset requests work but no real email arrives:

- check SMTP variables in the backend environment
- verify the SMTP account/app password
- restart the backend

If SMTP is missing in development, the API will still return a preview code for demo/testing.

## Additional Docs

- Mobile setup: [mobile/README.md](/Users/celmargalindez/GABRIEL%20DOMINGO/pos_system/mobile/README.md)
- Updated flowcharts and diagrams: [docs](/Users/celmargalindez/GABRIEL%20DOMINGO/pos_system/docs)
