'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Cog6ToothIcon, UserIcon, BanknotesIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

export default function ConfiguracionPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [configuracion, setConfiguracion] = useState({
    general: {
      nombreEmpresa: 'ProFinanzas',
      telefono: '999-888-777',
      direccion: 'Av. Principal 123',
      correo: 'contacto@profinanzas.com',
      logoEmpresa: '/logo.png'
    },
    tasasInteres: {
      tasaBase: 10,
      tasaMaxima: 25,
      tasaMinima: 5,
      penalizacionMora: 5
    },
    cuentas: {
      cuentaBancaria: '123-456-789',
      entidadBancaria: 'Banco Nacional',
      cuentaYape: '987-654-321',
      cuentaOtra: 'N/A'
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        if (currentUser.rol !== 'admin_sistema') {
          toast.error('No tienes permisos para acceder a esta sección');
          router.push('/dashboard');
          return;
        }
        
        setUser(currentUser);
        
        // En un sistema real, cargaríamos la configuración desde la base de datos
        // Por ahora, usamos los datos de ejemplo definidos en el estado inicial
        
        // Inicializar formData con los valores actuales
        setFormData(configuracion[activeTab]);
        
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, activeTab]);

  useEffect(() => {
    // Actualizar formData cuando cambie de pestaña
    setFormData(configuracion[activeTab]);
    setIsEditing(false);
  }, [activeTab, configuracion]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Si estamos guardando, actualizar la configuración
      setConfiguracion({
        ...configuracion,
        [activeTab]: formData
      });
      toast.success('Configuración actualizada');
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setFormData(configuracion[activeTab]);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Configuración del Sistema</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menú lateral de configuración */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Opciones</h3>
            </div>
            <div className="px-4 py-3">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'general'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Cog6ToothIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                  General
                </button>
                <button
                  onClick={() => setActiveTab('tasasInteres')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'tasasInteres'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BanknotesIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                  Tasas de Interés
                </button>
                <button
                  onClick={() => setActiveTab('cuentas')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'cuentas'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BuildingLibraryIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                  Cuentas Bancarias
                </button>
                <button
                  onClick={() => router.push('/usuarios')}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <UserIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                  Gestión de Usuarios
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Formulario de configuración */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === 'general' && 'Configuración General'}
                {activeTab === 'tasasInteres' && 'Configuración de Tasas de Interés'}
                {activeTab === 'cuentas' && 'Configuración de Cuentas Bancarias'}
              </h3>
              <div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isEditing 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {isEditing ? 'Guardar' : 'Editar'}
                </button>
              </div>
            </div>
            <div className="px-6 py-5">
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nombreEmpresa" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      id="nombreEmpresa"
                      name="nombreEmpresa"
                      value={formData.nombreEmpresa || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                  <div>
                    <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      id="direccion"
                      name="direccion"
                      value={formData.direccion || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                  <div>
                    <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo de Contacto
                    </label>
                    <input
                      type="email"
                      id="correo"
                      name="correo"
                      value={formData.correo || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                  <div>
                    <label htmlFor="logoEmpresa" className="block text-sm font-medium text-gray-700 mb-1">
                      Logo de la Empresa (URL)
                    </label>
                    <input
                      type="text"
                      id="logoEmpresa"
                      name="logoEmpresa"
                      value={formData.logoEmpresa || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'tasasInteres' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="tasaBase" className="block text-sm font-medium text-gray-700 mb-1">
                      Tasa de Interés Base (%)
                    </label>
                    <input
                      type="number"
                      id="tasaBase"
                      name="tasaBase"
                      min="0"
                      step="0.1"
                      value={formData.tasaBase || 0}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                  <div>
                    <label htmlFor="tasaMaxima" className="block text-sm font-medium text-gray-700 mb-1">
                      Tasa de Interés Máxima (%)
                    </label>
                    <input
                      type="number"
                      id="tasaMaxima"
                      name="tasaMaxima"
                      min="0"
                      step="0.1"
                      value={formData.tasaMaxima || 0}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                  <div>
                    <label htmlFor="tasaMinima" className="block text-sm font-medium text-gray-700 mb-1">
                      Tasa de Interés Mínima (%)
                    </label>
                    <input
                      type="number"
                      id="tasaMinima"
                      name="tasaMinima"
                      min="0"
                      step="0.1"
                      value={formData.tasaMinima || 0}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                  <div>
                    <label htmlFor="penalizacionMora" className="block text-sm font-medium text-gray-700 mb-1">
                      Penalización por Mora (%)
                    </label>
                    <input
                      type="number"
                      id="penalizacionMora"
                      name="penalizacionMora"
                      min="0"
                      step="0.1"
                      value={formData.penalizacionMora || 0}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'cuentas' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cuentaBancaria" className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Cuenta Bancaria
                    </label>
                    <input
                      type="text"
                      id="cuentaBancaria"
                      name="cuentaBancaria"
                      value={formData.cuentaBancaria || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                  <div>
                    <label htmlFor="entidadBancaria" className="block text-sm font-medium text-gray-700 mb-1">
                      Entidad Bancaria
                    </label>
                    <input
                      type="text"
                      id="entidadBancaria"
                      name="entidadBancaria"
                      value={formData.entidadBancaria || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                  <div>
                    <label htmlFor="cuentaYape" className="block text-sm font-medium text-gray-700 mb-1">
                      Número asociado a Yape
                    </label>
                    <input
                      type="text"
                      id="cuentaYape"
                      name="cuentaYape"
                      value={formData.cuentaYape || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                  <div>
                    <label htmlFor="cuentaOtra" className="block text-sm font-medium text-gray-700 mb-1">
                      Otras cuentas o medios de pago
                    </label>
                    <input
                      type="text"
                      id="cuentaOtra"
                      name="cuentaOtra"
                      value={formData.cuentaOtra || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}