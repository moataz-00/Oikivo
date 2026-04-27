'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistsApi } from '@/lib/api';
import { useAuth } from './useAuth';
import type { Wishlist } from '@/types';

export function useWishlists() {
  const { isLoggedIn } = useAuth();

  return useQuery({
    queryKey: ['wishlists'],
    queryFn: wishlistsApi.getWishlists,
    enabled: isLoggedIn,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useWishlistByToken(token: string) {
  return useQuery({
    queryKey: ['wishlists', 'share', token],
    queryFn: () => wishlistsApi.getWishlistByToken(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWishlist(uuid: string) {
  const { isLoggedIn } = useAuth();

  return useQuery({
    queryKey: ['wishlists', uuid],
    queryFn: () => wishlistsApi.getWishlistByUuid(uuid),
    enabled: isLoggedIn && !!uuid,
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
    onSuccess: (newWishlist) => {
      // Optimistically prepend the new list so it appears immediately
      queryClient.setQueryData<Wishlist[]>(['wishlists'], (old) =>
        old ? [{ ...newWishlist, count: 0, properties: [] }, ...old] : [{ ...newWishlist, count: 0, properties: [] }],
      );
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
    },
  });
}

export function useRenameWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => wishlistsApi.renameWishlist(id, name),
    onSuccess: (updated) => {
      // Update list cache entry
      queryClient.setQueryData<Wishlist[]>(['wishlists'], (old) =>
        old?.map((w) => (w.id === updated.id ? { ...w, name: updated.name } : w)) ?? old,
      );
      // Update detail cache entry (keyed by UUID)
      if (updated.uuid) {
        queryClient.setQueryData<Wishlist>(['wishlists', updated.uuid], (old) =>
          old ? { ...old, name: updated.name } : old,
        );
      }
    },
  });
}

export function useRotateShareToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; uuid: string }) => wishlistsApi.rotateShareToken(id),
    onSuccess: (data, { uuid }) => {
      queryClient.setQueryData<Wishlist>(['wishlists', uuid], (old) =>
        old ? { ...old, shareToken: data.shareToken } : old,
      );
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['wishlists'] });
      const previous = queryClient.getQueryData<Wishlist[]>(['wishlists']);
      queryClient.setQueryData<Wishlist[]>(['wishlists'], (old) =>
        old?.filter((w) => w.id !== id) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['wishlists'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
    },
  });
}
