import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// Obtener transacciones financieras con filtros (tipo, fecha)
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

    // Verificar si el usuario tiene permisos para acceder a finanzas
    if (currentUser.rol !== 'administrador' && currentUser.rol !== 'admin_sistema') {
      return NextResponse.json(
        { error: 'No tiene permisos para acceder a finanzas' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'ingreso', 'egreso' o null para todos
    const fechaInicio = searchParams.get('fecha_inicio');
    const fechaFin = searchParams.get('fecha_fin');
    const categoria = searchParams.get('categoria');
    const cuenta = searchParams.get('cuenta');
    const reporte = searchParams.get('reporte'); // Para solicitudes de reportes
    
    // Formatear fechas si se proporcionan
    const fechaInicioObj = fechaInicio ? new Date(fechaInicio) : null;
    const fechaFinObj = fechaFin ? new Date(fechaFin) : null;
    
    // Si es un reporte, devolver datos de resumen también
    if (reporte === 'true') {
      // 1. Obtener transacciones filtradas
      let query = supabase
        .from('transacciones')
        .select('*')
        .order('fecha', { ascending: false });

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      if (fechaInicioObj) {
        query = query.gte('fecha', fechaInicioObj.toISOString());
      }

      if (fechaFinObj) {
        // Ajustar la fecha fin para incluir todo el día
        fechaFinObj.setHours(23, 59, 59, 999);
        query = query.lte('fecha', fechaFinObj.toISOString());
      }

      if (categoria) {
        query = query.eq('categoria', categoria);
      }

      if (cuenta) {
        query = query.eq('cuenta', cuenta);
      }

      const { data: transacciones, error } = await query;

      if (error) {
        console.error('Error al obtener transacciones:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      // 2. Calcular totales
      const ingresos = transacciones.filter(t => t.tipo === 'ingreso');
      const egresos = transacciones.filter(t => t.tipo === 'egreso');
      
      const totalIngresos = ingresos.reduce((sum, t) => sum + t.monto, 0);
      const totalEgresos = egresos.reduce((sum, t) => sum + t.monto, 0);
      const balance = totalIngresos - totalEgresos;

      // 3. Calcular distribución por categoría
      const ingresosPorCategoria = {};
      const egresosPorCategoria = {};
      
      ingresos.forEach(t => {
        ingresosPorCategoria[t.categoria] = (ingresosPorCategoria[t.categoria] || 0) + t.monto;
      });
      
      egresos.forEach(t => {
        egresosPorCategoria[t.categoria] = (egresosPorCategoria[t.categoria] || 0) + t.monto;
      });

      // 4. Calcular saldos por cuenta
      const saldosPorCuenta = {
        caja: 0,
        yape: 0,
        banco: 0,
        otro: 0
      };

      transacciones.forEach(t => {
        if (t.tipo === 'ingreso') {
          saldosPorCuenta[t.cuenta] = (saldosPorCuenta[t.cuenta] || 0) + t.monto;
        } else {
          saldosPorCuenta[t.cuenta] = (saldosPorCuenta[t.cuenta] || 0) - t.monto;
        }
      });

      return NextResponse.json({
        ingresos,
        egresos,
        resumen: {
          totalIngresos,
          totalEgresos,
          balance
        },
        distribuciones: {
          ingresosPorCategoria,
          egresosPorCategoria,
          saldosPorCuenta
        }
      });
    }
    // Para consultas normales, solo devolver las transacciones
    else {
      let query = supabase
        .from('transacciones')
        .select('*')
        .order('fecha', { ascending: false });

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      if (fechaInicioObj) {
        query = query.gte('fecha', fechaInicioObj.toISOString());
      }

      if (fechaFinObj) {
        // Ajustar la fecha fin para incluir todo el día
        fechaFinObj.setHours(23, 59, 59, 999);
        query = query.lte('fecha', fechaFinObj.toISOString());
      }

      if (categoria) {
        query = query.eq('categoria', categoria);
      }

      if (cuenta) {
        query = query.eq('cuenta', cuenta);
      }

      const { data: transacciones, error } = await query;

      if (error) {
        console.error('Error al obtener transacciones:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: transacciones });
    }
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Registrar una nueva transacción financiera
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

    // Verificar si el usuario tiene permisos para registrar transacciones
    if (currentUser.rol !== 'administrador' && currentUser.rol !== 'admin_sistema') {
      return NextResponse.json(
        { error: 'No tiene permisos para registrar transacciones' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validar datos obligatorios
    if (!body.tipo || !body.monto || !body.categoria || !body.cuenta) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Validar tipo de transacción
    if (body.tipo !== 'ingreso' && body.tipo !== 'egreso') {
      return NextResponse.json(
        { error: 'Tipo de transacción no válido' },
        { status: 400 }
      );
    }

    // Validar monto
    if (parseFloat(body.monto) <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a cero' },
        { status: 400 }
      );
    }

    // Preparar datos de la transacción
    const transaccionData = {
      tipo: body.tipo,
      monto: parseFloat(body.monto),
      categoria: body.categoria,
      descripcion: body.descripcion || '',
      cuenta: body.cuenta,
      fecha: body.fecha || new Date().toISOString(),
      created_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    // Registrar la transacción
    const { data, error } = await supabase
      .from('transacciones')
      .insert([transaccionData])
      .select();

    if (error) {
      console.error('Error al registrar transacción:', error);
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

// Endpoint para obtener el balance actual
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

    // Verificar si el usuario tiene permisos
    if (currentUser.rol !== 'administrador' && currentUser.rol !== 'admin_sistema') {
      return NextResponse.json(
        { error: 'No tiene permisos para acceder a esta información' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { accion } = body;

    // Si la acción es obtener el balance actual
    if (accion === 'balance') {
      // Obtener todas las transacciones
      const { data: transacciones, error } = await supabase
        .from('transacciones')
        .select('*');

      if (error) {
        console.error('Error al obtener transacciones:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      // Calcular ingresos y egresos
      const ingresos = transacciones.filter(t => t.tipo === 'ingreso');
      const egresos = transacciones.filter(t => t.tipo === 'egreso');
      
      const totalIngresos = ingresos.reduce((sum, t) => sum + t.monto, 0);
      const totalEgresos = egresos.reduce((sum, t) => sum + t.monto, 0);
      const balance = totalIngresos - totalEgresos;

      // Calcular saldos por cuenta
      const saldos = {
        efectivo: 0,
        yape: 0,
        banco: 0,
        otro: 0
      };

      transacciones.forEach(t => {
        if (t.tipo === 'ingreso') {
          saldos[t.cuenta] = (saldos[t.cuenta] || 0) + t.monto;
        } else {
          saldos[t.cuenta] = (saldos[t.cuenta] || 0) - t.monto;
        }
      });

      return NextResponse.json({
        balance,
        saldos,
        ingresos: totalIngresos,
        egresos: totalEgresos
      });
    }
    
    return NextResponse.json(
      { error: 'Acción no válida' },
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

// Exportar reporte financiero
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

    // Verificar si el usuario tiene permisos
    if (currentUser.rol !== 'administrador' && currentUser.rol !== 'admin_sistema') {
      return NextResponse.json(
        { error: 'No tiene permisos para exportar reportes' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'excel', 'pdf'
    const periodo = searchParams.get('periodo'); // 'mes', 'trimestre', 'anual'
    const fechaInicio = searchParams.get('fecha_inicio');
    const fechaFin = searchParams.get('fecha_fin');

    if (!tipo || !periodo) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios' },
        { status: 400 }
      );
    }

    // Lógica para generar el reporte (en un sistema real, esto generaría un archivo)
    // Aquí solo simularemos el proceso

    return NextResponse.json({
      message: 'Reporte exportado exitosamente',
      datos: {
        tipo,
        periodo,
        fechaInicio,
        fechaFin
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