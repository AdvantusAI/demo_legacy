import { supabase } from '@/integrations/supabase/client';

export interface PlanAnalysisRow {
  product_id: string;
  node_name: string;
  sort_order: number;
  week_1?: number;
  week_2?: number;
  week_3?: number;
  week_4?: number;
  week_5?: number;
  week_6?: number;
  week_7?: number;
  week_8?: number;
  week_9?: number;
  week_10?: number;
  week_11?: number;
  week_12?: number;
  week_13?: number;
  week_14?: number;
  week_15?: number;
  week_16?: number;
  week_17?: number;
  week_18?: number;
  [key: string]: any;
}

export interface PlanAnalysisData {
  product_id: string;
  rows: PlanAnalysisRow[];
}

export class PlanAnalysisService {
  /**
   * Get plan analysis data for a specific product
   */
  static async getPlanAnalysisData(productId: string): Promise<PlanAnalysisData | null> {
    try {
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('v_plan_analysis')
        .select('*')
        .eq('product_id', productId)
        .order('node_name')
        .order('sort_order');

      if (error) {
        console.error('Error fetching plan analysis data:', error);
        // If the view doesn't exist, return mock data for development
        return this.getMockPlanAnalysisData(productId);
      }

      if (!data || data.length === 0) {
        return this.getMockPlanAnalysisData(productId);
      }

      return {
        product_id: productId,
        rows: data
      };
    } catch (error) {
      console.error('Error in getPlanAnalysisData:', error);
      return this.getMockPlanAnalysisData(productId);
    }
  }

  /**
   * Get plan analysis data for multiple products
   */
  static async getPlanAnalysisDataMultiple(productIds: string[]): Promise<Record<string, PlanAnalysisData>> {
    try {
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('v_plan_analysis')
        .select('*')
        .in('product_id', productIds)
        .order('product_id')
        .order('node_name')
        .order('sort_order');

      if (error) {
        console.error('Error fetching multiple plan analysis data:', error);
        // Return mock data for all products
        const result: Record<string, PlanAnalysisData> = {};
        productIds.forEach(productId => {
          result[productId] = this.getMockPlanAnalysisData(productId);
        });
        return result;
      }

      // Group data by product_id
      const grouped = data.reduce((acc: Record<string, PlanAnalysisRow[]>, row: any) => {
        if (!acc[row.product_id]) {
          acc[row.product_id] = [];
        }
        acc[row.product_id].push(row);
        return acc;
      }, {});

      // Convert to PlanAnalysisData format
      const result: Record<string, PlanAnalysisData> = {};
      Object.keys(grouped).forEach(productId => {
        result[productId] = {
          product_id: productId,
          rows: grouped[productId]
        };
      });

      return result;
    } catch (error) {
      console.error('Error in getPlanAnalysisDataMultiple:', error);
      const result: Record<string, PlanAnalysisData> = {};
      productIds.forEach(productId => {
        result[productId] = this.getMockPlanAnalysisData(productId);
      });
      return result;
    }
  }

  /**
   * Get available products that have plan analysis data
   */
  static async getAvailableProducts(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('v_plan_analysis')
        .select('product_id')
        .order('product_id');

      if (error) {
        console.error('Error fetching available products:', error);
        return ['4860018', '4860019', '4860020', '4860021', '4860022'];
      }

      const uniqueProducts = [...new Set(data.map((row: any) => row.product_id))];
      return uniqueProducts.length > 0 ? uniqueProducts : ['4860018', '4860019', '4860020', '4860021', '4860022'];
    } catch (error) {
      console.error('Error in getAvailableProducts:', error);
      return ['4860018', '4860019', '4860020', '4860021', '4860022'];
    }
  }

  /**
   * Mock data for development when the view doesn't exist
   */
  private static getMockPlanAnalysisData(productId: string): PlanAnalysisData {
    const baseRows: PlanAnalysisRow[] = [
      {
        product_id: productId,
        node_name: 'Total Demand',
        sort_order: 1,
        week_1: 28.11,
        week_2: 98.38,
        week_3: 98.38,
        week_4: 144.59,
        week_5: 144.59,
        week_6: 144.59,
        week_7: 144.59,
        week_8: 143.92,
        week_9: 143.65,
        week_10: 143.65,
        week_11: 145.20,
        week_12: 147.30,
        week_13: 149.50,
        week_14: 151.20,
        week_15: 153.40,
        week_16: 155.60,
        week_17: 158.20,
        week_18: 160.40
      },
      {
        product_id: productId,
        node_name: 'TotIntransin',
        sort_order: 2,
        week_1: 0,
        week_2: 0,
        week_3: 0,
        week_4: 0,
        week_5: 0,
        week_6: 0,
        week_7: 0,
        week_8: 0,
        week_9: 0,
        week_10: 0,
        week_11: 0,
        week_12: 0,
        week_13: 0,
        week_14: 0,
        week_15: 0,
        week_16: 0,
        week_17: 0,
        week_18: 0
      },
      {
        product_id: productId,
        node_name: 'Planned Arrivals',
        sort_order: 3,
        week_1: 0,
        week_2: 200,
        week_3: 200,
        week_4: 0,
        week_5: 200,
        week_6: 200,
        week_7: 200,
        week_8: 0,
        week_9: 200,
        week_10: 200,
        week_11: 200,
        week_12: 200,
        week_13: 250,
        week_14: 250,
        week_15: 250,
        week_16: 300,
        week_17: 300,
        week_18: 300
      },
      {
        product_id: productId,
        node_name: 'Planned Orders',
        sort_order: 4,
        week_1: 0,
        week_2: 0,
        week_3: 0,
        week_4: 0,
        week_5: 0,
        week_6: 0,
        week_7: 0,
        week_8: 0,
        week_9: 0,
        week_10: 0,
        week_11: 0,
        week_12: 0,
        week_13: 0,
        week_14: 0,
        week_15: 0,
        week_16: 0,
        week_17: 700,
        week_18: 0
      },
      {
        product_id: productId,
        node_name: 'Projected On Hand',
        sort_order: 5,
        week_1: 80,
        week_2: -70,
        week_3: 520,
        week_4: 415,
        week_5: 315,
        week_6: 915,
        week_7: 820,
        week_8: 725,
        week_9: 630,
        week_10: 535,
        week_11: 440,
        week_12: 345,
        week_13: 250,
        week_14: 155,
        week_15: 60,
        week_16: -35,
        week_17: 265,
        week_18: 105
      },
      {
        product_id: productId,
        node_name: 'SS',
        sort_order: 6,
        week_1: 100,
        week_2: 100,
        week_3: 100,
        week_4: 100,
        week_5: 100,
        week_6: 100,
        week_7: 100,
        week_8: 100,
        week_9: 100,
        week_10: 100,
        week_11: 100,
        week_12: 100,
        week_13: 100,
        week_14: 100,
        week_15: 100,
        week_16: 100,
        week_17: 100,
        week_18: 100
      },
      {
        product_id: productId,
        node_name: 'Projected Available',
        sort_order: 7,
        week_1: -28.11,
        week_2: 73.51,
        week_3: 175.13,
        week_4: 30.54,
        week_5: 85.95,
        week_6: 141.36,
        week_7: 196.77,
        week_8: 52.85,
        week_9: 109.2,
        week_10: 165.55,
        week_11: 221.9,
        week_12: 278.25,
        week_13: 334.6,
        week_14: 390.95,
        week_15: 447.3,
        week_16: 503.65,
        week_17: 560.0,
        week_18: 616.35
      }
    ];

    // Add some variation based on product ID
    const productVariation = parseInt(productId.slice(-1)) || 1;
    baseRows.forEach(row => {
      for (let week = 1; week <= 18; week++) {
        const weekKey = `week_${week}`;
        if (typeof row[weekKey] === 'number') {
          row[weekKey] = row[weekKey] * (0.8 + productVariation * 0.1);
        }
      }
    });

    return {
      product_id: productId,
      rows: baseRows
    };
  }

  /**
   * Export plan analysis data to Excel format
   */
  static exportToExcel(data: PlanAnalysisData[]): void {
    // This would integrate with a library like xlsx to export to Excel
    const exportData = data.map(productData => ({
      Product: productData.product_id,
      ...productData.rows.reduce((acc, row) => {
        const rowData: any = { [row.node_name]: '' };
        for (let week = 1; week <= 18; week++) {
          rowData[`${row.node_name}_Week_${week}`] = row[`week_${week}`] || 0;
        }
        return { ...acc, ...rowData };
      }, {})
    }));

    //console.log('Export data prepared:', exportData);
    // TODO: Implement actual Excel export
  }
}