'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistsApi } from '@/lib/api';
import { useAuth } from './useAuth';

export function useWishlists() {
  const { isLoggedIn } = useAuth();

  return useQuery({
    queryKey: ['wishlists'],
    queryFn: wishlistsApi.getWishlists,
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useWishlist(id: number) {
  const { isLoggedIn } = useAuth();

  return useQuery({
    queryKey: ['wishlists', id],
    queryFn: () => wishlistsApi.getWishlist(id),
    enabled: isLoggedIn && !!id,
  });
}

export function useCheckWishlisted(propertyId: number) {
  const { isLoggedIn } = useAuth();

  return useQuery({
    queryKey: ['wishlists', 'check', propertyId],
    queryFn: () => wishlistsApi.checkWishlisted(propertyId),
    enabled: isLoggedIn && !!propertyId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useCreateWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => wishlistsApi.createWishlist(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
    },
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ wishlistId, propertyId }: { wishlistId: number; propertyId: number }) =>
      wishlistsApi.addToWishlist(wishlistId, propertyId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['wishlists', 'check', variables.propertyId] });
      const previous = queryClient.getQueryData(['wishlists', 'check', variables.propertyId]);
      queryClient.setQueryData(['wishlists', 'check', variables.propertyId], true);
      return { previous, propertyId: variables.propertyId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['wishlists', 'check', context.propertyId], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
      queryClient.invalidateQueries({ queryKey: ['wishlists', variables.wishlistId] });
      queryClient.invalidateQueries({ queryKey: ['wishlists', 'check', variables.propertyId] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ wishlistId, propertyId }: { wishlistId: number; propertyId: number }) =>
      wishlistsApi.removeFromWishlist(wishlistId, propertyId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['wishlists', 'check', variables.propertyId] });
      const previous = queryClient.getQueryData(['wishlists', 'check', variables.propertyId]);
      queryClient.setQueryData(['wishlists', 'check', variables.propertyId], false);
      return { previous, propertyId: variables.propertyId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['wishlists', 'check', context.propertyId], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
      queryClient.invalidateQueries({ queryKey: ['wishlists', variables.wishlistId] });
      queryClient.invalidateQueries({ queryKey: ['wishlists', 'check', variables.propertyId] });
    },
  });
}

export function useDeleteWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wishlistsApi.deleteWishlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
    },
  });
}
