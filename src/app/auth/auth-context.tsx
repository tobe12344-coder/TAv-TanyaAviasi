
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// --- Placeholder Data & Types ---
// In a real Firebase app, this would come from `firebase/auth`
type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

// --- Whitelist ---
// IMPORTANT: Add the emails of authorized users here.
const ALLOWED_EMAILS = [
  'user1@example.com',
  'user2@example.com',
  'admin@example.com' 
  // TODO: Replace with actual authorized email addresses
];


// --- Mock Firebase Functions ---
// These functions simulate the behavior of Firebase Auth.
// We'll replace them with real Firebase calls later.

const mockSignInWithGoogle = async (): Promise<User> => {
  console.log("Simulating Google Sign-In...");
  // In a real scenario, this would open a Google login popup.
  // For this mock, we'll return a predefined user.
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  const mockUser: User = {
      uid: 'mock-uid-12345',
      email: 'user1@example.com', // Simulate a whitelisted user
      displayName: 'Mock User'
  };
  console.log("Simulated user:", mockUser.email);
  return mockUser;
};

const mockSignOut = async () => {
  console.log("Simulating Sign-Out...");
  await new Promise(resolve => setTimeout(resolve, 500));
};

const mockOnAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
  console.log("Simulating Auth State listener...");
  // This function would typically be called by Firebase when the user's login state changes.
  // We won't simulate this automatically for now. It will be triggered by sign-in/sign-out.
  return () => { console.log("Unsubscribed from auth state changes."); }; // Return an unsubscribe function
};


// --- Auth Context ---

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
    // In a real app, you might check for a stored session here.
    // For now, we'll just start with no user.
    setLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const resultUser = await mockSignInWithGoogle();
      
      if (resultUser.email && ALLOWED_EMAILS.includes(resultUser.email)) {
        setUser(resultUser);
        router.push('/');
      } else {
        toast({
            variant: "destructive",
            title: "Akses Ditolak",
            description: "Email Anda tidak terdaftar untuk mengakses aplikasi ini.",
        });
        await mockSignOut();
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
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await mockSignOut();
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
      setLoading(false);
    }
  };

  const value = { user, loading, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
