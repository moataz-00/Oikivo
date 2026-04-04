import { useAuthStore } from '../store/auth.store';

export const useAuth = () => {
  const { user, accessToken, isHostMode, isHydrated } = useAuthStore();
  return {
    user,
    isLoggedIn: !!accessToken,
    isHost: user?.isHost || false,
    isHostMode,
    isHydrated,
  };
};
