import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// Obtener todos los clientes o filtrar por búsqueda
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Construir la consulta
    let query = supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtro de búsqueda si existe
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,dni.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error al obtener clientes:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Obtener el total de clientes para paginación
    const { count: totalCount, error: countError } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error al obtener conteo de clientes:', countError);
    }

    return NextResponse.json({
      data,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
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

// Crear un nuevo cliente
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
    if (!body.nombre || !body.apellido || !body.dni || !body.telefono || !body.direccion) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Validar formato de DNI (8 dígitos)
    if (!/^\d{8}$/.test(body.dni)) {
      return NextResponse.json(
        { error: 'El DNI debe tener 8 dígitos numéricos' },
        { status: 400 }
      );
    }

    // Validar formato de teléfono (9 dígitos)
    if (!/^\d{9}$/.test(body.telefono)) {
      return NextResponse.json(
        { error: 'El teléfono debe tener 9 dígitos numéricos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un cliente con el mismo DNI
    const { data: existingClient, error: checkError } = await supabase
      .from('clientes')
      .select('id')
      .eq('dni', body.dni)
      .maybeSingle();

    if (checkError) {
      console.error('Error al verificar DNI:', checkError);
      return NextResponse.json(
        { error: 'Error al verificar DNI' },
        { status: 500 }
      );
    }

    if (existingClient) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este DNI' },
        { status: 409 }
      );
    }

    // Preparar datos para insertar
    const clienteData = {
      ...body,
      historial_pagos: body.historial_pagos || 'Nuevo',
      created_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    // Crear el cliente
    const { data, error } = await supabase
      .from('clientes')
      .insert([clienteData])
      .select();

    if (error) {
      console.error('Error al crear cliente:', error);
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

// Route handler para cliente específico por ID
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

    // Obtener ID del cliente
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      );
    }

    // Verificar si el cliente tiene préstamos activos
    const { data: prestamos, error: prestamosError } = await supabase
      .from('prestamos')
      .select('id')
      .eq('cliente_id', id)
      .eq('estado', 'activo');

    if (prestamosError) {
      console.error('Error al verificar préstamos:', prestamosError);
      return NextResponse.json(
        { error: 'Error al verificar préstamos' },
        { status: 500 }
      );
    }

    if (prestamos && prestamos.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente con préstamos activos' },
        { status: 400 }
      );
    }

    // Eliminar cliente
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar cliente:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Actualizar un cliente existente
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
    
    // Validar ID de cliente
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      );
    }

    // Validar datos obligatorios
    if (!body.nombre || !body.apellido || !body.telefono || !body.direccion) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Validar formato de teléfono (9 dígitos)
    if (!/^\d{9}$/.test(body.telefono)) {
      return NextResponse.json(
        { error: 'El teléfono debe tener 9 dígitos numéricos' },
        { status: 400 }
      );
    }

    // Preparar datos para actualizar (no permitir cambiar el DNI)
    const { id, dni, created_at, created_by, ...updateData } = body;
    
    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = currentUser.id;

    // Actualizar el cliente
    const { data, error } = await supabase
      .from('clientes')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error al actualizar cliente:', error);
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