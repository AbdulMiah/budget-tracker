import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

type AuthState = {
  /** False until the saved session has been read from secure storage. */
  ready: boolean;
  session: Session | null;
};

// Not persisted here: supabase-js keeps the session in secure storage itself.
export const useAuth = create<AuthState>()(() => ({ ready: !supabase, session: null }));

if (supabase) {
  // Fires once on startup with the saved session (or null), then on every sign-in, sign-out and refresh.
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuth.setState({ ready: true, session });
  });
}

/** True when the app can show data: signed in, or running on demo data. */
export const useSignedIn = () => useAuth((s) => !supabase || s.session !== null);
