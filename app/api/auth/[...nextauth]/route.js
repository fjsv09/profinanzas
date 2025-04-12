import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

// Función para manejar la autenticación
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, email, password, userData } = body;

    // Acción de inicio de sesión
    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }

      // Obtener datos adicionales del usuario
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        return NextResponse.json(
          { error: userError.message },
          { status: 500 }
        );
      }

      // Verificar si el usuario está activo
      if (!userData.activo) {
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: 'Usuario inactivo. Contacte al administrador.' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        user: {
          ...data.user,
          ...userData
        },
        session: data.session
      });
    }

    // Acción de registro
    if (action === 'signup') {
      // Primero crear el usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }

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

      if (userError) {
        // Si hay error al crear el usuario, eliminar la cuenta de autenticación
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: userError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        user: userRecord[0],
        message: 'Usuario creado exitosamente'
      });
    }

    // Acción de cierre de sesión
    if (action === 'signout') {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Sesión cerrada exitosamente' });
    }

    // Si no se reconoce la acción
    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error de autenticación:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

// Función para obtener la sesión del usuario actual
export async function GET() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json({ user: null });
    }

    // Obtener datos adicionales del usuario
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', data.session.user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        ...data.session.user,
        ...userData
      }
    });
  } catch (error) {
    console.error('Error al obtener sesión:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}