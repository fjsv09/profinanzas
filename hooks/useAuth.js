import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

/**
 * Hook personalizado para gestionar la autenticación en la aplicación
 * @returns {Object} Métodos y estado de autenticación
 */
export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Cargar el usuario al montar el componente
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        
        // Obtener la sesión de Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        
        // Si no hay sesión, establecer usuario como null
        if (!sessionData.session) {
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Obtener datos adicionales del usuario desde la tabla de usuarios
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single();
        
        if (userError) {
          console.error('Error al obtener datos de usuario:', userError);
          setError(userError);
          setUser(null);
        } else {
          // Combinar datos de autenticación con datos de perfil
          setUser({
            ...sessionData.session.user,
            ...userData
          });
        }
      } catch (err) {
        console.error('Error al obtener el usuario:', err);
        setError(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
    
    // Suscribirse a cambios en el estado de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          // Usuario inició sesión, obtener datos adicionales
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userError) {
            console.error('Error al obtener datos de usuario:', userError);
            setUser(null);
          } else {
            setUser({
              ...session.user,
              ...userData
            });
          }
        } else if (event === 'SIGNED_OUT') {
          // Usuario cerró sesión
          setUser(null);
          router.push('/login');
        } else if (event === 'TOKEN_REFRESHED') {
          // Token actualizado, actualizar usuario
          if (session) {
            setUser({
              ...session.user,
              ...(user || {})
            });
          }
        }
      }
    );
    
    // Limpieza al desmontar
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  /**
   * Iniciar sesión con email y contraseña
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   * @returns {Promise} Promesa que resuelve con el usuario autenticado
   */
  const signIn = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: true
        }
      });
      
      if (error) {
        toast.error('Credenciales incorrectas');
        setError(error);
        return null;
      }
      
      // Obtener datos adicionales del usuario
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError) {
        console.error('Error al obtener datos de usuario:', userError);
        toast.error('Error al cargar perfil de usuario');
        return data.user;
      }
      
      // Verificar si el usuario está activo
      if (!userData.activo) {
        toast.error('Su cuenta está desactivada. Contacte al administrador.');
        await supabase.auth.signOut();
        return null;
      }
      
      // Combinar datos de autenticación con datos de perfil
      const fullUser = {
        ...data.user,
        ...userData
      };
      
      setUser(fullUser);
      toast.success('Sesión iniciada correctamente');
      return fullUser;
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      toast.error('Error al iniciar sesión');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cerrar sesión
   * @returns {Promise} Promesa que resuelve cuando se cierra la sesión
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('Error al cerrar sesión');
        setError(error);
        return false;
      }
      
      setUser(null);
      toast.success('Sesión cerrada correctamente');
      router.push('/login');
      return true;
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      toast.error('Error al cerrar sesión');
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  /**
   * Registrar un nuevo usuario
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   * @param {Object} userData - Datos adicionales del usuario
   * @returns {Promise} Promesa que resuelve con el usuario registrado
   */
  const signUp = useCallback(async (email, password, userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Registrar usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) {
        toast.error(authError.message || 'Error al registrar usuario');
        setError(authError);
        return null;
      }
      
      // Guardar datos adicionales en la tabla de usuarios
      const { data: userRecord, error: userError } = await supabase
        .from('usuarios')
        .insert([
          {
            id: authData.user.id,
            email: email,
            nombre: userData.nombre,
            apellido: userData.apellido,
            rol: userData.rol || 'asesor',
            activo: true,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (userError) {
        toast.error('Error al guardar datos de usuario');
        setError(userError);
        // Eliminar usuario de auth si falla
        // Esto podría requerir un endpoint adicional en un sistema real
        return null;
      }
      
      toast.success('Usuario registrado correctamente');
      return { auth: authData, user: userRecord[0] };
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      toast.error('Error al registrar usuario');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verificar si el usuario actual tiene permiso para una ruta
   * @param {Array} requiredRoles - Roles requeridos para acceder
   * @returns {boolean} True si tiene permiso
   */
  const hasPermission = useCallback((requiredRoles = []) => {
    if (!user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(user.rol);
  }, [user]);

  /**
   * Verificar si un usuario puede acceder a una ruta específica según su rol
   * @param {string} route - Ruta a verificar
   * @returns {boolean} True si puede acceder
   */
  const canAccessRoute = useCallback((route) => {
    if (!user || !user.rol) return false;
    
    // Mapeo de roles a rutas permitidas
    const ROLE_ROUTES = {
      'admin_sistema': ['/dashboard', '/usuarios', '/configuracion', '/clientes', '/prestamos', '/cobranzas', '/finanzas', '/metas'],
      'administrador': ['/dashboard', '/clientes', '/prestamos', '/cobranzas', '/finanzas', '/metas'],
      'supervisor': ['/dashboard', '/clientes', '/prestamos', '/cobranzas', '/metas'],
      'asesor': ['/dashboard', '/clientes', '/prestamos', '/cobranzas']
    };
    
    const allowedRoutes = ROLE_ROUTES[user.rol] || [];
    
    // Verificar si la ruta comienza con alguna de las rutas permitidas
    return allowedRoutes.some(allowedRoute => 
      route === allowedRoute || route.startsWith(`${allowedRoute}/`)
    );
  }, [user]);

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    signUp,
    hasPermission,
    canAccessRoute
  };
}