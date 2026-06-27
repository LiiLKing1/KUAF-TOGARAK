# Firestore Schema — KUAF-TOGARAK

Bu hujjat loyihadagi barcha Firestore collection'larini va ularning field'larini batafsil tavsiflaydi.

---

## 1. `users` (Foydalanuvchilar)

> Firebase Auth UID bilan bir xil doc ID ishlatiladi.

| Field | Turi | Izoh |
|---|---|---|
| `uid` | `string` (doc id) | Firebase Auth UID |
| `fullName` | `string` | To'liq ism va familiya |
| `email` | `string` | Elektron pochta manzili |
| `role` | `"admin" \| "teacher" \| "student"` | Foydalanuvchi roli |
| `phone` | `string \| null` | Telefon raqami |
| `telegramChatId` | `string \| null` | Telegram bot bilan bog'lanish uchun (keyinroq qo'shiladi) |
| `createdAt` | `timestamp` | Ro'yxatdan o'tgan sana |
| `isActive` | `boolean` | Faollik holati |

---

## 2. `courses` (To'garaklar)

| Field | Turi | Izoh |
|---|---|---|
| `id` | `string` (doc id) | Auto-generated |
| `title` | `string` | To'garak nomi |
| `description` | `string` | To'garak tavsifi |
| `subject` | `string` | Fan nomi (matematika, fizika, va h.k.) |
| `teacherId` | `string` | `users.uid` ga reference |
| `teacherName` | `string` | O'qituvchi ismi (tez ko'rsatish uchun denormalized) |
| `roomId` | `string` | `rooms.id` ga reference |
| `roomName` | `string` | Xona nomi (denormalized) |
| `schedule` | `array` | Dars jadvali: `[{ dayOfWeek: number, startTime: string, endTime: string }]` |
| `startDate` | `timestamp` | To'garak boshlanish sanasi |
| `capacity` | `number` | Maksimal o'rin soni |
| `enrolledCount` | `number` | Hozirgi ro'yxatdan o'tganlar soni |
| `isActive` | `boolean` | To'garakni aktiv/yopilgan holati |
| `createdAt` | `timestamp` | Yaratilgan sana |

### `schedule` array elementi:
```json
{
  "dayOfWeek": 1,       // 0=Yakshanba, 1=Dushanba, ..., 6=Shanba
  "startTime": "14:00", // "HH:MM" format
  "endTime": "16:00"    // "HH:MM" format
}
```

---

## 3. `rooms` (Xonalar)

| Field | Turi | Izoh |
|---|---|---|
| `id` | `string` (doc id) | Auto-generated |
| `name` | `string` | Xona nomi, masalan `"204-xona"` |
| `building` | `string` | Bino nomi, masalan `"A-bino"` |
| `capacity` | `number` | Xona sig'imi (o'rindiqlar soni) |

---

## 4. `enrollments` (Talaba–kurs bog'lanishi)

| Field | Turi | Izoh |
|---|---|---|
| `id` | `string` (doc id) | Auto-generated |
| `studentId` | `string` | `users.uid` ga reference (talaba) |
| `courseId` | `string` | `courses.id` ga reference |
| `enrolledAt` | `timestamp` | Ro'yxatdan o'tgan sana |
| `attendance` | `array` | Davomat yozuvlari |
| `grades` | `array` | Baholar ro'yxati |

### `attendance` array elementi:
```json
{
  "date": "<timestamp>",
  "status": "present" | "absent" | "late"
}
```

### `grades` array elementi:
```json
{
  "date": "<timestamp>",
  "grade": 85,
  "comment": "Yaxshi ish!"
}
```

---

## 5. `notifications` (Yuborilgan bildirishnomalar log)

| Field | Turi | Izoh |
|---|---|---|
| `id` | `string` (doc id) | Auto-generated |
| `courseId` | `string` | Qaysi kursga tegishli |
| `type` | `"email" \| "telegram" \| "sms" \| "app" \| "instagram"` | Bildirishnoma turi |
| `sentAt` | `timestamp` | Yuborilgan vaqt |
| `recipientIds` | `array of string` | Qabul qiluvchilar `users.uid` ro'yxati |

---

## 6. `userNotifications` (In-app bildirishnomalar)

| Field | Turi | Izoh |
|---|---|---|
| `id` | `string` (doc id) | Auto-generated |
| `userId` | `string` | `users.uid` ga reference |
| `title` | `string` | Bildirishnoma sarlavhasi |
| `body` | `string` | Bildirishnoma matni |
| `courseId` | `string \| null` | Bog'liq kurs (ixtiyoriy) |
| `read` | `boolean` | O'qilgan/o'qilmagan holati |
| `createdAt` | `timestamp` | Yaratilgan vaqt |

---

## Collection munosabatlari (Entity Relationship)

```
users (1) ──────────── (N) enrollments (N) ──── (1) courses
  │                                                    │
  │ (teacher)                                          │
  └──────────────────────────────── teacherId ─────────┘
                                                       │
                                                rooms (1)
```

---

## Firestore Rules xulasasi

| Collection | O'qish | Yozish |
|---|---|---|
| `users` | O'zi yoki admin | O'zi yoki admin |
| `courses` | Barcha authenticated | Admin va o'sha kursning teacherId'si |
| `enrollments` | Student o'ziniki, teacher o'z kursi, admin hammasi | Admin va teacher |
| `rooms` | Barcha authenticated | Faqat admin |
| `notifications` | Admin va teacher | Admin va teacher |
| `userNotifications` | Faqat o'zi | Admin va server |
