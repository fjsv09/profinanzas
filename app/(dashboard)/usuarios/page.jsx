'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { usuariosService } from '@/lib/supabase';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function UsuariosPage() {
  const [user, setUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalUsuario, setModalUsuario] = useState({
    id: '',
    nombre: '',
    apellido: '',
    email: '',
    rol: 'asesor',
    activo: true
  });
  
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
        
        // En un sistema real, estos datos vendrían de Supabase
        // Por ahora, usamos datos de ejemplo
        const usuariosData = [
          { id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@profinanzas.com', rol: 'asesor', activo: true, created_at: '2025-01-15T10:30:00' },
          { id: 2, nombre: 'María', apellido: 'López', email: 'maria@profinanzas.com', rol: 'asesor', activo: true, created_at: '2025-01-20T14:45:00' },
          { id: 3, nombre: 'Carlos', apellido: 'González', email: 'carlos@profinanzas.com', rol: 'asesor', activo: true, created_at: '2025-02-05T09:15:00' },
          { id: 4, nombre: 'Ana', apellido: 'Martínez', email: 'ana@profinanzas.com', rol: 'asesor', activo: false, created_at: '2025-02-10T16:30:00' },
          { id: 5, nombre: 'Pedro', apellido: 'Sánchez', email: 'pedro@profinanzas.com', rol: 'supervisor', activo: true, created_at: '2025-01-10T11:20:00' },
          { id: 6, nombre: 'Lucía', apellido: 'Ramírez', email: 'lucia@profinanzas.com', rol: 'administrador', activo: true, created_at: '2025-01-05T08:45:00' },
          { id: 7, nombre: 'Admin', apellido: 'Sistema', email: 'admin@profinanzas.com', rol: 'admin_sistema', activo: true, created_at: '2025-01-01T00:00:00' }
        ];
        
        setUsuarios(usuariosData);
        setFilteredUsuarios(usuariosData);
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    // Filtrar usuarios en base al término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredUsuarios(usuarios);
    } else {
      const filtered = usuarios.filter(
        usuario =>
          usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          usuario.rol.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsuarios(filtered);
    }
  }, [searchTerm, usuarios]);

  const handleOpenModal = (usuario = null) => {
    if (usuario) {
      setModalUsuario(usuario);
      setIsEditing(true);
    } else {
      setModalUsuario({
        id: '',
        nombre: '',
        apellido: '',
        email: '',
        rol: 'asesor',
        activo: true
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModalUsuario({
      ...modalUsuario,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!modalUsuario.nombre || !modalUsuario.apellido || !modalUsuario.email) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    
    try {
      if (isEditing) {
        // Actualizar usuario existente
        // En un sistema real, esto llamaría a usuariosService.update
        const updatedUsuarios = usuarios.map(u => 
          u.id === modalUsuario.id ? { ...modalUsuario } : u
        );
        setUsuarios(updatedUsuarios);
        toast.success('Usuario actualizado con éxito');
      } else {
        // Crear nuevo usuario
        // En un sistema real, esto llamaría a usuariosService.create
        const newUsuario = {
          ...modalUsuario,
          id: usuarios.length + 1,
          created_at: new Date().toISOString()
        };
        setUsuarios([...usuarios, newUsuario]);
        toast.success('Usuario creado con éxito');
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      toast.error('Error al guardar los cambios');
    }
  };

  const handleToggleActivo = (id) => {
    const updatedUsuarios = usuarios.map(usuario => {
      if (usuario.id === id) {
        return { ...usuario, activo: !usuario.activo };
      }
      return usuario;
    });
    
    setUsuarios(updatedUsuarios);
    toast.success('Estado del usuario actualizado');
  };

  const handleDelete = (id) => {
    // Verificar que no es el usuario actual
    if (id === user.id) {
      toast.error('No puedes eliminar tu propio usuario');
      return;
    }
    
    // Verificar que no es el último administrador del sistema
    const adminCount = usuarios.filter(u => u.rol === 'admin_sistema' && u.id !== id).length;
    if (adminCount === 0 && usuarios.find(u => u.id === id).rol === 'admin_sistema') {
      toast.error('No puedes eliminar el último administrador del sistema');
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      // En un sistema real, esto llamaría a usuariosService.delete
      const updatedUsuarios = usuarios.filter(usuario => usuario.id !== id);
      setUsuarios(updatedUsuarios);
      toast.success('Usuario eliminado con éxito');
    }
  };

  const getRolLabel = (rol) => {
    switch (rol) {
      case 'admin_sistema':
        return 'Administrador del Sistema';
      case 'administrador':
        return 'Administrador';
      case 'supervisor':
        return 'Supervisor';
      case 'asesor':
        return 'Asesor';
      default:
        return rol;
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Gestión de Usuarios</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
            placeholder="Buscar por nombre, email o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsuarios.length > 0 ? (
                filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{usuario.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getRolLabel(usuario.rol)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(usuario.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(usuario)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <PencilSquareIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => handleToggleActivo(usuario.id)}
                        className={`mr-3 ${usuario.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {usuario.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDelete(usuario.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear/editar usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                      </h3>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                            Nombre
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="nombre"
                              id="nombre"
                              value={modalUsuario.nombre}
                              onChange={handleInputChange}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              required
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
                            Apellido
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="apellido"
                              id="apellido"
                              value={modalUsuario.apellido}
                              onChange={handleInputChange}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              required
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <div className="mt-1">
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={modalUsuario.email}
                              onChange={handleInputChange}
                              className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                                isEditing ? 'bg-gray-100' : ''
                              }`}
                              required
                              readOnly={isEditing}
                            />
                          </div>
                          {isEditing && (
                            <p className="mt-1 text-xs text-gray-500">
                              El email no se puede modificar
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
                            Rol
                          </label>
                          <div className="mt-1">
                            <select
                              id="rol"
                              name="rol"
                              value={modalUsuario.rol}
                              onChange={handleInputChange}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              required
                            >
                              <option value="asesor">Asesor</option>
                              <option value="supervisor">Supervisor</option>
                              <option value="administrador">Administrador</option>
                              <option value="admin_sistema">Administrador del Sistema</option>
                            </select>
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <div className="flex items-center h-full pt-5">
                            <input
                              id="activo"
                              name="activo"
                              type="checkbox"
                              checked={modalUsuario.activo}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                              Usuario activo
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleCloseModal}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}