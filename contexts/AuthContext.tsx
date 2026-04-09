import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock User for Local Mode
const MOCK_USER: User = {
  id: 'local-dev-user',
  app_metadata: {},
  user_metadata: { full_name: 'Local Developer' },
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

const MOCK_SESSION: Session = {
  access_token: 'mock-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh',
  user: MOCK_USER
};

const TOKEN_KEY = 'meetcraft_auth_token';
const TOKEN_EXPIRY_KEY = 'meetcraft_token_expiry';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          // Local/Offline Mode: Initialize with mock token
          console.log("🔑 Initializing offline auth...");
          
          // Check if token exists, otherwise create it
          let storedToken = sessionStorage.getItem(TOKEN_KEY);
          if (!storedToken) {
            storedToken = 'mock-token';
            const expiry = Date.now() + 3600 * 1000; // 1 hour
            sessionStorage.setItem(TOKEN_KEY, storedToken);
            sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
            console.log("✅ Mock token initialized");
          }
          
          setToken(storedToken);
          setSession(MOCK_SESSION);
          setUser(MOCK_USER);
          setLoading(false);
          return;
        }

        // Supabase Mode: Use real authentication
        console.log("🔐 Initializing Supabase auth...");
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        if (supabaseSession) {
          setToken(supabaseSession.access_token);
          setSession(supabaseSession);
          setUser(supabaseSession.user);
        }
        setLoading(false);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            setToken(newSession.access_token);
            setSession(newSession);
            setUser(newSession.user);
          } else {
            setToken(null);
            setSession(null);
            setUser(null);
          }
          setLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Fallback to mock mode on error
        setToken('mock-token');
        setSession(MOCK_SESSION);
        setUser(MOCK_USER);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('meetcraft_local_user');
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
    setSession(null);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, isAuthenticated: !!user, signOut, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Expose a helper to trigger local login from LoginPage
export const loginLocally = () => {
  localStorage.setItem('meetcraft_local_user', 'true');
  window.location.reload(); // Simple reload to refresh context
};