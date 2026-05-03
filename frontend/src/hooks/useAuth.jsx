import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
      });
    }
    return { data };
  };

  const signOut = () => supabase.auth.signOut();

  const firstName = profile?.full_name?.split(' ')[0] || '';
  const isNewUser = user?.created_at && (new Date() - new Date(user.created_at)) < 60000;

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, firstName, isNewUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
