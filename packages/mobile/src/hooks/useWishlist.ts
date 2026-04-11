import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistsApi } from '@/lib/api';
import { useAuth } from './useAuth';

export function useWishlist(propertyId: number) {
  const { isLoggedIn } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlistCheck', propertyId],
    queryFn: () => wishlistsApi.checkWishlisted(propertyId),
    enabled: isLoggedIn && propertyId > 0,
  });

  const wishlisted = data?.wishlisted ?? false;
  const wishlistId = data?.wishlistId;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (wishlisted && wishlistId) {
        await wishlistsApi.removeFromWishlist(wishlistId, propertyId);
      } else {
        // Get existing wishlists or create a default one
        let lists = await wishlistsApi.getWishlists();
        let targetId: number;
        if (lists.length > 0) {
          targetId = lists[0].id;
        } else {
          const newList = await wishlistsApi.createWishlist('My Wishlist');
          targetId = newList.id;
        }
        await wishlistsApi.addToWishlist(targetId, propertyId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlistCheck', propertyId] });
      qc.invalidateQueries({ queryKey: ['wishlists'] });
    },
  });

  return {
    wishlisted,
    isLoading,
    toggle: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
}
