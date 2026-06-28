// src/firebase/firestore.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

// ─── Umumiy CRUD yordamchilar ──────────────────────────────────────────────

/**
 * Collection'dan barcha documentlarni olish
 */
export const getAll = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Bitta documentni ID bo'yicha olish
 */
export const getById = async (collectionName, id) => {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

/**
 * Yangi document qo'shish (auto ID)
 */
export const addDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Document yaratish (belgilangan ID bilan)
 */
export const setDocument = async (collectionName, id, data) => {
  await setDoc(doc(db, collectionName, id), data);
};

/**
 * Document'ni yangilash (partial update)
 */
export const updateDocument = async (collectionName, id, data) => {
  await updateDoc(doc(db, collectionName, id), data);
};

/**
 * Document'ni o'chirish
 */
export const deleteDocument = async (collectionName, id) => {
  await deleteDoc(doc(db, collectionName, id));
};

/**
 * Field bo'yicha filter qilib olish
 */
export const queryByField = async (collectionName, field, value) => {
  const q = query(collection(db, collectionName), where(field, "==", value));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Bir nechta shart bilan filter qilib olish
 * @param {string} collectionName
 * @param {string} field
 * @param {string} operator — "==", "<", ">=", "array-contains", etc.
 * @param {*} value
 */
export const getDocumentsWhere = async (collectionName, field, operator, value) => {
  const q = query(collection(db, collectionName), where(field, operator, value));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Maxsus yordamchilar ───────────────────────────────────────────────────

/**
 * Foydalanuvchi ma'lumotlarini olish (role bilan)
 */
export const getUserData = async (uid) => {
  return await getById("users", uid);
};

/**
 * Kurslar ro'yxatini olish
 */
export const getCourses = async () => {
  return await getAll("courses");
};

/**
 * Talabaning yozilgan kurslarini olish
 */
export const getStudentEnrollments = async (studentId) => {
  return await queryByField("enrollments", "studentId", studentId);
};

/**
 * O'qituvchining kurslarini olish
 */
export const getTeacherCourses = async (teacherId) => {
  return await queryByField("courses", "teacherId", teacherId);
};

/**
 * Kursga yozilgan barcha talabalarni olish
 */
export const getCourseEnrollments = async (courseId) => {
  return await queryByField("enrollments", "courseId", courseId);
};

export { serverTimestamp };
