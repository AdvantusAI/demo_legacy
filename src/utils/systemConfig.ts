import { createClient } from '@supabase/supabase-js'; // Import Supabase client

import { supabase } from '@/integrations/supabase/client';

export const getSystemConfig = async (key: string): Promise<{ currentDate: string } | null> => {
  try {
    if (key === 'system_date') {
      const { data, error } = await supabase
        .from('system_config')
        .select('system_date')
        .limit(1);

      if (error) {
        console.error(`Error fetching system config for key: ${key}`, error);
        return null;
      }

      return { currentDate: data?.[0]?.system_date || null };
    }

    console.error(`Unsupported key: ${key}`);
    return null;
  } catch (error) {
    console.error(`Error fetching system config for key: ${key}`, error);
    return null;
  }
};