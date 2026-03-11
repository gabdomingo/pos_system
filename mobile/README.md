# POS Mobile App (React Native + Material Design)

This folder contains the mobile app version of the POS system using:

- React Native (Expo)
- React Navigation
- React Native Paper (Material Design)

## Features

- Login and register
- Role-based navigation
  - Admin: Dashboard, Products, Sales, Profile
  - Customer/Cashier: Shop, Cart, Profile
- Product listing and search
- Cart and checkout
- Admin product CRUD
- Admin sales list + detail

## Prerequisites

- Node.js 20.x (recommended)
- Expo CLI (via `npx expo` is fine)

## Setup

```bash
cd mobile
npm install
```

## Run

```bash
cd mobile
npm run start
```

Then press:

- `a` for Android emulator
- `i` for iOS simulator
- or scan QR on a real device using Expo Go

## Backend API URL

By default, the app uses:

- iOS: `http://localhost:5000`
- Android emulator: `http://10.0.2.2:5000`

To override API URL:

```bash
EXPO_PUBLIC_API_URL=http://localhost:5001 npm run start
```

For real devices, use your machine LAN IP:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:5001 npm run start
```

## Backend must be running

From project root:

```bash
cd backend
PORT=5000 npm start
```

If port 5000 is used:

```bash
cd backend
PORT=5001 npm start
```

And start mobile app with matching `EXPO_PUBLIC_API_URL`.
