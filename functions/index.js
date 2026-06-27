const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Yordamchi: Chaqiruvchi admin ekanligini tekshirish
const verifyAdmin = async (context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Tizimga kirilmagan!"
    );
  }
  
  const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
  
  if (!userDoc.exists || userDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Bu amalni bajarish uchun admin huquqi kerak!"
    );
  }
};

/**
 * createTeacherAccount
 * Admin tomonidan yangi o'qituvchi yaratish (Auth va Firestore)
 */
exports.createTeacherAccount = functions.https.onCall(async (data, context) => {
  // 1. Admin ekanini tasdiqlash
  await verifyAdmin(context);

  const { fullName, email, password, subject } = data;

  if (!fullName || !email || !password || !subject) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Barcha maydonlarni to'ldirish shart!"
    );
  }

  try {
    // 2. Auth da foydalanuvchi yaratish
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: fullName,
    });

    // 3. Firestore'da users doc yaratish
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      fullName: fullName,
      email: email,
      role: "teacher",
      subject: subject,
      phone: null,
      telegramChatId: null,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error("O'qituvchi yaratishda xato:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * deleteTeacherAccount
 * Admin tomonidan o'qituvchini o'chirish
 */
exports.deleteTeacherAccount = functions.https.onCall(async (data, context) => {
  // 1. Admin ekanini tasdiqlash
  await verifyAdmin(context);

  const { teacherUid } = data;

  if (!teacherUid) {
    throw new functions.https.HttpsError("invalid-argument", "Teacher UID berilmadi!");
  }

  try {
    // 2. Auth dan o'chirish
    await admin.auth().deleteUser(teacherUid);

    // 3. Firestore'dan users doc o'chirish
    await admin.firestore().collection("users").doc(teacherUid).delete();

    return { success: true };
  } catch (error) {
    console.error("O'qituvchini o'chirishda xato:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
