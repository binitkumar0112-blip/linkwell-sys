import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { supabase } from '../lib/supabase';

export type UserRole = 'ngo_admin' | 'volunteer' | 'donor' | 'community' | 'citizen' | null;

interface AuthState {
  user: User | null;
  role: UserRole;
  linkedProfile: any | null;
  loading: boolean;
  onboardingCompleted: boolean;
  idToken: string | null;
}

export function useAuth(): AuthState & {
  loginWithEmail: (email: string, password: string, role?: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, role?: string) => Promise<void>;
  loginWithGoogle: (role?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
} {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    linkedProfile: null,
    loading: true,
    onboardingCompleted: false,
    idToken: null,
  });

  const fetchProfile = async (firebaseUser: User) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', firebaseUser.uid)
      .maybeSingle();
    
    return data?.onboarding_completed || false;
  };

  const ensureNgoAccess = async (firebaseUser: User, userRecord: any) => {
    if (!firebaseUser.email || !userRecord) return userRecord;

    let ngoId = userRecord.assigned_ngo_id;

    if (!ngoId) {
      const { data: existingNgo } = await supabase
        .from('ngos')
        .select('id')
        .eq('user_id', firebaseUser.uid)
        .maybeSingle();

      if (existingNgo?.id) {
        ngoId = existingNgo.id;
      } else {
        const fallbackName = firebaseUser.displayName || firebaseUser.email.split('@')[0] || 'NGO';
        const { data: newNgo, error: ngoError } = await supabase
          .from('ngos')
          .insert([{
            name: `${fallbackName} NGO`,
            category: 'general',
            latitude: 19.0760,
            longitude: 72.8777,
            verified: true,
            user_id: firebaseUser.uid
          }])
          .select('id')
          .single();

        if (ngoError) {
          console.error('[Auth-sync] Failed to auto-create NGO profile:', ngoError);
        } else {
          ngoId = newNgo.id;
        }
      }
    }

    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update({
        role: 'ngo_admin',
        assigned_ngo_id: ngoId || userRecord.assigned_ngo_id || null
      })
      .eq('id', firebaseUser.uid)
      .select()
      .single();

    if (userError) {
      console.error('[Auth-sync] Failed to finalize NGO access:', userError);
    }

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', firebaseUser.uid)
      .maybeSingle();

    const profileData = {
      user_id: firebaseUser.uid,
      onboarding_completed: true
    };

    if (existingProfile) {
      await supabase.from('user_profiles').update(profileData).eq('user_id', firebaseUser.uid);
    } else {
      await supabase.from('user_profiles').insert([profileData]);
    }

    return updatedUser || { ...userRecord, role: 'ngo_admin', assigned_ngo_id: ngoId || userRecord.assigned_ngo_id || null };
  };

  const syncUserToSupabase = async (firebaseUser: User, intendedRole?: string) => {
    if (!firebaseUser.email) return null;

    console.log('[Auth-sync] Fetching user from Supabase for UID:', firebaseUser.uid);
    
    // Fetch user from Supabase
    let { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', firebaseUser.uid)
      .maybeSingle();

    if (fetchError) {
      console.error('[Auth-sync] Error fetching user:', fetchError);
    }

    console.log('[Auth-sync] Fetched user from DB:', existingUser);

    if (!existingUser) {
      // Create user if they don't exist
      const newRole = intendedRole || 'citizen';
      console.log(`[Auth-sync] Creating missing Supabase user for ${firebaseUser.uid} with role: ${newRole}`);
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0] || 'User',
          role: newRole
        }])
        .select()
        .single();

      if (!error) {
        existingUser = newUser;
      } else {
        console.error('[Auth-sync] Failed to create user in Supabase:', error);
      }
    } else if (intendedRole && existingUser.role !== intendedRole && (intendedRole === 'ngo_admin' || intendedRole === 'volunteer')) {
       // Force update role when switching portals during sign up
       console.log(`[Auth-sync] Updating Supabase role from ${existingUser.role} to ${intendedRole}`);
       const { data: updatedUser, error } = await supabase
         .from('users')
         .update({ role: intendedRole })
         .eq('id', firebaseUser.uid)
         .select()
         .single();
         
       if (!error) {
         existingUser = updatedUser;
         console.log('[Auth-sync] Role updated successfully');
       } else {
         console.error('[Auth-sync] Failed to update role:', error);
       }
    }

    if (intendedRole === 'ngo_admin') {
      existingUser = await ensureNgoAccess(firebaseUser, existingUser);
    }

    console.log('[Auth-sync] Returning user:', existingUser);
    return existingUser;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        console.log('[Auth] No Firebase user - clearing state');
        setAuthState({ user: null, role: null, linkedProfile: null, loading: false, onboardingCompleted: true, idToken: null });
        return;
      }

      console.log('========================================');
      console.log('[Auth] Firebase Auth State Changed');
      console.log('[Auth] Firebase UID:', firebaseUser.uid);
      console.log('[Auth] Firebase Email:', firebaseUser.email);
      console.log('[Auth] Firebase DisplayName:', firebaseUser.displayName);
      console.log('========================================');

      const [idToken, onboardingCompleted] = await Promise.all([
        firebaseUser.getIdToken(),
        fetchProfile(firebaseUser)
      ]);

      console.log('[Auth] Onboarding completed:', onboardingCompleted);

      const portalRole = localStorage.getItem('signup_portal') === 'ngo'
        ? 'ngo_admin'
        : localStorage.getItem('signup_portal') === 'volunteer'
          ? 'volunteer'
          : undefined;
      const intendedRole = localStorage.getItem('intended_role') || portalRole;
      console.log('[Auth] Intended role from localStorage:', intendedRole);
      // Keep signup markers until the route/form flow has consumed them.
      // NGO signup uses these flags to open the instant setup flow instead of
      // falling through to the pending-review experience.

      // Fetch or create the Supabase user
      console.log('[Auth] Syncing user to Supabase...');
      const supabaseUser = await syncUserToSupabase(firebaseUser, intendedRole);
      
      console.log('========================================');
      console.log('[Auth] Supabase User Data:');
      console.log('[Auth] - Full object:', JSON.stringify(supabaseUser, null, 2));
      if (supabaseUser) {
        console.log('[Auth] - ID:', supabaseUser.id);
        console.log('[Auth] - Email:', supabaseUser.email);
        console.log('[Auth] - Role:', supabaseUser.role);
        console.log('[Auth] - assigned_ngo_id:', supabaseUser.assigned_ngo_id || 'NULL');
        console.log('[Auth] - Name:', supabaseUser.name);
      } else {
        console.log('[Auth] - ⚠️ WARNING: supabaseUser is NULL!');
      }
      console.log('========================================');

      const roleIntent = intendedRole === 'ngo_admin' || intendedRole === 'volunteer' ? intendedRole : undefined;
      const activeRole = (roleIntent || supabaseUser?.role || 'citizen') as UserRole;
      const linkedProfile = supabaseUser ? { ...supabaseUser, role: activeRole } : null;
      
      console.log('[Auth] Role Resolution Logic:');
      console.log('  - supabaseUser?.role:', supabaseUser?.role);
      console.log('  - intendedRole:', intendedRole);
      console.log('  - Fallback:', 'citizen');
      console.log('  - FINAL ROLE:', activeRole);
      console.log('========================================');

      const effectiveOnboardingCompleted = activeRole === 'ngo_admin' || onboardingCompleted || Boolean(supabaseUser?.assigned_ngo_id);

      setAuthState({
        user: firebaseUser,
        role: activeRole,
        linkedProfile,
        loading: false,
        onboardingCompleted: effectiveOnboardingCompleted,
        idToken,
      });

      console.log('[Auth] Auth state set successfully');
      console.log('========================================\n');
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (!authState.user) return;
    const onboardingCompleted = await fetchProfile(authState.user);
    
    // Also re-fetch the supabase user to get the current role and assigned_ngo_id
    const { data: supabaseUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authState.user.uid)
      .maybeSingle();

    const intendedRole = localStorage.getItem('intended_role') || undefined;
    const roleIntent = intendedRole === 'ngo_admin' || intendedRole === 'volunteer' ? intendedRole : undefined;
    setAuthState(prev => {
      const activeRole = (roleIntent || supabaseUser?.role || prev.role) as UserRole;
      const effectiveOnboardingCompleted = activeRole === 'ngo_admin' || onboardingCompleted || Boolean(supabaseUser?.assigned_ngo_id);

      return {
        ...prev,
        onboardingCompleted: effectiveOnboardingCompleted,
        role: activeRole,
        linkedProfile: supabaseUser ? { ...supabaseUser, role: activeRole } : prev.linkedProfile,
      };
    });
  };

  const loginWithEmail = async (email: string, password: string, role?: string) => {
    if (role) localStorage.setItem('intended_role', role);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (email: string, password: string, role?: string) => {
    if (role) localStorage.setItem('intended_role', role);
    localStorage.setItem('is_new_signup', 'true');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async (role?: string) => {
    if (role) localStorage.setItem('intended_role', role);
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('intended_role');
    localStorage.removeItem('is_new_signup');
    // Redirect to home page
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  return { ...authState, loginWithEmail, signupWithEmail, loginWithGoogle, logout, refreshProfile };
}
