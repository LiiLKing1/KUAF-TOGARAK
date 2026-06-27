# KUAF-TOGARAK — Universitet To'garaklari Boshqaruv Tizimi

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-orange?logo=firebase)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)

## Maqsad

KUAF universitetining to'garaklari (qo'shimcha ta'lim) boshqaruv tizimi. Uch xil rol uchun alohida panel:

| Rol | Imkoniyatlar |
|---|---|
| **Admin** | To'garaklar, xonalar, o'qituvchilar, talabalar boshqaruvi |
| **Teacher** | Davomad, baholar, dars jadvali |
| **Student** | To'garaklarga yozilish, jadval va baholarni ko'rish |

## Stack

- **Frontend:** React 18 + Vite (JavaScript/JSX)
- **Backend/DB:** Firebase (Auth, Firestore, Cloud Functions, FCM)
- **UI:** TailwindCSS, Recharts
- **Routing:** React Router DOM v6
- **Forms:** React Hook Form
- **Notifications:** React Hot Toast

## Ishga tushirish

### 1. Klonlash va paketlar

```bash
git clone https://github.com/LiiLKing1/KUAF-TOGARAK.git
cd KUAF-TOGARAK
npm install
```

### 2. Firebase sozlash

```bash
cp .env.example .env
```

`.env` faylini oching va haqiqiy Firebase kalitlarini to'ldiring:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> ⚠️ `.env` hech qachon Git'ga tushmaydi. Kalitlarni xavfsiz kanal orqali almashing.

### 3. Ishga tushirish

```bash
npm run dev
```

Brauzerda `http://localhost:5173` manzilini oching.

## Papka strukturasi

```
src/
  assets/             ← Rasmlar, ikonalar
  components/
    common/           ← Button, Input, Modal, Loader
    layout/           ← Navbar, Sidebar, ProtectedRoute
  context/
    AuthContext.jsx   ← Global auth holati
  firebase/
    config.js         ← Firebase init
    auth.js           ← Login, logout, register
    firestore.js      ← CRUD helper funksiyalar
  pages/
    admin/            ← Admin panel sahifalari
    teacher/          ← O'qituvchi panel sahifalari
    student/          ← Talaba panel sahifalari
    auth/             ← LoginPage, RegisterPage
  hooks/              ← Custom React hooks
  utils/              ← Yordamchi funksiyalar
  App.jsx             ← Routing
  main.jsx            ← Entry point
```

## Hujjatlar

- [Firestore Schema](./firestore-schema.md) — Barcha collection'lar va field'lar

## Ishlab chiquvchilar

- Dev A — Admin moduli
- Dev B — O'qituvchi moduli
- Dev C — Talaba moduli

## Litsenziya

MIT
