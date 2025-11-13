
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/firebase/config'; // Mengimpor dari file konfigurasi baru
import { useToast } from '@/hooks/use-toast';


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
      setUser(currentUser);
      // Selesai memeriksa, set loading menjadi false
      setLoading(false);
    });

    // Unsubscribe dari listener saat komponen di-unmount
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // Menggunakan signInWithPopup dari Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const resultUser = result.user;
      
      if (resultUser.email && ALLOWED_EMAILS.includes(resultUser.email)) {
        // Pengguna diizinkan, onAuthStateChanged akan menangani setUser
        // dan kita bisa arahkan ke halaman utama
        router.push('/');
      } else {
        // Jika tidak diizinkan, tampilkan pesan dan logout
        toast({
            variant: "destructive",
            title: "Akses Ditolak",
            description: "Email Anda tidak terdaftar untuk mengakses aplikasi ini.",
        });
        await signOut(auth); // Langsung logout jika tidak diizinkan
      }
    } catch (error: any) {
        // Jangan tampilkan toast untuk error 'popup-closed-by-user'
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Sign-In Error", error);
            toast({
                    variant: "destructive",
                    title: "Login Gagal",
                    description: "Terjadi kesalahan saat mencoba login dengan Google.",
            });
        }
    } finally {
      // Set loading false setelah proses login selesai atau gagal
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      // Menggunakan signOut dari Firebase
      await signOut(auth);
      // onAuthStateChanged akan menangani setUser(null)
      router.push('/login');
    } catch (error) {
      console.error("Sign-Out Error", error);
       toast({
            variant: "destructive",
            title: "Logout Gagal",
            description: "Terjadi kesalahan saat mencoba logout.",
        });
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
