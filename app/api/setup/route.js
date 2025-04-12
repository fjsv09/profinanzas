/*import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    // Verificar si ya existe algún usuario de manera más precisa
    const { data, error, count } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact' });

    if (error) throw error;

    // Verificamos el conteo exacto de registros
    if (count > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Ya existe un usuario, no se puede usar esta ruta',
        count: count 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Crear el primer usuario administrador
    const email = 'admin@profinanzas.com';
    const password = 'Admin123!'; // Deberías cambiar esto inmediatamente después

    // Registrar el usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Guardar los datos en la tabla de usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .insert([
        {
          id: authData.user.id,
          email: email,
          nombre: 'Administrador',
          apellido: 'Sistema',
          rol: 'administrador',
          activo: true
        }
      ]);

    if (userError) throw userError;

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Usuario administrador creado con éxito',
      userId: authData.user.id
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message,
      details: error
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}*/