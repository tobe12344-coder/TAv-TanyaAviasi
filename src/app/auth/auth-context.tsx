
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from '@/firebase/config'; // Mengimpor dari file konfigurasi baru
import { useToast } from '@/hooks/use-toast';

// --- Mendapatkan instance Auth dari Firebase ---
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Tipe User ---
// Kita bisa menggunakan tipe User dari Firebase atau mendefinisikan tipe kita sendiri jika perlu.
// Untuk saat ini, kita gunakan tipe yang sudah ada.
type User = FirebaseUser;

// --- Whitelist Email ---
// PENTING: Tambahkan email pengguna yang diizinkan di sini.
const ALLOWED_EMAILS = [
  'tobe12344@gmail.com',
  'ghali.hutajulu@gmail.com',
  'bayubas08@gmail.com'
  // TODO: Ganti dengan alamat email resmi yang diizinkan
];


// --- Konteks Otentikasi ---

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // onAuthStateChanged adalah listener dari Firebase yang akan
    // terpanggil setiap kali status otentikasi pengguna berubah.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Jika ada pengguna yang login, periksa apakah emailnya diizinkan
        if (currentUser.email && ALLOWED_EMAILS.includes(currentUser.email)) {
          setUser(currentUser);
        } else {
          // Jika tidak diizinkan, logout pengguna
          signOut(auth);
          setUser(null);
          toast({
            variant: "destructive",
            title: "Akses Ditolak",
            description: "Email Anda tidak terdaftar untuk mengakses aplikasi ini.",
          });
           if (router) router.push('/login');
        }
      } else {
        // Jika tidak ada pengguna yang login
        setUser(null);
      }
      // Selesai memeriksa, set loading menjadi false
      setLoading(false);
    });

    // Unsubscribe dari listener saat komponen di-unmount
    return () => unsubscribe();
  }, [router, toast]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // Menggunakan signInWithPopup dari Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const resultUser = result.user;
      
      if (resultUser.email && ALLOWED_EMAILS.includes(resultUser.email)) {
        setUser(resultUser);
        router.push('/');
      } else {
        toast({
            variant: "destructive",
            title: "Akses Ditolak",
            description: "Email Anda tidak terdaftar untuk mengakses aplikasi ini.",
        });
        await signOut(auth); // Langsung logout jika tidak diizinkan
        setUser(null);
      }
    } catch (error) {
      console.error("Google Sign-In Error", error);
       toast({
            variant: "destructive",
            title: "Login Gagal",
            description: "Terjadi kesalahan saat mencoba login dengan Google.",
        });
    } finally {
      // Walaupun error, onAuthStateChanged akan menangani loading state
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      // Menggunakan signOut dari Firebase
      await signOut(auth);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Sign-Out Error", error);
       toast({
            variant: "destructive",
            title: "Logout Gagal",
            description: "Terjadi kesalahan saat mencoba logout.",
        });
    } finally {
       // onAuthStateChanged akan menangani loading state
    }
  };

  const value = { user, loading, signInWithGoogle, signOut: signOutUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
