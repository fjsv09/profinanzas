import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// Obtener todos los préstamos o filtrar por búsqueda/estado
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
    const search = searchParams.get('search');
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('cliente');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Construir la consulta
    let query = supabase
      .from('prestamos')
      .select(`
        *,
        clientes(id, nombre, apellido, dni, telefono)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros si existen
    if (search) {
      // Buscar en la relación de clientes
      query = query.or(`clientes.nombre.ilike.%${search}%,clientes.apellido.ilike.%${search}%,clientes.dni.ilike.%${search}%`);
    }

    if (estado && estado !== 'todos') {
      query = query.eq('estado', estado);
    }

    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener préstamos:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Obtener el total de préstamos para paginación (con los mismos filtros)
    let countQuery = supabase
      .from('prestamos')
      .select('*', { count: 'exact', head: true });

    if (estado && estado !== 'todos') {
      countQuery = countQuery.eq('estado', estado);
    }

    if (clienteId) {
      countQuery = countQuery.eq('cliente_id', clienteId);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Error al obtener conteo de préstamos:', countError);
    }

    return NextResponse.json({
      data,
      pagination: {
        total: totalCount || 0,
        page,
        limit,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Crear un nuevo préstamo
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
    if (!body.cliente_id || !body.monto || !body.interes || !body.total_cuotas || !body.frecuencia_pago) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Validar valores numéricos
    if (body.monto <= 0 || body.interes < 0 || body.total_cuotas <= 0) {
      return NextResponse.json(
        { error: 'Los valores numéricos deben ser positivos' },
        { status: 400 }
      );
    }

    // Verificar si el cliente existe
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', body.cliente_id)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json(
        { error: 'El cliente no existe' },
        { status: 400 }
      );
    }

    // Calcular monto total con interés
    const montoTotal = parseFloat(body.monto) * (1 + parseFloat(body.interes) / 100);

    // Preparar datos para insertar
    const prestamoData = {
      cliente_id: body.cliente_id,
      monto: parseFloat(body.monto),
      interes: parseFloat(body.interes),
      monto_total: parseFloat(montoTotal.toFixed(2)),
      frecuencia_pago: body.frecuencia_pago,
      total_cuotas: parseInt(body.total_cuotas),
      cuotas_pagadas: 0,
      estado: 'activo',
      fecha_inicio: new Date().toISOString(),
      created_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    // Crear el préstamo
    const { data, error } = await supabase
      .from('prestamos')
      .insert([prestamoData])
      .select();

    if (error) {
      console.error('Error al crear préstamo:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Actualizar historial de pagos del cliente basado en sus préstamos anteriores
    // Omitir esta actualización para simplificar el ejemplo

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Actualizar un préstamo existente
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
    
    // Validar ID de préstamo
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID de préstamo requerido' },
        { status: 400 }
      );
    }

    // Obtener préstamo actual para verificar que no esté completado
    const { data: existingPrestamo, error: existingError } = await supabase
      .from('prestamos')
      .select('*')
      .eq('id', body.id)
      .single();

    if (existingError || !existingPrestamo) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      );
    }

    if (existingPrestamo.estado === 'completado') {
      return NextResponse.json(
        { error: 'No se puede modificar un préstamo completado' },
        { status: 400 }
      );
    }

    // Preparar datos para actualizar
    let updateData = {};
    
    // Solo permitir actualizar ciertos campos
    if (body.monto !== undefined) updateData.monto = parseFloat(body.monto);
    if (body.interes !== undefined) updateData.interes = parseFloat(body.interes);
    if (body.total_cuotas !== undefined) updateData.total_cuotas = parseInt(body.total_cuotas);
    if (body.frecuencia_pago !== undefined) updateData.frecuencia_pago = body.frecuencia_pago;
    if (body.estado !== undefined) updateData.estado = body.estado;
    if (body.cuotas_pagadas !== undefined) updateData.cuotas_pagadas = parseInt(body.cuotas_pagadas);

    // Recalcular monto total si cambiaron monto o interés
    if (body.monto !== undefined || body.interes !== undefined) {
      const monto = body.monto !== undefined ? parseFloat(body.monto) : existingPrestamo.monto;
      const interes = body.interes !== undefined ? parseFloat(body.interes) : existingPrestamo.interes;
      updateData.monto_total = parseFloat((monto * (1 + interes / 100)).toFixed(2));
    }

    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = currentUser.id;

    // Actualizar el préstamo
    const { data, error } = await supabase
      .from('prestamos')
      .update(updateData)
      .eq('id', body.id)
      .select();

    if (error) {
      console.error('Error al actualizar préstamo:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Eliminar un préstamo
export async function DELETE(request) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener ID del préstamo
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de préstamo requerido' },
        { status: 400 }
      );
    }

    // Verificar si el préstamo tiene pagos registrados
    const { data: pagos, error: pagosError } = await supabase
      .from('pagos')
      .select('id')
      .eq('prestamo_id', id)
      .limit(1);

    if (pagosError) {
      console.error('Error al verificar pagos:', pagosError);
      return NextResponse.json(
        { error: 'Error al verificar pagos' },
        { status: 500 }
      );
    }

    if (pagos && pagos.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un préstamo con pagos registrados' },
        { status: 400 }
      );
    }

    // Eliminar préstamo
    const { error } = await supabase
      .from('prestamos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar préstamo:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Préstamo eliminado exitosamente' });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}