import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// Obtener pagos realizados o pendientes para hoy
export async function GET(request) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'realizados'; // 'realizados' o 'pendientes'
    const fecha = searchParams.get('fecha'); // formato: YYYY-MM-DD
    const prestamoId = searchParams.get('prestamo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Para pagos realizados
    if (tipo === 'realizados') {
      let query = supabase
        .from('pagos')
        .select(`
          *,
          prestamos(id, cliente_id),
          prestamos.clientes(id, nombre, apellido, dni)
        `)
        .order('fecha_pago', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros si existen
      if (fecha) {
        // Filtrar por fecha específica
        const fechaInicio = new Date(fecha);
        fechaInicio.setHours(0, 0, 0, 0);
        
        const fechaFin = new Date(fecha);
        fechaFin.setHours(23, 59, 59, 999);

        query = query
          .gte('fecha_pago', fechaInicio.toISOString())
          .lte('fecha_pago', fechaFin.toISOString());
      }

      if (prestamoId) {
        query = query.eq('prestamo_id', prestamoId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener pagos:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      // Formatear los datos para facilitar su uso en el frontend
      const formattedData = data.map(pago => ({
        id: pago.id,
        prestamo_id: pago.prestamo_id,
        cliente: `${pago.prestamos.clientes.nombre} ${pago.prestamos.clientes.apellido}`,
        cliente_id: pago.prestamos.clientes.id,
        monto: pago.monto,
        fecha_pago: pago.fecha_pago,
        metodo_pago: pago.metodo_pago,
        comentario: pago.comentario,
        created_at: pago.created_at,
        created_by: pago.created_by
      }));

      return NextResponse.json({
        data: formattedData,
        pagination: {
          page,
          limit,
          total: formattedData.length
        }
      });
    }
    // Para pagos pendientes (cuotas por cobrar hoy)
    else if (tipo === 'pendientes') {
      // Obtener la fecha actual si no se especifica
      const hoy = fecha ? new Date(fecha) : new Date();
      hoy.setHours(0, 0, 0, 0);
      
      // Obtener préstamos activos
      const { data: prestamosActivos, error: prestamosError } = await supabase
        .from('prestamos')
        .select(`
          id, 
          monto_total, 
          total_cuotas, 
          cuotas_pagadas, 
          fecha_inicio, 
          frecuencia_pago,
          cliente_id,
          clientes(id, nombre, apellido, dni)
        `)
        .eq('estado', 'activo');

      if (prestamosError) {
        console.error('Error al obtener préstamos activos:', prestamosError);
        return NextResponse.json(
          { error: prestamosError.message },
          { status: 500 }
        );
      }

      // Calcular cuotas pendientes para hoy
      const cuotasPendientes = [];
      
      prestamosActivos.forEach(prestamo => {
        // Calcular monto de cuota
        const montoCuota = prestamo.monto_total / prestamo.total_cuotas;
        
        // Determinar si tiene una cuota pendiente hoy
        const fechaInicio = new Date(prestamo.fecha_inicio);
        const incrementoDias = {
          'diario': 1,
          'semanal': 7,
          'quincenal': 15,
          'mensual': 30
        };
        
        // Calcular la fecha de la próxima cuota
        const diasIncremento = incrementoDias[prestamo.frecuencia_pago] || 1;
        const proximaCuota = new Date(fechaInicio);
        proximaCuota.setDate(proximaCuota.getDate() + (prestamo.cuotas_pagadas * diasIncremento));
        
        // Si la próxima cuota es hoy o está atrasada, agregarla a las pendientes
        if (proximaCuota <= hoy) {
          cuotasPendientes.push({
            id: cuotasPendientes.length + 1, // ID temporal
            prestamo_id: prestamo.id,
            cliente: `${prestamo.clientes.nombre} ${prestamo.clientes.apellido}`,
            cliente_id: prestamo.cliente_id,
            monto: parseFloat(montoCuota.toFixed(2)),
            fecha_esperada: proximaCuota.toISOString(),
            dias_atraso: Math.floor((hoy - proximaCuota) / (1000 * 60 * 60 * 24))
          });
        }
      });

      return NextResponse.json({
        data: cuotasPendientes,
        pagination: {
          page: 1,
          limit: cuotasPendientes.length,
          total: cuotasPendientes.length
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Tipo de consulta no válido' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Registrar un nuevo pago
export async function POST(request) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar datos obligatorios
    if (!body.prestamo_id || !body.monto || !body.metodo_pago) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Validar que el monto sea positivo
    if (parseFloat(body.monto) <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a cero' },
        { status: 400 }
      );
    }

    // Verificar si el préstamo existe y está activo
    const { data: prestamo, error: prestamoError } = await supabase
      .from('prestamos')
      .select('*')
      .eq('id', body.prestamo_id)
      .single();

    if (prestamoError || !prestamo) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      );
    }

    if (prestamo.estado !== 'activo') {
      return NextResponse.json(
        { error: 'Solo se pueden registrar pagos en préstamos activos' },
        { status: 400 }
      );
    }

    // Verificar que no se hayan pagado todas las cuotas
    if (prestamo.cuotas_pagadas >= prestamo.total_cuotas) {
      return NextResponse.json(
        { error: 'Todas las cuotas ya han sido pagadas' },
        { status: 400 }
      );
    }

    // Preparar datos del pago
    const pagoData = {
      prestamo_id: body.prestamo_id,
      monto: parseFloat(body.monto),
      fecha_pago: body.fecha_pago || new Date().toISOString(),
      metodo_pago: body.metodo_pago,
      comentario: body.comentario || '',
      created_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    // Iniciar una transacción para asegurar consistencia
    // 1. Registrar el pago
    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .insert([pagoData])
      .select();

    if (pagoError) {
      console.error('Error al registrar pago:', pagoError);
      return NextResponse.json(
        { error: pagoError.message },
        { status: 500 }
      );
    }

    // 2. Actualizar el préstamo (incrementar cuotas_pagadas)
    const nuevasCuotasPagadas = prestamo.cuotas_pagadas + 1;
    const nuevoEstado = nuevasCuotasPagadas >= prestamo.total_cuotas ? 'completado' : 'activo';
    
    const { error: updateError } = await supabase
      .from('prestamos')
      .update({
        cuotas_pagadas: nuevasCuotasPagadas,
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
        updated_by: currentUser.id
      })
      .eq('id', prestamo.id);

    if (updateError) {
      console.error('Error al actualizar préstamo:', updateError);
      // Intentar revertir el pago registrado
      await supabase
        .from('pagos')
        .delete()
        .eq('id', pago[0].id);
        
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Si se completó el préstamo, registrarlo en las transacciones financieras
    if (nuevoEstado === 'completado') {
      // Esta parte sería implementada en un sistema real
      console.log('Préstamo completado:', prestamo.id);
    }

    return NextResponse.json(pago[0], { status: 201 });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Ruta para cuadre de caja
export async function PUT(request) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar datos obligatorios
    if (
      body.monto_efectivo === undefined || 
      body.monto_yape === undefined || 
      body.monto_transferencia === undefined || 
      body.monto_otro === undefined
    ) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que los montos sean números válidos
    const montoEfectivo = parseFloat(body.monto_efectivo);
    const montoYape = parseFloat(body.monto_yape);
    const montoTransferencia = parseFloat(body.monto_transferencia);
    const montoOtro = parseFloat(body.monto_otro);
    
    if (
      isNaN(montoEfectivo) || 
      isNaN(montoYape) || 
      isNaN(montoTransferencia) || 
      isNaN(montoOtro)
    ) {
      return NextResponse.json(
        { error: 'Los montos deben ser valores numéricos' },
        { status: 400 }
      );
    }

    // Calcular monto total
    const montoTotal = montoEfectivo + montoYape + montoTransferencia + montoOtro;

    // Preparar datos del cuadre de caja
    const cuadreData = {
      fecha: body.fecha || new Date().toISOString().split('T')[0],
      monto_efectivo: montoEfectivo,
      monto_yape: montoYape,
      monto_transferencia: montoTransferencia,
      monto_otro: montoOtro,
      monto_total: montoTotal,
      diferencia: body.diferencia || 0,
      comentarios: body.comentarios || '',
      estado: 'pendiente', // Pendiente de aprobación por el administrador
      created_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    // Registrar el cuadre de caja
    const { data, error } = await supabase
      .from('cuadres_caja')
      .insert([cuadreData])
      .select();

    if (error) {
      console.error('Error al registrar cuadre de caja:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}