
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CommercialProfile {
  id: string;
  user_id: string;
  territory?: string;
  customer_segments?: string[];
  specialization?: string;
  phone?: string;
  region?: string;
  manager_level?: string;
  created_at?: string;
  updated_at?: string;
}

interface CustomerAssignment {
  id: string;
  commercial_user_id: string;
  customer_id: string;
  assignment_type: string;
  start_date: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface MarketIntelligence {
  id?: string;
  commercial_user_id?: string;
  customer_id?: string;
  product_id?: string;
  location_id?: string;
  intelligence_type: string;
  impact_assessment: string;
  confidence_level: string;
  time_horizon: string;
  description: string;
  quantitative_impact?: number | null;
  effective_from?: string | null;
  effective_to?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export function useCommercialCollaboration() {
  const [profile, setProfile] = useState<CommercialProfile | null>(null);
  const [assignments, setAssignments] = useState<CustomerAssignment[]>([]);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommercialData();
  }, []);

  const fetchCommercialData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      // Fetch commercial profile
      const { data: profileData, error: profileError } = await supabase
        .schema('m8_schema')
        .from('commercial_team_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        setProfile(profileData as unknown as CommercialProfile);
      }

      // Fetch customer assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .schema('m8_schema')
        .from('customer_assignments')
        .select('*')
        .eq('commercial_user_id', user.id);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
      } else {
        setAssignments((assignmentsData || []) as unknown as CustomerAssignment[]);
      }

      // Fetch market intelligence
      const { data: intelligenceData, error: intelligenceError } = await supabase
        .schema('m8_schema')
        .from('market_intelligence')
        .select('*')
        .eq('commercial_user_id', user.id)
        .order('created_at', { ascending: false });

      if (intelligenceError) {
        console.error('Error fetching intelligence:', intelligenceError);
      } else {
        setMarketIntelligence((intelligenceData || []) as unknown as MarketIntelligence[]);
      }

    } catch (error) {
      console.error('Error fetching commercial data:', error);
      toast.error('Error al cargar datos comerciales');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<CommercialProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuario no autenticado');
        return false;
      }

      const { error } = await supabase
        .schema('m8_schema')
        .from('commercial_team_profiles')
        .upsert({
          user_id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Perfil actualizado exitosamente');
      await fetchCommercialData();
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar perfil');
      return false;
    }
  };

  const addMarketIntelligence = async (intelligence: MarketIntelligence) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuario no autenticado');
        return false;
      }

      // For now, just store in local state since table doesn't exist
      //console.log('Would add market intelligence:', intelligence);
      toast.success('Inteligencia de mercado agregada (simulado)');
      
      // Add to local state
      setMarketIntelligence(prev => [{
        ...intelligence,
        id: Date.now().toString(),
        commercial_user_id: user.id,
        created_at: new Date().toISOString()
      }, ...prev]);
      
      return true;
    } catch (error) {
      console.error('Error adding market intelligence:', error);
      toast.error('Error al agregar inteligencia de mercado');
      return false;
    }
  };

  return {
    profile,
    assignments,
    marketIntelligence,
    loading,
    updateProfile,
    addMarketIntelligence,
    refetch: fetchCommercialData
  };
}
