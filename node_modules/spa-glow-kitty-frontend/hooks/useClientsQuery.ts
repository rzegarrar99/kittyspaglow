import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/client.service';
import { Client } from '../types';

export const useClientsQuery = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  });
};

export const useAddClientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useUpdateClientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Client> }) => clientService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useDeleteClientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

// MIGRACIÓN A FIREBASE:
// Estos hooks no sufrirán ningún cambio. React Query seguirá invalidando la caché
// y refetching los datos automáticamente cuando las mutaciones sean exitosas.
