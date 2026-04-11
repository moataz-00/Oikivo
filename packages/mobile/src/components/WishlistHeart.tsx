import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';

interface Props {
  propertyId: number;
  size?: number;
}

export function WishlistHeart({ propertyId, size = 24 }: Props) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { wishlisted, toggle, isToggling } = useWishlist(propertyId);

  const handlePress = () => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    toggle();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={isToggling}
      className="w-9 h-9 items-center justify-center"
    >
      <Heart
        size={size}
        color={wishlisted ? '#FF385C' : '#fff'}
        fill={wishlisted ? '#FF385C' : 'transparent'}
        strokeWidth={2}
      />
    </TouchableOpacity>
  );
}
