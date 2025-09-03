import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type NPIMilestone = Database['public']['Tables']['npi_milestones']['Row'];
type NPIMilestoneInsert = Database['public']['Tables']['npi_milestones']['Insert'];
type NPIMilestoneUpdate = Database['public']['Tables']['npi_milestones']['Update'];

export interface NPIMilestoneWithProduct extends NPIMilestone {
  npi_product?: {
    id: string;
    product_id: string | null;
    npi_status: string;
    launch_date: string | null;
    product?: {
      product_name: string;
    };
  };
}

export interface MilestoneFilters {
  npi_product_id?: string;
  milestone_status?: string;
  responsible_team?: string;
  responsible_person?: string;
  milestone_priority?: string;
  milestone_date_from?: string;
  milestone_date_to?: string;
}

export const useNPIMilestones = (filters: MilestoneFilters = {}) => {
  const [milestones, setMilestones] = useState<NPIMilestoneWithProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('npi_milestones')
        .select(`
          *,
          npi_product:npi_products!npi_milestones_npi_product_id_fkey(
            id,
            product_id,
            npi_status,
            launch_date,
            product:products!npi_products_product_id_fkey(
              product_name
            )
          )
        `)
        .order('milestone_date', { ascending: true });

      // Apply filters
      if (filters.npi_product_id) {
        query = query.eq('npi_product_id', filters.npi_product_id);
      }
      if (filters.milestone_status) {
        query = query.eq('milestone_status', filters.milestone_status);
      }
      if (filters.responsible_team) {
        query = query.eq('responsible_team', filters.responsible_team);
      }
      if (filters.responsible_person) {
        query = query.eq('responsible_person', filters.responsible_person);
      }
      if (filters.milestone_priority) {
        query = query.eq('milestone_priority', filters.milestone_priority);
      }
      if (filters.milestone_date_from) {
        query = query.gte('milestone_date', filters.milestone_date_from);
      }
      if (filters.milestone_date_to) {
        query = query.lte('milestone_date', filters.milestone_date_to);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setMilestones(data || []);
    } catch (err) {
      console.error('Error fetching NPI milestones:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NPI milestones');
      toast.error('Error loading NPI milestones');
    } finally {
      setLoading(false);
    }
  };

  const createMilestone = async (milestone: NPIMilestoneInsert) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('npi_milestones')
        .insert(milestone)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('NPI milestone created successfully');
      await fetchMilestones(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error creating NPI milestone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create NPI milestone';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMilestone = async (id: string, updates: NPIMilestoneUpdate) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('npi_milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('NPI milestone updated successfully');
      await fetchMilestones(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error updating NPI milestone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update NPI milestone';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('npi_milestones')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('NPI milestone deleted successfully');
      await fetchMilestones(); // Refresh the list
    } catch (err) {
      console.error('Error deleting NPI milestone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete NPI milestone';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkCreateMilestones = async (milestones: NPIMilestoneInsert[]) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('npi_milestones')
        .insert(milestones)
        .select();

      if (error) {
        throw error;
      }

      toast.success(`${milestones.length} NPI milestones created successfully`);
      await fetchMilestones(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error creating bulk NPI milestones:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create NPI milestones';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMilestonesByProduct = async (npiProductId: string) => {
    try {
      const { data, error } = await supabase
        .from('npi_milestones')
        .select('*')
        .eq('npi_product_id', npiProductId)
        .order('milestone_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching milestones by product:', err);
      return [];
    }
  };

  const getUpcomingMilestones = async (days: number = 30) => {
    try {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);

      const { data, error } = await supabase
        .from('npi_milestones')
        .select(`
          *,
          npi_product:npi_products!npi_milestones_npi_product_id_fkey(
            id,
            product_id,
            npi_status,
            launch_date,
            product:products!npi_products_product_id_fkey(
              product_name
            )
          )
        `)
        .gte('milestone_date', today.toISOString().split('T')[0])
        .lte('milestone_date', futureDate.toISOString().split('T')[0])
        .in('milestone_status', ['not_started', 'in_progress'])
        .order('milestone_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching upcoming milestones:', err);
      return [];
    }
  };

  const getOverdueMilestones = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('npi_milestones')
        .select(`
          *,
          npi_product:npi_products!npi_milestones_npi_product_id_fkey(
            id,
            product_id,
            npi_status,
            launch_date,
            product:products!npi_products_product_id_fkey(
              product_name
            )
          )
        `)
        .lt('milestone_date', today)
        .in('milestone_status', ['not_started', 'in_progress'])
        .order('milestone_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching overdue milestones:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [JSON.stringify(filters)]);

  return {
    milestones,
    loading,
    error,
    fetchMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    bulkCreateMilestones,
    getMilestonesByProduct,
    getUpcomingMilestones,
    getOverdueMilestones,
  };
};