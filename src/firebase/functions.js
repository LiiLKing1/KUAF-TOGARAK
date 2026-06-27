import { getFunctions, httpsCallable } from "firebase/functions";
import app from "./config";

// Firebase Functions initsializatsiyasi
export const functions = getFunctions(app);

// Callable funksiyalarni tayyorlash
export const createTeacherAccount = httpsCallable(functions, "createTeacherAccount");
export const deleteTeacherAccount = httpsCallable(functions, "deleteTeacherAccount");
