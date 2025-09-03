import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches the sum of quantities for a given product, location, and customer within a specific year.
 * @param productId - The product ID.
 * @param locationId - The location ID.
 * @param customerId - The customer ID.
 * @param year - The year to filter by.
 * @returns The sum of quantities or 0 if an error occurs.
 */
export const fetchVentasYTD = async (
  productId: string,
  locationId: string,
  customerId: string,
  year: number
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('history')
      .select('quantity')
      .eq('product_id', productId)
      .eq('location_id', locationId)
      .eq('customer_id', customerId)
      .gte('postdate', `${year}-01-01`)
      .lte('postdate', `${year}-12-31`);

    if (error) {
      console.error('Error fetching Ventas YTD:', error);
      return 0;
    }

    return data.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
  } catch (error) {
    console.error('Error in fetchVentasYTD:', error);
    return 0;
  }
};

/**
 * Fetches the sum of quantities for a given product, location, and customer for the last year.
 * @param productId - The product ID.
 * @param locationId - The location ID.
 * @param customerId - The customer ID.
 * @param year - The year to filter by (last year).
 * @returns The sum of quantities or 0 if an error occurs.
 */
export const fetchVentasLY = async (
  productId: string,
  locationId: string,
  customerId: string,
  year: number
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('history')
      .select('quantity')
      .eq('product_id', productId)
      .eq('location_id', locationId)
      .eq('customer_id', customerId)
      .gte('postdate', `${year}-01-01`)
      .lte('postdate', `${year}-12-31`);

    if (error) {
      console.error('Error fetching Ventas LY:', error);
      return 0;
    }

    return data.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
  } catch (error) {
    console.error('Error in fetchVentasLY:', error);
    return 0;
  }
};

/**
 * Fetches the sum of quantities for a given product, location, and customer for the last 3 months.
 * @param productId - The product ID.
 * @param locationId - The location ID.
 * @param customerId - The customer ID.
 * @param systemDate - The system date to calculate the range.
 * @returns The sum of quantities or 0 if an error occurs.
 */
export const fetchVentas3Months = async (
  productId: string,
  locationId: string,
  customerId: string,
  systemDate: Date
): Promise<number> => {
  try {
    const startDate = new Date(systemDate.getFullYear(), systemDate.getMonth() - 3, 1).toISOString().split('T')[0];
    const endDate = systemDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('history')
      .select('quantity')
      .eq('product_id', productId)
      .eq('location_id', locationId)
      .eq('customer_id', customerId)
      .gte('postdate', startDate)
      .lte('postdate', endDate);

    if (error) {
      console.error('Error fetching Ventas 3 Months:', error);
      return 0;
    }

    return data.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
  } catch (error) {
    console.error('Error in fetchVentas3Months:', error);
    return 0;
  }
};

