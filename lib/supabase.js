import { createClient } from '@supabase/supabase-js';

// Estas variables deben estar en tu archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Crear el cliente de Supabase
// Opciones explícitas para manejo de cookies
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Funciones para la gestión de clientes
export const clientesService = {
  // Obtener clientes según el rol y usuario
  getAll: async (usuario) => {
    let query = supabase.from('clientes').select('*');
    
    // Aplicar filtros según el rol del usuario
    if (usuario.rol === 'asesor') {
      // El asesor solo ve sus clientes asignados
      query = query.eq('asesor_id', usuario.id);
    } else if (usuario.rol === 'supervisor') {
      // El supervisor ve los clientes de los asesores que supervisa
      // Primero obtenemos los IDs de los asesores bajo su supervisión
      const { data: asesores } = await supabase
        .from('usuarios')
        .select('id')
        .eq('supervisor_id', usuario.id);
      
      if (asesores && asesores.length > 0) {
        const asesorIds = asesores.map(asesor => asesor.id);
        query = query.in('asesor_id', asesorIds);
      } else {
        // Si no hay asesores, devolver array vacío
        return [];
      }
    }
    // Para administradores y admin_sistema, no aplicamos filtro (ven todos)
    
    // Ordenar por fecha de creación
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  
  // Obtener un cliente por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Crear un nuevo cliente
  create: async (clienteData) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{...clienteData}]) //Agregar datos
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Actualizar un cliente
  update: async (id, clienteData) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update(clienteData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Eliminar un cliente
  delete: async (id) => {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Funciones para la gestión de préstamos
export const prestamosService = {
    // Obtener todos los préstamos según permisos
    getAll: async (usuario) => {
      let query = supabase.from('prestamos').select('*, clientes(*)');
      
      // Aplicar filtros según el rol del usuario
      if (usuario.rol === 'asesor') {
        // El asesor solo ve préstamos de sus clientes
        query = query.in('cliente_id', function(subQuery) {
          return subQuery.from('clientes').select('id').eq('asesor_id', usuario.id);
        });
      } else if (usuario.rol === 'supervisor') {
        // Obtener IDs de asesores supervisados
        const { data: asesores } = await supabase
          .from('usuarios')
          .select('id')
          .eq('supervisor_id', usuario.id);
        
        if (asesores && asesores.length > 0) {
          const asesorIds = asesores.map(asesor => asesor.id);
          // Filtrar clientes por estos asesores
          query = query.in('cliente_id', function(subQuery) {
            return subQuery.from('clientes').select('id').in('asesor_id', asesorIds);
          });
        } else {
          return [];
        }
      }
      // Administradores ven todos
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  
  // Obtener préstamos por cliente
  getByCliente: async (clienteId) => {
    const { data, error } = await supabase
      .from('prestamos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Obtener un préstamo por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('prestamos')
      .select('*, clientes(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Crear un nuevo préstamo
  create: async (prestamoData) => {
    const { data, error } = await supabase
      .from('prestamos')
      .insert([prestamoData])
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  // Actualizar un préstamo
  update: async (id, prestamoData) => {
    const { data, error } = await supabase
      .from('prestamos')
      .update(prestamoData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Obtener préstamos por estado de aprobación
  getByEstadoAprobacion: async (estadoAprobacion) => {
    const { data, error } = await supabase
      .from('prestamos')
      .select('*, clientes(*), usuarios!asesor_id(*)')
      .eq('estado_aprobacion', estadoAprobacion)
      .order('fecha_solicitud', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Aprobar un préstamo
  aprobarPrestamo: async (id, datosAprobacion) => {
    const { data, error } = await supabase
      .from('prestamos')
      .update({
        estado_aprobacion: 'aprobado',
        aprobado_por: datosAprobacion.aprobado_por,
        fecha_aprobacion: datosAprobacion.fecha_aprobacion,
        estado: 'activo' // Cambia el estado del préstamo a activo
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Rechazar un préstamo
  rechazarPrestamo: async (id, datosRechazo) => {
    const { data, error } = await supabase
      .from('prestamos')
      .update({
        estado_aprobacion: 'rechazado',
        aprobado_por: datosRechazo.aprobado_por,
        fecha_aprobacion: datosRechazo.fecha_aprobacion,
        comentarios_aprobacion: datosRechazo.comentarios_aprobacion,
        estado: 'rechazado' // Cambia el estado del préstamo a rechazado
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

// Funciones para la gestión de pagos y cobranzas
export const pagosService = {
  // Obtener todos los pagos
  getAll: async () => {
    const { data, error } = await supabase
      .from('pagos')
      .select('*, prestamos(*), clientes(*)')
      .order('fecha_pago', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Obtener pagos por préstamo
  getByPrestamo: async (prestamoId) => {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('prestamo_id', prestamoId)
      .order('fecha_pago', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Registrar un nuevo pago
  create: async (pagoData) => {
    const { data, error } = await supabase
      .from('pagos')
      .insert([pagoData])
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

// Funciones para la gestión financiera
export const finanzasService = {
  // Obtener todas las transacciones
  getTransacciones: async (filtros = {}) => {
    let query = supabase
      .from('transacciones')
      .select('*')
      .order('fecha', { ascending: false });
    
    // Aplicar filtros si existen
    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo);
    }
    
    if (filtros.fecha_inicio && filtros.fecha_fin) {
      query = query.gte('fecha', filtros.fecha_inicio).lte('fecha', filtros.fecha_fin);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },
  
  // Registrar una nueva transacción
  createTransaccion: async (transaccionData) => {
    const { data, error } = await supabase
      .from('transacciones')
      .insert([transaccionData])
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

// Funciones para la gestión de metas
export const metasService = {
  // Obtener metas por asesor y periodo
  getByAsesorYPeriodo: async (asesorId, periodo) => {
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('asesor_id', asesorId)
      .eq('periodo', periodo)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // No resulta en error si no encuentra
    return data;
  },
  
  // Crear o actualizar meta
  upsert: async (metaData) => {
    const { data, error } = await supabase
      .from('metas')
      .upsert([metaData])
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  // Obtener desempeño de metas para todos los asesores
  getDesempeño: async (periodo) => {
    const { data, error } = await supabase
      .from('metas')
      .select('*, usuarios!inner(*)')
      .eq('periodo', periodo);
    
    if (error) throw error;
    return data;
  }
};

// Funciones para la gestión de usuarios
export const usuariosService = {
  // Obtener todos los usuarios
  getAll: async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Obtener un usuario por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Crear un nuevo usuario
  create: async (userData) => {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([userData])
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  // Actualizar un usuario
  update: async (id, userData) => {
    const { data, error } = await supabase
      .from('usuarios')
      .update(userData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }
};