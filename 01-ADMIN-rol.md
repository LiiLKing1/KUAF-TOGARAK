
# 01 — ADMIN ROLI (Dev A)

**Branch:** `feature/admin-module`
**Oldindan tayyor bo'lishi shart:** `00-FUNDAMENT-umumiy.md` to'liq bajarilgan bo'lishi kerak (Auth, routing, Firestore Rules ishlayotgan bo'lishi shart).

> Quyidagi bosqichlarni **ketma-ket** bajaring. Har bir bosqich tugagach, "Qabul qilish mezonlari" to'liq ✅ bo'lmaguncha keyingisiga o'tmang.

---

## A1 — Admin Layout va Dashboard skeleti

### AI Coderga prompt:

```
Men admin paneli ustida ishlayman. Loyiha allaqachon mavjud (React + Firebase,
AuthContext va ProtectedRoute tayyor, /admin/* route'lari himoyalangan).
Branch: feature/admin-module. Avval `git pull origin main` qil.

Quyidagilarni bajar:

1. src/pages/admin/AdminLayout.jsx — sidebar bilan layout komponenti:
   - Sidebar linklari: Dashboard, Kurslar, O'qituvchilar, Xonalar, Talabalar
   - Yuqorida: "Salom, [admin ismi]" va "Chiqish" tugmasi
   - <Outlet /> orqali ichki sahifalar render qilinadi
   - Mobil uchun sidebar collapse/hamburger menu qo'sh

2. src/App.jsx ga /admin/* ostida nested route'larni qo'sh:
   /admin/dashboard
   /admin/courses
   /admin/teachers
   /admin/rooms
   /admin/students
   Hammasi AdminLayout ichida render qilinsin.

3. src/pages/admin/DashboardPage.jsx — hozircha vaqtinchalik:
   - 4 ta statistika kartasi (joy-holder raqamlar bilan): Jami kurslar,
     Jami talabalar, Jami o'qituvchilar, Faol to'garaklar
   - Bu raqamlar keyingi bosqichda haqiqiy Firestore ma'lumotlari bilan
     to'ldiriladi, hozircha 0 yoki statik son ko'rsatilsin

4. Qolgan sahifalar (CoursesPage, TeachersPage, RoomsPage, StudentsPage)
   uchun hozircha faqat sarlavha bilan bo'sh placeholder komponentlar yarat
   — bular keyingi bosqichlarda to'ldiriladi.

5. Test qil: admin sifatida login qil, sidebar orqali har bir sahifaga
   o'tib ko'r, hammasi ochilishini tekshir.

6. Commit: "A1: Admin layout va routing skeleti" va branch'ga push qil.
```

### Qabul qilish mezonlari:
- [ ] Admin login qilgandan keyin sidebar ko'rinadi
- [ ] Har bir sidebar link mos sahifaga olib boradi
- [ ] Mobilda sidebar to'g'ri ishlaydi (hamburger menu)
- [ ] Console'da xato yo'q

---

## A2 — Xonalarni boshqarish (Rooms CRUD)

### AI Coderga prompt:

```
Endi admin panelida xonalarni boshqarish funksiyasini qo'shamiz.

1. src/firebase/firestore.js ga umumiy CRUD helper funksiyalar qo'sh (agar
   hali yo'q bo'lsa): addDocument(collectionName, data), getDocuments
   (collectionName), updateDocument(collectionName, id, data),
   deleteDocument(collectionName, id) — bularni keyingi barcha bosqichlarda
   qayta ishlatamiz.

2. src/pages/admin/RoomsPage.jsx to'liq yoz:
   - Xonalar ro'yxati jadval ko'rinishida: nomi, bino, sig'imi, amallar
     (tahrirlash/o'chirish tugmalari)
   - Yuqorida "Yangi xona qo'shish" tugmasi — bosilganda modal ochiladi
   - Modal formasi: xona nomi (masalan "204-xona"), bino nomi, sig'im
     (number input), react-hook-form orqali validatsiya bilan
   - Saqlash bosilganda Firestore "rooms" collection'iga yangi document
     qo'shiladi, modal yopiladi, ro'yxat avtomatik yangilanadi (onSnapshot
     real-time orqali yoki qayta fetch qilib)
   - "Tahrirlash" bosilganda xuddi shu modal, lekin mavjud ma'lumotlar
     bilan to'ldirilgan holda ochiladi, saqlash esa updateDocument chaqiradi
   - "O'chirish" bosilganda tasdiqlash modal chiqadi ("Rostdan ham
     o'chirmoqchimisiz?"), tasdiqlansa deleteDocument chaqiriladi
   - Har bir amaldan keyin react-hot-toast orqali muvaffaqiyat/xato xabari

3. Bo'sh holat: agar xonalar ro'yxati bo'sh bo'lsa, "Hozircha xonalar
   qo'shilmagan" deb chiroyli xabar ko'rsat.

4. Test qil: yangi xona qo'sh, tahrirla, o'chir — hammasi to'g'ri
   Firestore Console'da ham ko'rinishini tekshir.

5. Commit: "A2: Rooms CRUD" va push qil.
```

### Qabul qilish mezonlari:
- [ ] Yangi xona qo'shish ishlaydi
- [ ] Tahrirlash mavjud ma'lumotlarni to'g'ri ko'rsatadi va saqlaydi
- [ ] O'chirish tasdiqlash bilan ishlaydi
- [ ] Bo'sh holat va xato holatlari to'g'ri ko'rsatiladi

---

## A3 — O'qituvchilarni boshqarish (Cloud Function orqali)

> Bu bosqich Firebase Cloud Functions talab qiladi, chunki yangi foydalanuvchi yaratish (Auth + Firestore) faqat Admin SDK orqali xavfsiz bajariladi.

### AI Coderga prompt:

```
Endi admin yangi o'qituvchi (login+parol bilan) yarata oladigan qism.

1. Agar hali bo'lmasa, loyiha ildizida Firebase Functions'ni sozla:
   firebase init functions (JavaScript tanlash, ESLint kerak emas desa
   bo'ladi). functions/index.js faylida quyidagi Cloud Function'larni yoz:

   a) createTeacherAccount (https onCall function):
      - Faqat chaqiruvchi (context/request.auth) Firestore'da role: "admin"
        ekanligini tekshiradi, aks holda xato qaytaradi
      - Parametrlar: fullName, email, password, subject
      - admin.auth().createUser({ email, password, displayName: fullName })
        orqali yangi Auth foydalanuvchi yaratadi
      - Firestore users collection'iga
        { uid, fullName, email, role: "teacher", subject, isActive: true,
        createdAt: serverTimestamp() } document yozadi
      - Yaratilgan uid'ni qaytaradi

   b) deleteTeacherAccount (https onCall function):
      - Faqat admin chaqira oladi (xuddi yuqoridagicha tekshirish)
      - Parametr: teacherUid
      - admin.auth().deleteUser(teacherUid) va Firestore'dagi users
        document'ini o'chiradi
      - Bonus: agar bu o'qituvchining faol kurslari bo'lsa, ogohlantirish
        qaytarsin (kursni avval boshqa o'qituvchiga o'tkazish yoki
        o'chirish kerakligini frontend'da ko'rsatish uchun)

2. functions/index.js'ni deploy qil: firebase deploy --only functions
   (agar Blaze (pay-as-you-go) plan kerak bo'lsa, buni README'da eslatib o't
   — Cloud Functions uchun Spark/free plan yetarli emas)

3. Frontend: src/firebase/functions.js yarat, httpsCallable orqali yuqoridagi
   ikki function'ni chaqiradigan helper'lar yoz.

4. src/pages/admin/TeachersPage.jsx to'liq yoz:
   - O'qituvchilar ro'yxati jadval ko'rinishida: ism, email, fan, holati
     (faol/nofaol), amallar
   - "Yangi o'qituvchi qo'shish" tugmasi -> modal:
     * To'liq ism, email, fan nomi, vaqtinchalik parol inputlari
       (parol generatsiya qilish tugmasi ham bo'lsa qulay - random 8
       belgili parol yaratib input'ga qo'yadi)
     * Saqlash bosilganda createTeacherAccount Cloud Function chaqiriladi
     * Muvaffaqiyatli bo'lsa, admin'ga yaratilgan login (email) va parolni
       ko'rsatadigan modal chiqadi ("Bu ma'lumotlarni o'qituvchiga
       yetkazing"), nusxalash tugmasi bilan
   - "O'chirish" tugmasi -> tasdiqlash -> deleteTeacherAccount chaqiriladi

5. Loading holatlarini unutma — Cloud Function chaqiruvi internet sekin
   bo'lsa biroz vaqt oladi, tugma "Yaratilmoqda..." holatiga o'tsin.

6. Test qil: yangi o'qituvchi yarat, chiqib o'sha login/parol bilan kirib
   ko'r — kira olishi kerak. O'qituvchini o'chirib ko'r.

7. Commit: "A3: Teachers management Cloud Functions orqali" va push qil.
```

### Qabul qilish mezonlari:
- [ ] Yangi o'qituvchi yaratilganda u darhol berilgan login/parol bilan kira oladi
- [ ] Faqat admin bu function'larni chaqira oladi (boshqa rol chaqirsa xato qaytadi — test qilib ko'ring)
- [ ] O'qituvchini o'chirish ham Auth'dan, ham Firestore'dan olib tashlaydi
- [ ] Yaratilgan login/parol admin'ga aniq ko'rsatiladi

---

## A4 — Kurslarni (to'garaklarni) boshqarish

### AI Coderga prompt:

```
Endi admin kurslarni to'liq boshqara oladigan qism.

1. src/pages/admin/CoursesPage.jsx to'liq yoz:
   - Barcha kurslar jadvali: nomi, fan, o'qituvchi, xona, jadval (masalan
     "Dush/Chor 15:00-16:30"), talaba soni (enrolledCount/capacity), holati
   - Filter/qidiruv: fan bo'yicha, o'qituvchi bo'yicha
   - "Yangi kurs yaratish" tugmasi -> modal yoki alohida sahifa:
     * Sarlavha, tavsif, fan
     * O'qituvchi tanlash — dropdown, Firestore users collection'idan
       role: "teacher" bo'lganlarni oladi
     * Xona tanlash — dropdown, rooms collection'idan
     * Hafta kunlari + vaqt — bir nechta { kun, boshlanish vaqti, tugash
       vaqti } qatorlarini qo'shish imkoni (masalan Dushanba 15:00-16:30
       VA Chorshanba 15:00-16:30 bitta kursga)
     * Boshlanish sanasi (date picker)
     * Sig'im (number)
   - Saqlash bosilganda Firestore courses collection'iga:
     title, description, subject, teacherId, teacherName (denormalized),
     roomId, roomName (denormalized), schedule (array), startDate,
     capacity, enrolledCount: 0, isActive: true, createdAt yoziladi
   - "Tahrirlash" — mavjud ma'lumotlar bilan to'ldirilgan forma
   - "O'chirish" — tasdiqlash bilan, agar kursga talabalar yozilgan bo'lsa
     ogohlantirish chiqsin ("Bu kursga N talaba yozilgan, baribir
     o'chirilsinmi?")
   - "Faollashtirish/to'xtatish" tugmasi — isActive ni true/false qiladi
     (talabalar paneli faqat isActive: true kurslarni ko'rsatadi)

2. src/pages/admin/CourseDetailPage.jsx yarat (kursni bosganda ochiladi):
   - Kurs haqida to'liq ma'lumot (yuqorida)
   - Shu kursga yozilgan talabalar jadvali: ism, email, qo'shilgan sana
   - Har bir talaba qatorida — uning davomat tarixi (necha marta keldi/
     kelmadi) va o'rtacha bahosi ko'rsatilsin (enrollments.attendance va
     enrollments.grades array'laridan hisoblab)
   - Bosilsa, to'liq davomat va baho tarixi modal/jadval ko'rinishida
     ochiladi

3. Test qil: yangi kurs yarat (teacher va room tanlab), tahrirla, holatini
   o'zgartir, o'chirib ko'r. Detail sahifasiga kirib ko'r.

4. Commit: "A4: Courses CRUD va detail sahifa" va push qil.
```

### Qabul qilish mezonlari:
- [ ] Yangi kurs yaratish ishlaydi, dropdown'lar to'g'ri to'ladi
- [ ] Tahrirlash va o'chirish (ogohlantirish bilan) ishlaydi
- [ ] Holatni faol/nofaol qilish ishlaydi
- [ ] Detail sahifada talabalar, davomat, baho to'g'ri ko'rinadi

---

## A5 — Dashboard'ni haqiqiy ma'lumotlar bilan to'ldirish

### AI Coderga prompt:

```
Endi A1'da yaratilgan placeholder Dashboard'ni haqiqiy Firestore ma'lumotlari
bilan to'ldiramiz.

1. src/pages/admin/DashboardPage.jsx'ni qayta yoz:
   - 4 statistika kartasi haqiqiy sonlar bilan:
     * Jami kurslar soni (courses collection.length)
     * Faol kurslar soni (isActive: true bo'lganlar)
     * Jami talabalar soni (users, role: "student")
     * Jami o'qituvchilar soni (users, role: "teacher")
   - Bar chart (recharts orqali): eng ko'p talaba qo'shilgan 5 kursni
     ko'rsatadigan grafik (X o'qida kurs nomi, Y o'qida enrolledCount)
   - Pie chart: fanlar bo'yicha kurslar taqsimoti (har bir fan nechta
     kursga ega)
   - Har bir statistika kartasi bosilganda mos sahifaga o'tish (masalan
     "Jami kurslar" bosilsa /admin/courses ga)

2. Performance: bir nechta alohida Firestore so'rov o'rniga, mumkin bo'lsa
   bitta marta hammasini olib, JavaScript ichida hisoblab chiqarish
   (kichik loyiha uchun bu yetarli, real-time onSnapshot shart emas,
   oddiy getDocs bilan komponent mount bo'lganda olinishi mumkin).

3. Loading skeleton qo'sh — ma'lumotlar yuklanayotganda statistika
   kartalari joyida pulsatsiya animatsiyasi ko'rsatilsin.

4. Test qil: bir nechta test kurs/talaba/o'qituvchi qo'shib, dashboard
   sonlari to'g'ri yangilanishini tekshir.

5. Commit: "A5: Dashboard haqiqiy statistikalar bilan" va push qil.
```

### Qabul qilish mezonlari:
- [ ] Barcha statistikalar Firestore'dagi haqiqiy holatga mos keladi
- [ ] Grafiklar to'g'ri render bo'ladi va ma'lumot to'g'ri
- [ ] Loading holati chiroyli ko'rsatiladi

---

## A6 — Yakuniy tekshirish va merge

1. Butun admin oqimini boshidan oxirigacha qayta sinab ko'ring: xona yarat → o'qituvchi yarat → kurs yarat (yangi xona va o'qituvchini tanlab) → dashboard'da statistikalar to'g'ri yangilanganini ko'ring.
2. `git push origin feature/admin-module`
3. GitHub'da Pull Request oching, Dev B va Dev C'dan review so'rang.
4. Review'dan o'tgandan keyin `main`ga merge qiling.

### Qabul qilish mezonlari (umumiy A-modul):
- [ ] Admin xona, o'qituvchi, kurs to'liq boshqara oladi
- [ ] Cloud Functions xavfsiz (faqat admin chaqira oladi)
- [ ] Dashboard to'g'ri statistikalarni ko'rsatadi
- [ ] Bug yo'q, console'da xato yo'q
- [ ] PR review qilingan va merge qilingan
