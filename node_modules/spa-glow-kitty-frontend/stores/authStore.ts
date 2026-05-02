import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/env';
import { Staff, Role } from '../types';

// 👑 CUENTA MAESTRA DEL SISTEMA
const MASTER_EMAIL = 'rzegarrar99@gmail.com';
const DOMAIN_SUFFIX = '@spaglowkitty.pe';

interface AuthState {
  user: Staff | null;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  registerAdmin: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  getHighestRole: () => Role | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (identifier: string, password?: string) => {
        try {
          if (!password) throw new Error("Contraseña requerida");

          // 🎀 Mapeo Inteligente: Si no tiene '@', asumimos que es un username y le agregamos el dominio ficticio
          const emailToLogin = identifier.includes('@') ? identifier : `${identifier}${DOMAIN_SUFFIX}`;

          if (!isFirebaseConfigured) {
            await new Promise(res => setTimeout(res, 500));
            if (identifier.toLowerCase() === 'admin' && password === '123') {
              const demoAdmin: Staff = {
                id: 'demo-admin-id',
                name: "Administradora (Modo Demo)",
                email: MASTER_EMAIL,
                username: 'admin',
                roles: [{ id: 'admin_master', name: 'Admin Total', color: '#FF2A7A', priority: 1000, permissions: ['*'] }],
                commission_rate: 0,
                avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=Admin&backgroundColor=FFB6C1`
              };
              set({ user: demoAdmin, isAuthenticated: true });
              return true;
            }
            return false;
          }
          
          const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
          const firebaseUser = userCredential.user;

          let staffDocRef = doc(db, 'staff', firebaseUser.uid);
          let staffDoc;
          
          try {
            staffDoc = await getDoc(staffDocRef);
          } catch (firestoreError: any) {
            if (firestoreError.code === 'permission-denied' || firestoreError.message?.includes('Missing or insufficient permissions')) {
              throw new Error("Firebase bloqueó el acceso. Ve a Firestore Database > Reglas y cambia a 'allow read, write: if true;'");
            }
            if (firestoreError.message?.includes("Database '(default)' not found") || firestoreError.code === 'not-found') {
              throw new Error("Firestore no está inicializado. Ve a la consola de Firebase > Firestore Database > Crear base de datos.");
            }
            throw firestoreError;
          }

          let staffData: Staff | null = null;

          if (staffDoc.exists()) {
            staffData = { id: staffDoc.id, ...staffDoc.data() } as Staff;
          } else {
            const q = query(collection(db, 'staff'), where('email', '==', firebaseUser.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const existingDoc = querySnapshot.docs[0];
              staffData = { id: existingDoc.id, ...existingDoc.data() } as Staff;
            } else if (firebaseUser.email?.toLowerCase() === MASTER_EMAIL.toLowerCase()) {
              staffData = {
                id: firebaseUser.uid,
                name: "Fundadora Spa Glow Kitty",
                email: firebaseUser.email,
                username: 'fundadora',
                roles: [{ id: 'admin_master', name: 'Admin Total', color: '#FF2A7A', priority: 1000, permissions: ['*'] }],
                commission_rate: 0,
                avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=Founder&backgroundColor=FFB6C1`
              };
              await setDoc(staffDocRef, staffData);
            } else {
              await signOut(auth);
              throw new Error("Tu usuario no está registrado. Pide a la administradora que te agregue en el módulo de Personal.");
            }
          }

          set({ user: staffData, isAuthenticated: true });
          
          // 🎀 Enterprise Fix: Forzamos la entrada al dashboard para limpiar estados previos
          window.location.href = '/dashboard';
          return true;
        } catch (error: any) {
          console.error("Error en login:", error);
          throw error;
        }
      },

      loginWithGoogle: async () => {
        try {
          if (!isFirebaseConfigured) {
            await new Promise(res => setTimeout(res, 800));
            const demoAdmin: Staff = {
              id: 'demo-admin-id',
              name: "Administradora (Modo Demo)",
              email: MASTER_EMAIL,
              username: 'admin',
              roles: [{ id: 'admin_master', name: 'Admin Total', color: '#FF2A7A', priority: 1000, permissions: ['*'] }],
              commission_rate: 0,
              avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=Admin&backgroundColor=FFB6C1`
            };
            set({ user: demoAdmin, isAuthenticated: true });
            return { success: true };
          }
          
          const userCredential = await signInWithPopup(auth, googleProvider);
          const firebaseUser = userCredential.user;

          let staffDocRef = doc(db, 'staff', firebaseUser.uid);
          let staffDoc;
          
          try {
            staffDoc = await getDoc(staffDocRef);
          } catch (firestoreError: any) {
            if (firestoreError.code === 'permission-denied' || firestoreError.message?.includes('Missing or insufficient permissions')) {
              return { success: false, error: "Firebase bloqueó el acceso. Ve a Firestore Database > Reglas y cambia a 'allow read, write: if true;'" };
            }
            if (firestoreError.message?.includes("Database '(default)' not found") || firestoreError.code === 'not-found') {
              return { success: false, error: "Firestore no está inicializado. Ve a la consola de Firebase > Firestore Database > Crear base de datos." };
            }
            throw firestoreError;
          }

          let staffData: Staff | null = null;

          if (staffDoc.exists()) {
            staffData = { id: staffDoc.id, ...staffDoc.data() } as Staff;
            if (firebaseUser.photoURL && staffData.avatarUrl !== firebaseUser.photoURL) {
              staffData.avatarUrl = firebaseUser.photoURL;
              await updateDoc(staffDocRef, { avatarUrl: firebaseUser.photoURL });
            }
          } else {
            const q = query(collection(db, 'staff'), where('email', '==', firebaseUser.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const existingDoc = querySnapshot.docs[0];
              staffData = { id: existingDoc.id, ...existingDoc.data() } as Staff;
              
              if (firebaseUser.photoURL) {
                staffData.avatarUrl = firebaseUser.photoURL;
                await updateDoc(existingDoc.ref, { avatarUrl: firebaseUser.photoURL });
              }
            } else if (firebaseUser.email?.toLowerCase() === MASTER_EMAIL.toLowerCase()) {
              console.log("👑 Bienvenida Fundadora. Creando perfil maestro...");
              staffData = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || "Fundadora Spa Glow Kitty",
                email: firebaseUser.email,
                username: 'fundadora',
                roles: [{ id: 'admin_master', name: 'Admin Total', color: '#FF2A7A', priority: 1000, permissions: ['*'] }],
                commission_rate: 0,
                avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=Founder&backgroundColor=FFB6C1`
              };
              await setDoc(staffDocRef, staffData);
            } else {
              await signOut(auth);
              return { success: false, error: "Tu correo no está registrado en el sistema. Pide a la administradora que te agregue en el módulo de Personal." };
            }
          }

          set({ user: staffData, isAuthenticated: true });
          
          // 🎀 Enterprise Fix: Forzamos la entrada al dashboard
          window.location.href = '/dashboard';
          return { success: true };
        } catch (error: any) {
          console.error("Error detallado de Firebase:", error);
          let errorMessage = error.message;
          if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Cerraste la ventana de Google antes de terminar.';
          } else if (error.code === 'permission-denied' || errorMessage.includes('Missing or insufficient permissions')) {
            errorMessage = "Firebase bloqueó el acceso. Ve a Firestore Database > Reglas y cambia a 'allow read, write: if true;'";
          }
          return { success: false, error: errorMessage };
        }
      },

      registerAdmin: async (email: string, password?: string) => {
        try {
          if (!password) throw new Error("Contraseña requerida");
          if (!isFirebaseConfigured) return false;
          
          if (email.toLowerCase() !== MASTER_EMAIL.toLowerCase()) {
            throw new Error("Solo la cuenta maestra puede registrarse por esta vía.");
          }

          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          const staffData: Staff = {
            id: firebaseUser.uid,
            name: "Fundadora Spa Glow Kitty",
            email: firebaseUser.email || email,
            username: 'fundadora',
            roles: [{ id: 'admin_master', name: 'Admin Total', color: '#FF2A7A', priority: 1000, permissions: ['*'] }],
            commission_rate: 0,
            avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=Founder&backgroundColor=FFB6C1`
          };

          try {
            await setDoc(doc(db, 'staff', firebaseUser.uid), staffData);
          } catch (firestoreError: any) {
            if (firestoreError.code === 'permission-denied' || firestoreError.message?.includes('Missing or insufficient permissions')) {
              throw new Error("Firebase bloqueó el acceso. Ve a Firestore Database > Reglas y cambia a 'allow read, write: if true;'");
            }
            if (firestoreError.message?.includes("Database '(default)' not found") || firestoreError.code === 'not-found') {
              throw new Error("Firestore no está inicializado. Ve a la consola de Firebase > Firestore Database > Crear base de datos.");
            }
            throw firestoreError;
          }

          set({ user: staffData, isAuthenticated: true });
          
          // 🎀 Enterprise Fix
          window.location.href = '/dashboard';
          return true;
        } catch (error: any) {
          console.error("Error al registrar admin:", error);
          throw error; 
        }
      },

      logout: async () => {
        try {
          if (isFirebaseConfigured) {
            await signOut(auth);
          }
          
          // Limpiamos el estado local
          set({ user: null, isAuthenticated: false });
          
          // 🎀 Enterprise Reset: Forzamos la redirección al login y limpieza de memoria
          window.location.href = '/';
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
        }
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user || !user.roles) return false;
        return user.roles.some(role => 
          role.permissions.includes('*') || role.permissions.includes(permission)
        );
      },

      getHighestRole: () => {
        const { user } = get();
        if (!user || !user.roles || user.roles.length === 0) return null;
        return [...user.roles].sort((a, b) => b.priority - a.priority)[0];
      }
    }),
    {
      name: 'spa_auth_storage',
    }
  )
);

/**
 * 🎀 OPTIMIZACIÓN DE AUTH GUARD (Enterprise Tip)
 * Para que tu sistema sea 100% seguro, asegúrate de que en tu App.tsx
 * estés usando una lógica de rutas condicional basada en 'isAuthenticated'.
 * 
 * Si el usuario intenta entrar a una ruta manual y el store dice false,
 * el componente de Login debe ser lo único que se renderice.
 * 
 * Con 'window.location.href' eliminamos la necesidad del F5 para siempre.
 */
