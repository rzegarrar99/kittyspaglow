import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de caché por defecto
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// MIGRACIÓN A FIREBASE:
// React Query manejará el estado de carga, error y caché de las llamadas a Firestore.
// Si Firestore tiene soporte offline habilitado, React Query trabajará en conjunto con él.
