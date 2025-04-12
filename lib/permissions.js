// En lib/permissions.js
import { supabase } from './supabase';

// Verificar si un usuario es supervisor de un asesor específico
export const esSupervisorDe = async (supervisorId, asesorId) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', asesorId)
    .eq('supervisor_id', supervisorId)
    .single();
    
  return !error && data;
};

// Verificar permisos para préstamos
export const prestamosPermisos = {
  puedeEditar: async (usuario, prestamo) => {
    if (!usuario || !prestamo) return false;
    
    // Administradores tienen acceso completo
    if (['administrador', 'admin_sistema'].includes(usuario.rol)) return true;
    
    // Supervisores pueden editar préstamos de asesores que supervisan
    if (usuario.rol === 'supervisor' && prestamo.cliente.asesor_id) {
      return await esSupervisorDe(usuario.id, prestamo.cliente.asesor_id);
    }
    
    // Por defecto, negar acceso
    return false;
  },
  
  puedeEliminar: async (usuario, prestamo) => {
    if (!usuario || !prestamo) return false;
    
    // Solo administradores pueden eliminar préstamos
    return ['administrador', 'admin_sistema'].includes(usuario.rol);
  },
  
  puedeRegistrarPago: async (usuario, prestamo) => {
    if (!usuario || !prestamo) return false;
    
    // Todos los roles pueden registrar pagos en préstamos activos
    if (prestamo.estado === 'activo') {
      // Administradores y supervisores tienen acceso general
      if (['administrador', 'admin_sistema', 'supervisor'].includes(usuario.rol)) return true;
      
      // Asesores solo pueden registrar pagos de sus propios clientes
      if (usuario.rol === 'asesor') {
        return prestamo.cliente.asesor_id === usuario.id;
      }
    }
    
    return false;
  }
};