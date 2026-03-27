# Charlie PC Mobile App

The mobile app is built with:

- Expo
- React Native
- React Navigation
- React Native Paper

## Current Mobile Roles

### Customer

- browse products
- add items to cart
- checkout customer orders
- create a customer account

### Cashier

- browse counter products
- process cart/payment
- use staff login with cashier security code

### Admin

- view dashboard
- manage products
- review sales
- create cashier/admin staff accounts
- use staff login with admin security code

## Important Auth Rules

- only **customers** can self-register on mobile
- `cashier` and `admin` accounts are issued internally by admin
- `cashier` and `admin` login require:
  - account password
  - role security code

## Setup

```bash
cd mobile
npm install
```

## Run

### Same machine / emulator

```bash
cd mobile
npm run start
```

### Real phone on the same Wi-Fi

Use your Mac’s LAN IP:

```bash
cd mobile
EXPO_PUBLIC_API_URL=http://192.168.1.10:5001 npx expo start --lan -c
```

## API Configuration

Current mobile defaults:

- Android emulator fallback: `http://10.0.2.2:5001`
- default fallback: `http://localhost:5001`

For real devices, always override with `EXPO_PUBLIC_API_URL`.

## Backend Requirement

The backend must be running first:

```bash
cd backend
npm start
```

Expected backend URL:

- `http://localhost:5001`

## Quick Defense Check

Before opening Expo Go, test this on your phone browser:

```text
http://YOUR-MAC-LAN-IP:5001/products
```

If JSON loads, the phone can reach the backend.

## Forgot Password

The mobile app supports:

- requesting a 6-digit reset code
- entering the reset code
- setting a new password

When the forgot-password panel is open, the normal login email/password fields are hidden to keep the flow cleaner.

## Admin Product Management Notes

- category uses the supported catalog list
- product image URL field is removed
- barcode field is removed from the mobile add/edit form
- product photo can be:
  - picked from library
  - taken with camera
  - reset back to category photo

## Admin Staff Management

Admin can now create staff accounts directly in the mobile app:

1. sign in as admin
2. open the `Staff` tab
3. create a `cashier` or `admin` account
4. share credentials securely
5. share the current role security code separately
