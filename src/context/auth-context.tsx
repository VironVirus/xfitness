"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { MemberProfile } from "@/types/app";
import type { SignUpMemberResult } from "@/lib/supabase";
import { saveMemberProfile, signInMember, signOutMember, signUpMember, watchMemberSession } from "@/lib/supabase";

type AuthContextValue = {
  member: MemberProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<MemberProfile>;
  signUp: (input: {
    fullName: string;
    email: string;
    password: string;
    goal: string;
    preferredWorkoutType: string;
  }) => Promise<SignUpMemberResult>;
  signOut: () => Promise<void>;
  refreshMember: (member: MemberProfile) => Promise<MemberProfile>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = watchMemberSession(
      async (nextMember) => {
        setMember(nextMember);
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const nextMember = await signInMember(email, password);
    setMember(nextMember);
    return nextMember;
  }

  async function signUp(input: {
    fullName: string;
    email: string;
    password: string;
    goal: string;
    preferredWorkoutType: string;
  }) {
    const result = await signUpMember(input);
    if (!result.requiresEmailConfirmation) {
      setMember(result.member);
    }
    return result;
  }

  async function signOut() {
    await signOutMember();
    setMember(null);
  }

  async function refreshMember(nextMember: MemberProfile) {
    const savedMember = await saveMemberProfile(nextMember);
    setMember(savedMember);
    return savedMember;
  }

  return (
    <AuthContext.Provider value={{ member, loading, signIn, signUp, signOut, refreshMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
