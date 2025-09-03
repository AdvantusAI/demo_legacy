
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ForecastCollaboration {
  id: string;
  postdate: string;
  product_id: string;
  location_id: string;
  customer_id: string;
  forecast: number;
  actual: number;
  sales_plan: number;
  demand_planner: number;
  commercial_input?: number;
  commercial_confidence?: string;
  commercial_notes?: string;
  commercial_reviewed_by?: string;
  commercial_reviewed_at?: string;
  market_intelligence?: string;
  promotional_activity?: string;
  competitive_impact?: string;
  collaboration_status: string;
}

interface CollaborationComment {
  id: string;
  forecast_data_id: string;
  user_id: string;
  comment_text: string;
  comment_type: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
}



export function useForecastCollaboration(
  productId?: string, 
  locationId?: string, 
  customerId?: string,
  selectionType?: 'category' | 'subcategory' | 'product'
) {
  const [forecastData, setForecastData] = useState<ForecastCollaboration[]>([]);
  const [comments, setComments] = useState<CollaborationComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data when productId is selected (customerId is optional)
    if (productId) {
      fetchCollaborationData();
    } else {
      // Clear data when no product is selected
      setForecastData([]);
      setComments([]);
      setLoading(false);
    }
  }, [productId, locationId, customerId, selectionType]);

  const fetchCollaborationData = async () => {
    try {
      setLoading(true);
      
   
      
      let forecastData: Array<{
        postdate: string;
        product_id: string;
        location_id: string;
        customer_id: string;
        forecast: number | null;
        actual: number | null;
        sales_plan: number | null;
        demand_planner: number | null;
        commercial_input: number | null;
        commercial_notes: string | null;
        collaboration_status: string | null;
        products: {
          category_id: string | null;
          category_name: string | null;
          subcategory_id: string | null;
          subcategory_name: string | null;
        } | null;
      }> = [];
      
      // Determine the selection type and build appropriate query
      if (selectionType === 'category') {
        
        
        const { data, error } = await supabase
          .schema('m8_schema')
          .from('forecast_data')
          .select(`
            postdate,
            product_id,
            location_id,
            customer_id,
            forecast,
            actual,
            sales_plan,
            demand_planner,
            commercial_input,
            commercial_notes,
            collaboration_status,
            products!inner(category_id, category_name, subcategory_id, subcategory_name)
          `)
          .eq('products.category_id', productId)
          .order('postdate', { ascending: false });

        if (error) throw error;
        forecastData = data || [];
        
      } else if (selectionType === 'subcategory') {
        ////console.log('Fetching data for subcategory:', productId);
        
        const { data, error } = await supabase
          .schema('m8_schema')
          .from('forecast_data')
          .select(`
            postdate,
            product_id,
            location_id,
            customer_id,
            forecast,
            actual,
            sales_plan,
            demand_planner,
            commercial_input,
            commercial_notes,
            collaboration_status,
            products!inner(category_id, category_name, subcategory_id, subcategory_name)
          `)
          .eq('products.subcategory_id', productId)
          .order('postdate', { ascending: false });

        if (error) throw error;
        forecastData = data || [];
        
      } else if (selectionType === 'product') {
        ////console.log('Fetching data for product:', productId);
        
        const { data, error } = await supabase
          .schema('m8_schema')
          .from('forecast_data')
          .select(`
            postdate,
            product_id,
            location_id,
            customer_id,
            forecast,
            actual,
            sales_plan,
            demand_planner,
            commercial_input,
            commercial_notes,
            collaboration_status,
            products(category_id, category_name, subcategory_id, subcategory_name)
          `)
          .eq('product_id', productId)
          .order('postdate', { ascending: false });

        if (error) throw error;
        forecastData = data || [];
      }

      // Apply additional filters
      if (locationId) {
        forecastData = forecastData.filter(item => item.location_id === locationId);
      }
      if (customerId) {
        forecastData = forecastData.filter(item => item.customer_id === customerId);
      }

     

      // Aggregate data by postdate
      const aggregatedData = new Map<string, {
        postdate: string;
        product_id: string;
        location_id: string;
        customer_id: string;
        forecast: number;
        actual: number;
        sales_plan: number;
        demand_planner: number;
        commercial_input: number;
        commercial_notes: string;
        collaboration_status: string;
      }>();
      
      forecastData.forEach(item => {
        const postdate = item.postdate;
        if (!aggregatedData.has(postdate)) {
          aggregatedData.set(postdate, {
            postdate,
            product_id: item.product_id,
            location_id: item.location_id,
            customer_id: item.customer_id,
            forecast: 0,
            actual: 0,
            sales_plan: 0,
            demand_planner: 0,
            commercial_input: 0,
            commercial_notes: item.commercial_notes || '',
            collaboration_status: item.collaboration_status || 'pending_review'
          });
        }
        
        const existing = aggregatedData.get(postdate);
        existing.forecast += (item.forecast || 0);
        existing.actual += (item.actual || 0);
        existing.sales_plan += (item.sales_plan || 0);
        existing.demand_planner += (item.demand_planner || 0);
        existing.commercial_input += (item.commercial_input || 0);
      });

      // Convert to array and map to expected format
      const processedData = Array.from(aggregatedData.values()).map(item => ({
        id: `agg_${item.postdate}_${item.product_id}`,
        postdate: item.postdate,
        product_id: item.product_id,
        location_id: item.location_id,
        customer_id: item.customer_id,
        forecast: item.forecast,
        actual: item.actual,
        sales_plan: item.sales_plan,
        demand_planner: item.demand_planner,
        commercial_input: item.commercial_input,
        commercial_notes: item.commercial_notes,
        collaboration_status: item.collaboration_status
      })) as unknown as ForecastCollaboration[];

    
      setForecastData(processedData);

      // For aggregated data, we don't fetch comments
      setComments([]);

    } catch (error) {
      console.error('Error fetching collaboration data:', error);
      toast.error('Error al cargar datos de colaboración');
    } finally {
      setLoading(false);
    }
  };
  const fetchFilteredDataByProductIds = async (productIds: string[]) => {
    try {
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('forecast_data')
        .select('*')
        .in('product_id', productIds);

      if (error) throw error;

      setForecastData(data || []);
    } catch (error) {
      console.error('Error fetching filtered data:', error);
      toast.error('Error al cargar datos filtrados');
    }
  };

  const updateForecastCollaboration = async (
    forecastId: string, 
    updates: Partial<ForecastCollaboration>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuario no autenticado');
        return false;
      }

      const { error } = await supabase  
        .schema('m8_schema')
        .from('forecast_data')
        .update({
          ...updates,
          commercial_reviewed_by: user.id,
          commercial_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', forecastId);

      if (error) throw error;

      toast.success('Colaboración actualizada exitosamente');
      await fetchCollaborationData();
      return true;
    } catch (error) {
      console.error('Error updating forecast collaboration:', error);
      toast.error('Error al actualizar colaboración');
      return false;
    }
  };

  const addComment = async (
    forecastId: string,
    commentText: string,
    commentType: string = 'information'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuario no autenticado');
        return false;
      }

      const { error } = await supabase
        .schema('m8_schema')
        .from('forecast_collaboration_comments')
        .insert({
          forecast_data_id: forecastId,
          user_id: user.id,
          comment_text: commentText,
          comment_type: commentType
        });

      if (error) throw error;

      toast.success('Comentario agregado');
      await fetchCollaborationData();
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar comentario');
      return false;
    }
  };

  return {
    forecastData,
    comments,
    loading,
    updateForecastCollaboration,
    addComment,
    refetch: fetchCollaborationData,
    fetchFilteredDataByProductIds, // Expose the function for external use
  };
}
