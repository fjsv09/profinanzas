/**
 * Funciones de utilidad para la aplicación ProFinanzas
 */

/**
 * Formatea una fecha en formato legible
 * @param {string|Date} date - Fecha a formatear
 * @param {Object} options - Opciones de formateo
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, options = {}) => {
    const defaultOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
  };
  
  /**
   * Formatea un valor monetario a formato de moneda
   * @param {number} value - Valor a formatear
   * @param {string} currency - Moneda (por defecto 'PEN' - Sol peruano)
   * @returns {string} Valor formateado
   */
  export const formatCurrency = (value, currency = 'PEN') => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(value);
  };
  
  /**
   * Calcula las cuotas de un préstamo
   * @param {number} monto - Monto del préstamo
   * @param {number} interes - Porcentaje de interés
   * @param {number} plazo - Número de cuotas
   * @param {string} frecuencia - Frecuencia de pago (diario, semanal, quincenal, mensual)
   * @returns {Array} Arreglo de cuotas
   */
  export const calcularCuotas = (monto, interes, plazo, frecuencia) => {
    const montoTotal = monto * (1 + interes / 100);
    const montoCuota = parseFloat((montoTotal / plazo).toFixed(2));
    const cuotas = [];
    
    // Incremento de días según frecuencia
    const incrementoDias = {
      'diario': 1,
      'semanal': 7,
      'quincenal': 15,
      'mensual': 30
    };
    
    const incremento = incrementoDias[frecuencia];
    const fechaActual = new Date();
    
    for (let i = 0; i < plazo; i++) {
      const fechaPago = new Date(fechaActual);
      fechaPago.setDate(fechaPago.getDate() + incremento * (i + 1));
      
      cuotas.push({
        numero: i + 1,
        fecha: fechaPago,
        fechaFormateada: formatDate(fechaPago),
        monto: montoCuota,
        montoFormateado: formatCurrency(montoCuota)
      });
    }
    
    return cuotas;
  };
  
  /**
   * Calcula el estado de un préstamo basado en pagos y fechas
   * @param {Object} prestamo - Datos del préstamo
   * @param {Array} pagos - Arreglo de pagos realizados
   * @returns {string} Estado del préstamo (activo, atrasado, completado)
   */
  export const calcularEstadoPrestamo = (prestamo, pagos) => {
    // Si todas las cuotas están pagadas, el préstamo está completado
    if (prestamo.cuotas_pagadas >= prestamo.total_cuotas) {
      return 'completado';
    }
    
    // Verificar si hay pagos atrasados
    const fechaActual = new Date();
    const ultimoPago = pagos.length > 0 
      ? new Date(pagos[pagos.length - 1].fecha_pago) 
      : new Date(prestamo.fecha_inicio);
    
    const incrementoDias = {
      'diario': 1,
      'semanal': 7,
      'quincenal': 15,
      'mensual': 30
    };
    
    const diasIncremento = incrementoDias[prestamo.frecuencia_pago];
    const fechaSiguientePago = new Date(ultimoPago);
    fechaSiguientePago.setDate(fechaSiguientePago.getDate() + diasIncremento);
    
    // Si la fecha del siguiente pago ya pasó, el préstamo está atrasado
    if (fechaActual > fechaSiguientePago) {
      return 'atrasado';
    }
    
    return 'activo';
  };
  
  /**
   * Calcula el porcentaje de progreso de una meta
   * @param {number} actual - Valor actual
   * @param {number} meta - Valor objetivo
   * @param {boolean} inverso - Si es true, menor es mejor (para métricas como morosidad)
   * @returns {number} Porcentaje de cumplimiento
   */
  export const calcularPorcentajeMeta = (actual, meta, inverso = false) => {
    if (meta === 0) return 0;
    
    const porcentaje = (actual / meta) * 100;
    
    if (inverso) {
      // Para métricas donde menor es mejor (como morosidad)
      return meta >= actual ? (2 - porcentaje / 100) * 100 : 0;
    }
    
    return porcentaje;
  };
  
  /**
   * Obtiene la clase de color según un porcentaje de cumplimiento
   * @param {number} porcentaje - Porcentaje de cumplimiento
   * @param {boolean} inverso - Si es true, menor es mejor (para métricas como morosidad)
   * @returns {string} Clase CSS para el color
   */
  export const getColorClaseMeta = (porcentaje, inverso = false) => {
    if (inverso) {
      // Para métricas donde menor es mejor
      if (porcentaje <= 80) return 'bg-green-600';
      if (porcentaje <= 100) return 'bg-yellow-500';
      return 'bg-red-600';
    } else {
      // Para métricas donde mayor es mejor
      if (porcentaje >= 100) return 'bg-green-600';
      if (porcentaje >= 80) return 'bg-yellow-500';
      return 'bg-red-600';
    }
  };
  
  /**
   * Genera una contraseña aleatoria segura
   * @param {number} length - Longitud de la contraseña
   * @returns {string} Contraseña generada
   */
  export const generatePassword = (length = 10) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  };
  
  /**
   * Valida un número de DNI peruano
   * @param {string} dni - Número de DNI a validar
   * @returns {boolean} True si el DNI es válido
   */
  export const validarDNI = (dni) => {
    // El DNI peruano debe tener 8 dígitos
    return /^\d{8}$/.test(dni);
  };
  
  /**
   * Valida un número de teléfono peruano
   * @param {string} telefono - Número de teléfono a validar
   * @returns {boolean} True si el teléfono es válido
   */
  export const validarTelefono = (telefono) => {
    // El teléfono peruano debe tener 9 dígitos y empezar con 9
    return /^9\d{8}$/.test(telefono);
  };
  
  /**
   * Filtra una lista de elementos según un término de búsqueda
   * @param {Array} items - Lista de elementos a filtrar
   * @param {string} searchTerm - Término de búsqueda
   * @param {Array} fields - Campos donde buscar
   * @returns {Array} Lista filtrada
   */
  export const filterItems = (items, searchTerm, fields) => {
    if (!searchTerm.trim()) return items;
    
    const termLower = searchTerm.toLowerCase();
    
    return items.filter(item => {
      return fields.some(field => {
        const fieldValue = item[field];
        
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(termLower);
        } else if (typeof fieldValue === 'number') {
          return fieldValue.toString().includes(termLower);
        }
        
        return false;
      });
    });
  };