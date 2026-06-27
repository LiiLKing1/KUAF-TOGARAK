// src/firebase/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

/**
 * Foydalanuvchini email va parol bilan tizimga kiritadi
 */
export const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Yangi talaba ro'yxatdan o'tkazadi
 * Firestore'da users collection'ida role: "student" bilan yangi doc yaratadi
 */
export const registerStudent = async (email, password, fullName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Firebase Auth profilini yangilash
  await updateProfile(user, { displayName: fullName });

  // Firestore'da foydalanuvchi doc yaratish
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    fullName,
    email,
    role: "student",
    phone: null,
    telegramChatId: null,
    createdAt: serverTimestamp(),
    isActive: true,
  });

  return user;
};

/**
 * Tizimdan chiqarish
 */
export const logout = async () => {
  await signOut(auth);
};
