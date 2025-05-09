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
  getAll: async (user) => {
    let query = supabase.from('clientes').select('*');
    const {rol, id} = user;

    // Aplicar filtros según el rol del usuario
    if (rol === 'asesor') {
      // El asesor solo ve sus clientes asignados
      query = query.eq('asesor_id', id);
    } else if (rol === 'supervisor') {
      // El supervisor ve los clientes de los asesores que supervisa
      // Primero obtenemos los IDs de los asesores bajo su supervisión
      const { data: asesores} = await supabase
        .from('usuarios')
        .select('id')
        .eq('supervisor_id', id);      
  
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
    return data || [];
  },
  
  // Obtener un cliente por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('clientes').select('*, usuarios!clientes_asesor_id_fkey(*)').limit(1)
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
        .select('*')
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
        .select('*')
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
      .select('*')
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Funciones para la gestión de préstamos
// Función para calcular las cuotas pagadas de un préstamo
const calcularCuotasPagadas = async (p_prestamo_id) => {
  const { data, error } = await supabase.rpc('calcular_cuotas_pagadas', {
      p_prestamo_id: p_prestamo_id,
  });

  if (error) {
      throw error;
  }

  return data || 0;
};


// Función para verificar si un préstamo está atrasado y cuántos días
const verificarSiPrestamoAtrasado = async (p_prestamo_id) => {
  const { data, error } = await supabase.rpc('verificar_si_prestamo_atrasado', {
    p_prestamo_id: p_prestamo_id,
  });

  if (error) {
    throw error;
  }

  return data && data.length > 0 ? {atrasado: true, dias_retraso: data[0].dias_retraso} : {atrasado: false, dias_retraso: 0};
};

// Función para verificar si un préstamo está completado
const verificarSiPrestamoCompletado = async (p_prestamo_id) => {
  const { data, error } = await supabase.rpc('verificar_si_prestamo_completado', {
    p_prestamo_id: p_prestamo_id,
  });

  if (error) {
    throw error;
  }

  return data && data.length > 0 ? true : false;
};
export const prestamosService = {
  // Obtener todos los préstamos según permisos(con sus clientes)
  getAll: async (user) => {
    let query = supabase.from('prestamos').select('*, clientes(*), detalles_pago(*)');
    const { rol, id } = user;
    const clienteIdFilters = [];

    // Aplicar filtros según el rol del usuario
    if (rol === 'asesor') {
      // El asesor solo ve préstamos de sus clientes
      const { data: clientesAsesor } = await supabase
      .from('clientes')
      .select('id')
      .eq('asesor_id', id);
      
      if (clientesAsesor && clientesAsesor.length > 0) {
        clientesAsesor.map((cliente) => clienteIdFilters.push(cliente.id))
      }
    } else if (rol === 'supervisor') {
      // Obtener IDs de asesores supervisados
      const { data: asesores } = await supabase
        .from('usuarios')
        .select('id')
        .eq('supervisor_id', id);

      if (asesores && asesores.length > 0) {
         const asesorIds = asesores.map(asesor => asesor.id);
        
        // Obtener los clientes de los asesores supervisados
        const { data: clientes } = await supabase
          .from('clientes')
          .select('id')
          .in('asesor_id', asesorIds);
          if(clientes){
            clientes.map((cliente) => clienteIdFilters.push(cliente.id))
          }


        if (clientes && clientes.length > 0) {
          const clienteIds = clientes.map(cliente => cliente.id);
          // Filtrar préstamos por los clientes de los asesores supervisados
          query = query.in('cliente_id', clienteIds);
        }
      } else {
        // Si no hay asesores, no se aplica el filtro, se veran todos

      }
    }
    if(clienteIdFilters.length > 0){
      query = query.in('cliente_id', clienteIdFilters)
    }
    // Administradores ven todos

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    // Procesamiento por cada préstamo
    const prestamosConDatos = await Promise.all(
      data.map(async (prestamo) => {
        const cuotas_pagadas = await calcularCuotasPagadas(prestamo.id);
        const {atrasado, dias_retraso} = await verificarSiPrestamoAtrasado(prestamo.id);
        const completado = await verificarSiPrestamoCompletado(prestamo.id);

        let estadoCalculado = '';

        if (atrasado) {
          estadoCalculado = 'atrasado';
          await supabase
          .from('prestamos')
          .update({ estado: 'atrasado' })
          .eq('id', prestamo.id);
        } else if(completado){
          estadoCalculado = 'completado';
          await supabase
          .from('prestamos')
          .update({ estado: 'completado' })
          .eq('id', prestamo.id);
        } else if(prestamo.estado !== "inactivo"){
          estadoCalculado = 'activo';
        }

        // Devolver un nuevo objeto con los datos calculados
        return {
          ...prestamo,
          cuotas_pagadas,
          estadoCalculado,
          dias_retraso
        };
      })
    );
     // Si hay préstamos, obtenemos los datos de usuarios
     if (prestamosConDatos && prestamosConDatos.length > 0) {
      const usuariosIds = prestamosConDatos.map(prestamo => prestamo.created_by); // Asumiendo que tienes el ID del usuario en created_by
      const { data: usuarios, error: errorUsuarios } = await supabase
        .from('usuarios')
        .select('*')
        .in('id', usuariosIds);

      if (errorUsuarios) throw errorUsuarios;

      // Asociamos los datos del usuario a cada préstamo
      const prestamosConUsuarios = prestamosConDatos.map(prestamo => ({
        ...prestamo,
        usuario: usuarios?.find(usuario => usuario.id === prestamo.created_by)
      }));
      return prestamosConUsuarios;
    }
    return prestamosConDatos || [];
  },  

  // Obtener el conteo de préstamos con estado 'pendiente_aprobacion'
  getPendingApprovalsCount: async () => {
    const { count, error } = await supabase
      .from('prestamos')
      .select('*', { count: 'exact', head: true })
      .eq('estado_aprobacion', 'pendiente_aprobacion');

    if (error) {
      throw error;
    }

    return count;
  },
  
  // Obtener préstamos por cliente
  getByCliente: async (clienteId) => {
    const { data, error } = await supabase
      .from('prestamos')
      .select('*, clientes(*)')
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
      .select('*');
    
    if (error) throw error;
    return data[0];
  },
  
  // Actualizar un préstamo
  update: async (id, prestamoData) => {
    const { data, error } = await supabase
      .from('prestamos')
      .update(prestamoData)
        .select('*')
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },
    // Procesar solicitud
    procesarSolicitud: async (id, datosAccion) => {
        const { estado, comentarios, aprobador_id } = datosAccion;
        const datos = {
            aprobado_por: aprobador_id,
            created_by: aprobador_id,
            fecha_aprobacion: new Date().toISOString(),
            comentarios_aprobacion: comentarios,
        }
        if (estado === 'aprobado') {
            return await prestamosService.aprobarPrestamo(id, datos);
        } else if (estado === 'rechazado') {
            return await prestamosService.rechazarPrestamo(id, datos);
        }
    },
  getSolicitudesPendientes: async () => {
    const data = await prestamosService.getByEstadoAprobacion('pendiente_aprobacion');
    
    return data;
  },
  getHistorialAprobaciones: async () => {
    const dataAprobados = await prestamosService.getByEstadoAprobacion('aprobado');
    const dataRechazados = await prestamosService.getByEstadoAprobacion('rechazado');
    const data = [...dataAprobados, ...dataRechazados].sort((a,b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));
    
    return data;
  },

  // Obtener préstamos por estado de aprobación
  getByEstadoAprobacion: async (estadoAprobacion) => {
    const { data, error } = await supabase
      .from('prestamos')
      .select('*, cliente: clientes(*), solicitado_por: usuarios!prestamos_created_by_fkey(*), aprobado_por: usuarios!prestamos_aprobado_por_fkey(*)')
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
        created_by: datosAprobacion.created_by,
        fecha_aprobacion: datosAprobacion.fecha_aprobacion,
        comentarios_aprobacion: datosAprobacion.comentarios_aprobacion,
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
        created_by: datosRechazo.created_by,
        fecha_aprobacion: datosRechazo.fecha_aprobacion,
        comentarios_aprobacion: datosRechazo.comentarios_aprobacion,
        //estado: 'atrazado' // Cambia el estado del préstamo a rechazado
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
      .select('*, prestamos(*), clientes(*), usuarios!pagos_created_by_fkey(*)')
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
        .select('*')
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
      .select('*')
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
      .select('*')
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
      .select('*')
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  // Actualizar un usuario
  update: async (id, userData) => {
    const { data, error } = await supabase
      .from('usuarios')
      .update(userData)
        .select('*')
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }
};
