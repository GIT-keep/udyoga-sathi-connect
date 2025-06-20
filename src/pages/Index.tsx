
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import AuthForm from '@/components/auth/AuthForm';
import ProfileSetup from '@/components/profile/ProfileSetup';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import EmployerDashboard from '@/components/dashboard/EmployerDashboard';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if user has a profile
          setTimeout(async () => {
            await checkUserProfile(session.user.id);
          }, 0);
        } else {
          setHasProfile(null);
          setUserType(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error);
        setHasProfile(false);
        setUserType(null);
      } else if (data) {
        setHasProfile(true);
        setUserType(data.user_type);
      } else {
        setHasProfile(false);
        setUserType(null);
      }
    } catch (error) {
      console.error('Error in checkUserProfile:', error);
      setHasProfile(false);
      setUserType(null);
    }
    
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleProfileComplete = () => {
    if (user) {
      checkUserProfile(user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-4">🤝 Udyoga Mitra</div>
          <p className="text-gray-600">Loading your career partner...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not signed in
  if (!user || !session) {
    return <AuthForm />;
  }

  // Show profile setup if user doesn't have a profile
  if (hasProfile === false) {
    const signupUserType = user.user_metadata?.user_type || 'student';
    return (
      <ProfileSetup 
        user={user} 
        userType={signupUserType}
        onComplete={handleProfileComplete}
      />
    );
  }

  // Show appropriate dashboard based on user type
  if (hasProfile === true && userType) {
    if (userType === 'student') {
      return <StudentDashboard user={user} onSignOut={handleSignOut} />;
    } else if (userType === 'employer') {
      return <EmployerDashboard user={user} onSignOut={handleSignOut} />;
    }
  }

  // Loading state while checking profile
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600 mb-4">🤝 Udyoga Mitra</div>
        <p className="text-gray-600">Setting up your profile...</p>
      </div>
    </div>
  );
};

export default Index;
