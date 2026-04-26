import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { SignupInput, LoginInput } from '../schemas/auth.schema';
import { authApi } from '../api/auth';
import { AuthContext, type AuthState } from './AuthContext';

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const checkSession = useCallback(async () => {
    try {
      const user = await authApi.me();
      if (user) {
        setState({ status: 'authenticated', user });
      } else {
        setState({ status: 'unauthenticated' });
      }
    } catch {
      setState({ status: 'unauthenticated' });
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const signup = useCallback(async (input: SignupInput): Promise<void> => {
    const user = await authApi.signup(input);
    setState({ status: 'authenticated', user });
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<void> => {
    const user = await authApi.login(input);
    setState({ status: 'authenticated', user });
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authApi.logout();
    setState({ status: 'unauthenticated' });
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await checkSession();
  }, [checkSession]);

  const value = {
    ...state,
    signup,
    login,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
