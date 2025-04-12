import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

/**
 * Hook personalizado para interactuar con Supabase
 * @param {string} tableName - Nombre de la tabla a consultar
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Métodos y estado para interactuar con la tabla
 */
export default function useSupabase(tableName, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  
  const {
    select = '*',
    initialFilter = null,
    relationships = null,
    orderBy = { column: 'created_at', ascending: false }
  } = options;

  /**
   * Construye una consulta base con selección y relaciones
   * @returns {Object} Consulta de Supabase
   */
  const baseQuery = useCallback(() => {
    let query = supabase.from(tableName).select(select);
    
    // Agregar relaciones si existen
    if (relationships) {
      const relationSelect = relationships
        .map(rel => `${rel.table}(${rel.select || '*'})`)
        .join(', ');
      
      // Combinar selecciones
      query = supabase.from(tableName).select(`${select}, ${relationSelect}`);
    }
    
    return query;
  }, [tableName, select, relationships]);

  /**
   * Cargar datos iniciales
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let query = baseQuery();
        
        // Aplicar filtro inicial si existe
        if (initialFilter) {
          if (typeof initialFilter === 'function') {
            query = initialFilter(query);
          } else if (typeof initialFilter === 'object') {
            const { column, value, operator = 'eq' } = initialFilter;
            query = query[operator](column, value);
          }
        }
        
        // Aplicar ordenamiento
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending });
        }
        
        const { data: result, error: queryError, count: totalCount } = await query;
        
        if (queryError) {
          throw queryError;
        }
        
        setData(result || []);
        if (totalCount !== null) setCount(totalCount);
      } catch (err) {
        console.error(`Error al cargar datos de ${tableName}:`, err);
        setError(err);
        toast.error(`Error al cargar datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [tableName, baseQuery, initialFilter, orderBy]);

  /**
   * Buscar por ID
   * @param {number|string} id - ID del registro a buscar
   * @returns {Promise} Promesa que resuelve con el registro encontrado
   */
  const getById = useCallback(async (id) => {
    try {
      setLoading(true);
      
      const query = baseQuery().eq('id', id).single();
      const { data: result, error: queryError } = await query;
      
      if (queryError) {
        throw queryError;
      }
      
      return result;
    } catch (err) {
      console.error(`Error al obtener registro de ${tableName}:`, err);
      setError(err);
      toast.error(`Error al obtener registro: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [baseQuery, tableName]);

  /**
   * Crear un nuevo registro
   * @param {Object} record - Datos del registro a crear
   * @returns {Promise} Promesa que resuelve con el registro creado
   */
  const create = useCallback(async (record) => {
    try {
      setLoading(true);
      
      const { data: result, error: insertError } = await supabase
        .from(tableName)
        .insert([record])
        .select();
      
      if (insertError) {
        throw insertError;
      }
      
      // Actualizar datos locales
      setData(prevData => [result[0], ...prevData]);
      
      toast.success('Registro creado correctamente');
      return result[0];
    } catch (err) {
      console.error(`Error al crear registro en ${tableName}:`, err);
      setError(err);
      toast.error(`Error al crear registro: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  /**
   * Actualizar un registro existente
   * @param {number|string} id - ID del registro a actualizar
   * @param {Object} updates - Datos a actualizar
   * @returns {Promise} Promesa que resuelve con el registro actualizado
   */
  const update = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      
      const { data: result, error: updateError } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select();
      
      if (updateError) {
        throw updateError;
      }
      
      // Actualizar datos locales
      setData(prevData => prevData.map(item => 
        item.id === id ? { ...item, ...result[0] } : item
      ));
      
      toast.success('Registro actualizado correctamente');
      return result[0];
    } catch (err) {
      console.error(`Error al actualizar registro en ${tableName}:`, err);
      setError(err);
      toast.error(`Error al actualizar registro: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  /**
   * Eliminar un registro
   * @param {number|string} id - ID del registro a eliminar
   * @returns {Promise} Promesa que resuelve a true si se eliminó correctamente
   */
  const remove = useCallback(async (id) => {
    try {
      setLoading(true);
      
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Actualizar datos locales
      setData(prevData => prevData.filter(item => item.id !== id));
      
      toast.success('Registro eliminado correctamente');
      return true;
    } catch (err) {
      console.error(`Error al eliminar registro de ${tableName}:`, err);
      setError(err);
      toast.error(`Error al eliminar registro: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  /**
   * Buscar registros con un filtro personalizado
   * @param {Function|Object} filter - Filtro a aplicar
   * @returns {Promise} Promesa que resuelve con los registros encontrados
   */
  const find = useCallback(async (filter) => {
    try {
      setLoading(true);
      
      let query = baseQuery();
      
      // Aplicar filtro
      if (filter) {
        if (typeof filter === 'function') {
          query = filter(query);
        } else if (typeof filter === 'object') {
          const { column, value, operator = 'eq' } = filter;
          query = query[operator](column, value);
        }
      }
      
      // Aplicar ordenamiento
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending });
      }
      
      const { data: result, error: queryError, count: totalCount } = await query;
      
      if (queryError) {
        throw queryError;
      }
      
      if (totalCount !== null) setCount(totalCount);
      return result || [];
    } catch (err) {
      console.error(`Error al buscar registros en ${tableName}:`, err);
      setError(err);
      toast.error(`Error al buscar registros: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [baseQuery, orderBy, tableName]);

  /**
   * Aplicar una acción personalizada en la tabla
   * @param {Function} action - Función que recibe la referencia a la tabla y realiza operaciones
   * @returns {Promise} Promesa que resuelve con el resultado de la acción
   */
  const customAction = useCallback(async (action) => {
    try {
      setLoading(true);
      
      if (typeof action !== 'function') {
        throw new Error('La acción debe ser una función');
      }
      
      const tableRef = supabase.from(tableName);
      const result = await action(tableRef);
      
      return result;
    } catch (err) {
      console.error(`Error en acción personalizada en ${tableName}:`, err);
      setError(err);
      toast.error(`Error en operación: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  /**
   * Refrescar los datos
   * @returns {Promise} Promesa que resuelve cuando se refrescan los datos
   */
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = baseQuery();
      
      // Aplicar filtro inicial si existe
      if (initialFilter) {
        if (typeof initialFilter === 'function') {
          query = initialFilter(query);
        } else if (typeof initialFilter === 'object') {
          const { column, value, operator = 'eq' } = initialFilter;
          query = query[operator](column, value);
        }
      }
      
      // Aplicar ordenamiento
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending });
      }
      
      const { data: result, error: queryError, count: totalCount } = await query;
      
      if (queryError) {
        throw queryError;
      }
      
      setData(result || []);
      if (totalCount !== null) setCount(totalCount);
      
      return result;
    } catch (err) {
      console.error(`Error al refrescar datos de ${tableName}:`, err);
      setError(err);
      toast.error(`Error al refrescar datos: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [baseQuery, initialFilter, orderBy, tableName]);

  return {
    data,
    loading,
    error,
    count,
    getById,
    create,
    update,
    remove,
    find,
    refresh,
    customAction
  };
}