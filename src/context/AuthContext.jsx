// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { getUserData } from "../firebase/firestore";
import { login as firebaseLogin, logout as firebaseLogout } from "../firebase/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // { ...firebaseUser, role, fullName, ... }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Firestore'dan user ma'lumotlarini olamiz (role uchun)
          const userData = await getUserData(firebaseUser.uid);
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            ...userData, // role, fullName, phone, isActive, va h.k.
          });
        } catch (err) {
          console.error("Foydalanuvchi ma'lumotlarini olishda xato:", err);
          setCurrentUser(firebaseUser); // fallback: faqat auth ma'lumotlari
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // cleanup
  }, []);

  const login = async (email, password) => {
    return await firebaseLogin(email, password);
  };

  const logout = async () => {
    await firebaseLogout();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
};

export default AuthContext;
