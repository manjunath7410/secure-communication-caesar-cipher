/**
 * @file useAuth.ts
 * @description Hook to access military authentication state and operations.
 */

import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  return useAuthContext();
}
