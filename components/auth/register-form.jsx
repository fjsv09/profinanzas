'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    rol: 'asesor' // Rol por defecto
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(
        formData.email, 
        formData.password, 
        {
          nombre: formData.nombre,
          apellido: formData.apellido,
          rol: formData.rol
        }
      );
      
      toast.success('Usuario registrado con éxito');
      router.push('/login');
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      toast.error(error.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">ProFinanzas</h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Registro de Usuario
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="nombre" className="sr-only">Nombre</label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="apellido" className="sr-only">Apellido</label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirmar Contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="rol" className="sr-only">
                Rol
              </label>
              <select
                id="rol"
                name="rol"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={formData.rol}
                onChange={handleChange}
              >
                <option value="asesor">Asesor</option>
                <option value="supervisor">Supervisor</option>
                <option value="administrador">Administrador</option>
                <option value="admin_sistema">Administrador del Sistema</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link 
                href="/login" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}