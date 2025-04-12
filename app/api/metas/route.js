import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// Obtener metas con parámetros de filtro
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

    // Verificar si el usuario tiene permisos para ver metas
    if (!['administrador', 'supervisor', 'admin_sistema'].includes(currentUser.rol)) {
      return NextResponse.json(
        { error: 'No tiene permisos para acceder a metas' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const asesorId = searchParams.get('asesor');
    const periodo = searchParams.get('periodo');
    const reporte = searchParams.get('reporte') === 'true';

    // Validar que al menos uno de los filtros esté presente
    if (!periodo && !asesorId && !reporte) {
      return NextResponse.json(
        { error: 'Debe especificar al menos un filtro (periodo, asesor o reporte)' },
        { status: 400 }
      );
    }

    // Construir la consulta base
    let query = supabase
      .from('metas')
      .select(`
        *,
        asesores:usuarios(id, nombre, apellido, email, rol)
      `);

    // Aplicar filtros
    if (asesorId) {
      query = query.eq('asesor_id', asesorId);
    }

    if (periodo) {
      query = query.eq('periodo', periodo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener metas:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Si es un reporte, agregar información adicional
    if (reporte) {
      // Procesar datos para formato de reporte
      const asesoresData = data.map(meta => {
        // Calcular porcentajes de cumplimiento
        const clientesPorcentaje = meta.meta_clientes > 0 
          ? (meta.clientes_captados / meta.meta_clientes) * 100 
          : 0;
        
        const cobranzaPorcentaje = meta.meta_cobranza > 0 
          ? (meta.cobranza_realizada / meta.meta_cobranza) * 100 
          : 0;
        
        const morosidadPorcentaje = meta.meta_morosidad > 0 
          ? (meta.morosidad_actual / meta.meta_morosidad) * 100 
          : 0;
        
        const carteraPorcentaje = meta.meta_cartera > 0 
          ? (meta.cartera_actual / meta.meta_cartera) * 100 
          : 0;

        // Calcular promedio de cumplimiento (excluyendo morosidad)
        const promedioCumplimiento = (clientesPorcentaje + cobranzaPorcentaje + carteraPorcentaje) / 3;

        // Determinar tipo de bonificación
        let bonificacion = 'mejorable';
        if (promedioCumplimiento >= 100) {
          bonificacion = 'sobresaliente';
        } else if (promedioCumplimiento >= 80) {
          bonificacion = 'objetivo';
        }

        return {
          id: meta.id,
          nombre: meta.asesores.nombre,
          metas: {
            clientes: { 
              meta: meta.meta_clientes, 
              actual: meta.clientes_captados, 
              porcentaje: parseFloat(clientesPorcentaje.toFixed(2)) 
            },
            cobranza: { 
              meta: meta.meta_cobranza, 
              actual: meta.cobranza_realizada, 
              porcentaje: parseFloat(cobranzaPorcentaje.toFixed(2)) 
            },
            morosidad: { 
              meta: meta.meta_morosidad, 
              actual: meta.morosidad_actual, 
              porcentaje: parseFloat(morosidadPorcentaje.toFixed(2)) 
            },
            cartera: { 
              meta: meta.meta_cartera, 
              actual: meta.cartera_actual, 
              porcentaje: parseFloat(carteraPorcentaje.toFixed(2)) 
            }
          },
          promedio_cumplimiento: parseFloat(promedioCumplimiento.toFixed(2)),
          bonificacion
        };
      });

      // Calcular promedios y distribución
      const totalAsesores = asesoresData.length || 1; // Evitar división por cero
      
      const promedios = {
        clientes: asesoresData.reduce((acc, a) => acc + a.metas.clientes.porcentaje, 0) / totalAsesores,
        cobranza: asesoresData.reduce((acc, a) => acc + a.metas.cobranza.porcentaje, 0) / totalAsesores,
        morosidad: asesoresData.reduce((acc, a) => acc + a.metas.morosidad.porcentaje, 0) / totalAsesores,
        cartera: asesoresData.reduce((acc, a) => acc + a.metas.cartera.porcentaje, 0) / totalAsesores
      };

      const rendimiento = {
        sobresaliente: asesoresData.filter(a => a.bonificacion === 'sobresaliente').length,
        objetivo: asesoresData.filter(a => a.bonificacion === 'objetivo').length,
        mejorable: asesoresData.filter(a => a.bonificacion === 'mejorable').length
      };

      return NextResponse.json({
        asesores: asesoresData,
        promedios,
        rendimiento
      });
    }

    // Respuesta estándar para consultas normales
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Crear o actualizar meta
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

    // Verificar si el usuario tiene permisos para crear/actualizar metas
    if (!['administrador', 'admin_sistema'].includes(currentUser.rol)) {
      return NextResponse.json(
        { error: 'No tiene permisos para crear o actualizar metas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validar datos obligatorios
    if (!body.asesor_id || !body.periodo || body.meta_clientes === undefined || 
        body.meta_cobranza === undefined || body.meta_morosidad === undefined || 
        body.meta_cartera === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Validar valores numéricos
    if (body.meta_clientes < 0 || body.meta_cobranza < 0 || 
        body.meta_morosidad < 0 || body.meta_cartera < 0) {
      return NextResponse.json(
        { error: 'Los valores de las metas no pueden ser negativos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario asesor existe
    const { data: asesor, error: asesorError } = await supabase
      .from('usuarios')
      .select('id, rol')
      .eq('id', body.asesor_id)
      .single();

    if (asesorError || !asesor) {
      return NextResponse.json(
        { error: 'Asesor no encontrado' },
        { status: 404 }
      );
    }

    if (asesor.rol !== 'asesor') {
      return NextResponse.json(
        { error: 'El usuario seleccionado no es un asesor' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una meta para este asesor en este período
    const { data: existingMeta, error: metaError } = await supabase
      .from('metas')
      .select('id')
      .eq('asesor_id', body.asesor_id)
      .eq('periodo', body.periodo)
      .maybeSingle();

    if (metaError) {
      console.error('Error al verificar meta existente:', metaError);
      return NextResponse.json(
        { error: metaError.message },
        { status: 500 }
      );
    }

    // Preparar datos de la meta
    const metaData = {
      asesor_id: body.asesor_id,
      periodo: body.periodo,
      meta_clientes: parseInt(body.meta_clientes),
      meta_cobranza: parseFloat(body.meta_cobranza),
      meta_morosidad: parseFloat(body.meta_morosidad),
      meta_cartera: parseFloat(body.meta_cartera),
      // Inicializar valores actuales si es una nueva meta
      clientes_captados: existingMeta ? undefined : 0,
      cobranza_realizada: existingMeta ? undefined : 0,
      morosidad_actual: existingMeta ? undefined : 0,
      cartera_actual: existingMeta ? undefined : 0,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString()
    };

    // Si es una meta nueva, agregar campos de creación
    if (!existingMeta) {
      metaData.created_by = currentUser.id;
      metaData.created_at = new Date().toISOString();
    }

    let result;
    
    // Crear o actualizar la meta según corresponda
    if (existingMeta) {
      // Actualizar meta existente
      const { data, error } = await supabase
        .from('metas')
        .update(metaData)
        .eq('id', existingMeta.id)
        .select();

      if (error) {
        console.error('Error al actualizar meta:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      result = { data: data[0], message: 'Meta actualizada exitosamente' };
    } else {
      // Crear nueva meta
      const { data, error } = await supabase
        .from('metas')
        .insert([metaData])
        .select();

      if (error) {
        console.error('Error al crear meta:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      result = { data: data[0], message: 'Meta creada exitosamente' };
    }

    return NextResponse.json(result, { status: existingMeta ? 200 : 201 });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Actualizar el progreso de una meta
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

    // Verificar si el usuario tiene permisos para actualizar el progreso
    if (!['administrador', 'supervisor', 'admin_sistema'].includes(currentUser.rol)) {
      return NextResponse.json(
        { error: 'No tiene permisos para actualizar el progreso de metas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validar datos obligatorios
    if (!body.id || (
      body.clientes_captados === undefined && 
      body.cobranza_realizada === undefined && 
      body.morosidad_actual === undefined && 
      body.cartera_actual === undefined
    )) {
      return NextResponse.json(
        { error: 'Debe especificar al menos un valor de progreso para actualizar' },
        { status: 400 }
      );
    }

    // Verificar que la meta existe
    const { data: meta, error: metaError } = await supabase
      .from('metas')
      .select('*')
      .eq('id', body.id)
      .single();

    if (metaError || !meta) {
      return NextResponse.json(
        { error: 'Meta no encontrada' },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar
    const updateData = {};
    
    // Solo actualizar los campos proporcionados
    if (body.clientes_captados !== undefined) {
      updateData.clientes_captados = parseInt(body.clientes_captados);
    }
    
    if (body.cobranza_realizada !== undefined) {
      updateData.cobranza_realizada = parseFloat(body.cobranza_realizada);
    }
    
    if (body.morosidad_actual !== undefined) {
      updateData.morosidad_actual = parseFloat(body.morosidad_actual);
    }
    
    if (body.cartera_actual !== undefined) {
      updateData.cartera_actual = parseFloat(body.cartera_actual);
    }

    updateData.updated_by = currentUser.id;
    updateData.updated_at = new Date().toISOString();

    // Actualizar la meta
    const { data, error } = await supabase
      .from('metas')
      .update(updateData)
      .eq('id', body.id)
      .select();

    if (error) {
      console.error('Error al actualizar progreso de meta:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data[0],
      message: 'Progreso actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}