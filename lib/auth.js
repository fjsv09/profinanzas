import { supabase } from './supabase';
import jwt from 'jsonwebtoken';

// Función para iniciar sesión
export const signIn = async (email, password) => {
  // Usar la opción de persistencia explícitamente
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      persistSession: true // Asegurarse de que la sesión persista
    }
  });

  if (error) throw error;

  // Verificar si la sesión se creó correctamente
  //const { data: sessionCheck } = await supabase.auth.getSession();
  //console.log("Sesión después de login:", sessionCheck);

  return data;
};

// Función para cerrar sesión
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
};

// Función para registrar un nuevo usuario
export const signUp = async (email, password, userData) => {
  // Primero crear el usuario en Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // Luego guardar los datos adicionales en la tabla usuarios
  const { data: userRecord, error: userError } = await supabase
    .from('usuarios')
    .insert([
      {
        id: authData.user.id,
        email: email,
        nombre: userData.nombre,
        apellido: userData.apellido,
        rol: userData.rol || 'asesor', // Por defecto es asesor
        activo: true
      }
    ])
    .select();

  if (userError) throw userError;
  return { auth: authData, user: userRecord[0] };
};

// Función para obtener el usuario actual
export const getCurrentUser = async () => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;

  // Obtener datos adicionales del usuario
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', sessionData.session.user.id)
    .single();

  if (userError) throw userError;

  return {
    ...sessionData.session.user,
    ...userData
  };
};

// Función para verificar si un usuario tiene permisos para acceder a una ruta
export const hasPermission = (user, requiredRoles) => {
  if (!user) return false;
  if (!requiredRoles || requiredRoles.length === 0) return true;

  return requiredRoles.includes(user.rol);
};

// Función para generar un token JWT con los datos del usuario
export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      rol: user.rol
    },
    secret,
    { expiresIn: '8h' }
  );
};

// Función para verificar un token JWT
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// Mapeo de roles a rutas permitidas
export const ROLE_ROUTES = {
  'admin_sistema': ['/dashboard', '/usuarios', '/configuracion', '/clientes', '/prestamos', '/cobranzas', '/finanzas', '/metas'],
  'administrador': ['/dashboard', '/clientes', '/prestamos', '/cobranzas', '/finanzas', '/metas'],
  'supervisor': ['/dashboard', '/clientes', '/prestamos', '/cobranzas', '/metas'],
  'asesor': ['/dashboard', '/clientes', '/prestamos', '/cobranzas']
};

// Función para verificar si un usuario puede acceder a una ruta específica
export const canAccessRoute = (user, route) => {
  if (!user || !user.rol) return false;
  const allowedRoutes = ROLE_ROUTES[user.rol] || [];

  // Verificar si la ruta actual comienza con alguna de las rutas permitidas
  const baseAccess = allowedRoutes.some(allowedRoute =>
    route === allowedRoute || route.startsWith(`${allowedRoute}/`)
  );

  // Si la ruta es para un cliente específico, verificar también permisos de acceso a ese cliente
  if (baseAccess && route.startsWith('/clientes/') && user.rol === 'asesor') {
    // En un sistema real, aquí verificaríamos si el cliente pertenece al asesor
    // Esto requeriría una modificación adicional en los controladores de cliente
    return true; // Simplificado para el ejemplo
  }

  return baseAccess;
};