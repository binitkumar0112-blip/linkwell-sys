import { useState, useEffect } from 'react';
import { type User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'ngo_admin' | 'volunteer' | 'donor' | 'community' | 'citizen' | 'superadmin' | null;

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
  signupWithEmail: (email: string, password: string, role?: string) => Promise<string | void>;
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

  const fetchProfile = async (supabaseUser: User) => {
    try {
      console.log('[Auth] fetchProfile: querying user_profiles for', supabaseUser.id);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      if (error) {
        console.error('[Auth] fetchProfile error:', error.message, error.code, error.details);
        return false;
      }
      console.log('[Auth] fetchProfile result:', data);
      return data?.onboarding_completed || false;
    } catch (err) {
      console.error('[Auth] fetchProfile exception:', err);
      return false;
    }
  };

  const ensureNgoAccess = async (supabaseUser: User, userRecord: any) => {
    if (!supabaseUser.email || !userRecord) return userRecord;

    let ngoId = userRecord.assigned_ngo_id;

    if (!ngoId) {
      const { data: existingNgo } = await supabase
        .from('ngos')
        .select('id')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      if (existingNgo?.id) {
        ngoId = existingNgo.id;
      } else {
        const fallbackName = supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0] || 'NGO';
        const { data: newNgo, error: ngoError } = await supabase
          .from('ngos')
          .insert([{
            name: `${fallbackName} NGO`,
            category: 'general',
            latitude: 19.0760,
            longitude: 72.8777,
            verified: true,
            user_id: supabaseUser.id
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
        assigned_ngo_id: ngoId || (userRecord && userRecord.assigned_ngo_id) || null
      })
      .eq('id', supabaseUser.id)
      .select()
      .single();

    if (userError) {
      console.error('[Auth-sync] Failed to finalize NGO access:', userError);
    }

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', supabaseUser.id)
      .maybeSingle();

    const profileData = {
      user_id: supabaseUser.id,
      onboarding_completed: true
    };

    if (existingProfile) {
      await supabase.from('user_profiles').update(profileData).eq('user_id', supabaseUser.id);
    } else {
      await supabase.from('user_profiles').insert([profileData]);
    }

    return updatedUser || { ...userRecord, role: 'ngo_admin', assigned_ngo_id: ngoId || userRecord.assigned_ngo_id || null };
  };

  const syncUserToSupabase = async (supabaseUser: User, intendedRole?: string) => {
    if (!supabaseUser.email) return null;

    console.log('[Auth-sync] Fetching user from Supabase for ID:', supabaseUser.id);
    
    let { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[Auth-sync] Error fetching user:', fetchError);
    }

    console.log('[Auth-sync] Fetched user from DB:', existingUser);

    if (!existingUser) {
      const newRole = intendedRole || 'citizen';
      console.log(`[Auth-sync] Creating missing Supabase user for ${supabaseUser.id} with role: ${newRole}`);
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0] || 'User',
          role: newRole
        }])
        .select()
        .single();

      if (!error) {
        existingUser = newUser;
      } else {
        console.error('[Auth-sync] Failed to create user in Supabase public.users:', error);
      }
    } else if (intendedRole && existingUser.role !== intendedRole && (intendedRole === 'ngo_admin' || intendedRole === 'volunteer')) {
       console.log(`[Auth-sync] Updating Supabase role from ${existingUser.role} to ${intendedRole}`);
       const { data: updatedUser, error } = await supabase
         .from('users')
         .update({ role: intendedRole })
         .eq('id', supabaseUser.id)
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
      existingUser = await ensureNgoAccess(supabaseUser, existingUser);
    }

    console.log('[Auth-sync] Returning user:', existingUser);
    return existingUser;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const supabaseUser = session?.user;

      if (!supabaseUser) {
        console.log('[Auth] No Supabase user - clearing state');
        setAuthState({ user: null, role: null, linkedProfile: null, loading: false, onboardingCompleted: true, idToken: null });
        return;
      }

      console.log('========================================');
      console.log('[Auth] Supabase Auth State Changed');
      console.log('[Auth] UID:', supabaseUser.id);
      console.log('[Auth] Email:', supabaseUser.email);
      console.log('========================================');

      const idToken = session.access_token;

      // timeout wrapper so we don't hang forever
      function withTimeout(promise, ms, fallback) {
        return Promise.race([
          promise,
          new Promise(resolve => setTimeout(() => {
            console.warn(`[Auth] Timeout after ${ms}ms, using fallback`);
            resolve(fallback);
          }, ms))
        ]);
      }

      try {
        const onboardingCompleted = await withTimeout(fetchProfile(supabaseUser), 5000, false);
        console.log('[Auth] Onboarding completed:', onboardingCompleted);

        const portalRole = localStorage.getItem('signup_portal') === 'ngo'
          ? 'ngo_admin'
          : localStorage.getItem('signup_portal') === 'volunteer'
            ? 'volunteer'
            : undefined;
        const intendedRole = localStorage.getItem('intended_role') || portalRole;
        console.log('[Auth] Intended role from localStorage:', intendedRole);

        console.log('[Auth] Syncing user to public.users...');
        const publicUser = await withTimeout(syncUserToSupabase(supabaseUser, intendedRole), 8000, null);
        
        console.log('[Auth] Public User Data:', JSON.stringify(publicUser, null, 2));

        const roleIntent = intendedRole === 'ngo_admin' || intendedRole === 'volunteer' ? intendedRole : undefined;
        const activeRole = (roleIntent || publicUser?.role || 'citizen') as UserRole;
        const linkedProfile = publicUser ? { ...publicUser, role: activeRole } : null;
        
        const effectiveOnboardingCompleted = activeRole === 'ngo_admin' || onboardingCompleted || Boolean(publicUser?.assigned_ngo_id);

        setAuthState({
          user: supabaseUser,
          role: activeRole,
          linkedProfile,
          loading: false,
          onboardingCompleted: effectiveOnboardingCompleted,
          idToken,
        });

        console.log('[Auth] Auth state set successfully');
      } catch (err) {
        console.error('[Auth] Unhandled error in onAuthStateChange:', err);
        // always resolve loading, even on total failure
        setAuthState({
          user: supabaseUser,
          role: 'citizen',
          linkedProfile: null,
          loading: false,
          onboardingCompleted: false,
          idToken,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!authState.user) return;
    const onboardingCompleted = await fetchProfile(authState.user);
    
    const { data: publicUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authState.user.id)
      .maybeSingle();

    const intendedRole = localStorage.getItem('intended_role') || undefined;
    const roleIntent = intendedRole === 'ngo_admin' || intendedRole === 'volunteer' ? intendedRole : undefined;
    setAuthState(prev => {
      const activeRole = (roleIntent || publicUser?.role || prev.role) as UserRole;
      const effectiveOnboardingCompleted = activeRole === 'ngo_admin' || onboardingCompleted || Boolean(publicUser?.assigned_ngo_id);

      return {
        ...prev,
        onboardingCompleted: effectiveOnboardingCompleted,
        role: activeRole,
        linkedProfile: publicUser ? { ...publicUser, role: activeRole } : prev.linkedProfile,
      };
    });
  };

  const loginWithEmail = async (email: string, password: string, role?: string) => {
    if (role) localStorage.setItem('intended_role', role);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signupWithEmail = async (email: string, password: string, role?: string): Promise<string | void> => {
    if (role) localStorage.setItem('intended_role', role);
    localStorage.setItem('is_new_signup', 'true');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // no session = supabase wants email confirmation first
    if (data?.user && !data.session) {
      return 'email_confirmation_required';
    }
  };

  const loginWithGoogle = async (role?: string) => {
    if (role) localStorage.setItem('intended_role', role);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('intended_role');
    localStorage.removeItem('is_new_signup');
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  return { ...authState, loginWithEmail, signupWithEmail, loginWithGoogle, logout, refreshProfile };
}
