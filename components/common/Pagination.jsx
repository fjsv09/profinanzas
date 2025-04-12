'use client';
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Componente de paginación reutilizable
 * @param {Object} props - Propiedades del componente
 * @param {number} props.currentPage - Página actual
 * @param {number} props.totalPages - Total de páginas
 * @param {Function} props.onPageChange - Función a ejecutar al cambiar de página
 * @param {string} props.className - Clases CSS adicionales
 * @returns {JSX.Element} Componente de paginación
 */
export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange, 
  className = '' 
}) {
  // No mostrar la paginación si solo hay una página
  if (totalPages <= 1) return null;

  // Generar un array de páginas a mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Si hay menos páginas que el máximo a mostrar, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar la primera página
      pages.push(1);
      
      // Calcular rango de páginas alrededor de la página actual
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Ajustar si estamos cerca del inicio o final
      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }
      
      // Agregar puntos suspensivos antes si es necesario
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Agregar páginas del rango
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Agregar puntos suspensivos después si es necesario
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Siempre mostrar la última página
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-center space-x-1 mt-4 ${className}`}>
      {/* Botón Anterior */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-2 py-1 rounded-md ${
          currentPage === 1
            ? 'cursor-not-allowed text-gray-400'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        aria-label="Página anterior"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      
      {/* Números de página */}
      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-1 text-gray-500">...</span>
          ) : (
            <button
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label={`Ir a página ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      
      {/* Botón Siguiente */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-2 py-1 rounded-md ${
          currentPage === totalPages
            ? 'cursor-not-allowed text-gray-400'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        aria-label="Página siguiente"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}