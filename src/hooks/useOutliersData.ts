import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DemandOutlier {
  id: string;
  product_id: string;
  location_id: string;
  customer_id: string;
  vendor_id: string;
  capped_value: number;
  original_value: number;
  expected_value: number;
  severity: string;
  detection_method: string;
  explanation: string;
  avg_deviation: number;
  demand_outliers: number;
  score: number;
  postdate: string;
  percentage_deviation?: number; // Optional, if not present in the data
}

export const useOutliersData = (selectedProductId?: string, selectedCustomerId?: string, selectedLocationId?: string) => {
  return useQuery({
    queryKey: ['outliers', selectedProductId, selectedCustomerId, selectedLocationId],
    queryFn: async (): Promise<DemandOutlier[]> => {
      if (!selectedProductId || !selectedCustomerId) {
        return [];
      }

      const filters: any = {
        product_id: selectedProductId,
        customer_id: selectedCustomerId
      };

      if (selectedLocationId) {
        filters.location_id = selectedLocationId;
      }

      const { data, error } = await supabase
       .schema('m8_schema')
        .from('demand_outliers')
        .select('*')
        .match(filters);

      if (error) throw error;

      return data?.map((item: any) => ({
        id: String(item.id || ''),
        product_id: item.product_id || '',
        location_id: item.location_id || '',
        customer_id: item.customer_id || '',
        vendor_id: item.vendor_id || '',
        capped_value: item.capped_value || 0,
        original_value: item.original_value || 0,
        expected_value: item.expected_value || 0,
        severity: item.severity || '',
        detection_method: item.detection_method || '',
        explanation: item.explanation || '',
        avg_deviation: item.avg_deviation || 0,
        demand_outliers: item.demand_outliers || 0,
        score: item.score || 0,
        postdate: item.postdate || new Date().toISOString().split('T')[0],
        percentage_deviation: item.percentage_deviation  || 0
      })) || [];
    },
    enabled: !!(selectedProductId && selectedCustomerId)
  });
};