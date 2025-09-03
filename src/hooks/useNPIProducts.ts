import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type NPIProduct = Database['public']['Tables']['npi_products']['Row'];
type NPIProductInsert = Database['public']['Tables']['npi_products']['Insert'];
type NPIProductUpdate = Database['public']['Tables']['npi_products']['Update'];

export interface NPIProductWithProduct extends NPIProduct {
  product?: {
    id: string;
    product_name: string;
    category_name: string | null;
    subcategory_name: string | null;
  };
}

export interface NPIFilters {
  npi_status?: string;
  launch_confidence_level?: string;
  market_segment?: string;
  responsible_planner?: string;
  launch_date_from?: string;
  launch_date_to?: string;
}

export const useNPIProducts = (filters: NPIFilters = {}) => {
  const [npiProducts, setNPIProducts] = useState<NPIProductWithProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNPIProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('npi_products')
        .select(`
          *,
          product:products!npi_products_product_id_fkey(
            id,
            product_name,
            category_name,
            subcategory_name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.npi_status) {
        query = query.eq('npi_status', filters.npi_status);
      }
      if (filters.launch_confidence_level) {
        query = query.eq('launch_confidence_level', filters.launch_confidence_level);
      }
      if (filters.market_segment) {
        query = query.eq('market_segment', filters.market_segment);
      }
      if (filters.responsible_planner) {
        query = query.eq('responsible_planner', filters.responsible_planner);
      }
      if (filters.launch_date_from) {
        query = query.gte('launch_date', filters.launch_date_from);
      }
      if (filters.launch_date_to) {
        query = query.lte('launch_date', filters.launch_date_to);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setNPIProducts(data || []);
    } catch (err) {
      console.error('Error fetching NPI products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NPI products');
      toast.error('Error loading NPI products');
    } finally {
      setLoading(false);
    }
  };

  const createNPIProduct = async (npiProduct: NPIProductInsert) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('npi_products')
        .insert(npiProduct)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('NPI product created successfully');
      await fetchNPIProducts(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error creating NPI product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create NPI product';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateNPIProduct = async (id: string, updates: NPIProductUpdate) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('npi_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('NPI product updated successfully');
      await fetchNPIProducts(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error updating NPI product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update NPI product';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteNPIProduct = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('npi_products')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('NPI product deleted successfully');
      await fetchNPIProducts(); // Refresh the list
    } catch (err) {
      console.error('Error deleting NPI product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete NPI product';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getNPIProductById = async (id: string): Promise<NPIProductWithProduct | null> => {
    try {
      const { data, error } = await supabase
        .from('npi_products')
        .select(`
          *,
          product:products!npi_products_product_id_fkey(
            id,
            product_name,
            category_name,
            subcategory_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching NPI product:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchNPIProducts();
  }, [JSON.stringify(filters)]);

  return {
    npiProducts,
    loading,
    error,
    fetchNPIProducts,
    createNPIProduct,
    updateNPIProduct,
    deleteNPIProduct,
    getNPIProductById,
  };
};