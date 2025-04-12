'use client';
import { 
  DocumentIcon, 
  ExclamationCircleIcon, 
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

/**
 * Componente para mostrar estados vacíos o de error
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de estado (empty, error, notFound)
 * @param {string} props.title - Título del mensaje
 * @param {string} props.message - Mensaje descriptivo
 * @param {Function} props.onAction - Función a ejecutar con el botón de acción
 * @param {string} props.actionText - Texto del botón de acción
 * @param {boolean} props.loading - Estado de carga
 * @returns {JSX.Element} Componente de estado
 */
export default function EmptyState({
  type = 'empty',
  title,
  message,
  onAction,
  actionText,
  loading = false
}) {
  // Definir contenido según el tipo
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="h-12 w-12 text-red-500" />;
      case 'notFound':
        return <ExclamationCircleIcon className="h-12 w-12 text-yellow-500" />;
      case 'empty':
      default:
        return <DocumentIcon className="h-12 w-12 text-gray-400" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'error':
        return 'Se produjo un error';
      case 'notFound':
        return 'No encontrado';
      case 'empty':
      default:
        return 'No hay datos disponibles';
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'error':
        return 'Ocurrió un error al cargar los datos. Por favor, intente nuevamente.';
      case 'notFound':
        return 'No pudimos encontrar lo que estás buscando.';
      case 'empty':
      default:
        return 'No hay elementos para mostrar en este momento.';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'notFound':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'empty':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700';
    }
  };

  const displayTitle = title || getDefaultTitle();
  const displayMessage = message || getDefaultMessage();
  const buttonColor = getButtonColor();

  return (
    <div className="text-center py-12 px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow">
      <div className="flex flex-col items-center">
        <div className="mb-4">
          {getIcon()}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {displayTitle}
        </h3>
        <p className="text-sm text-gray-500 max-w-md mb-6">
          {displayMessage}
        </p>
        {onAction && actionText && (
          <button
            type="button"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            onClick={onAction}
            disabled={loading}
          >
            {loading && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}