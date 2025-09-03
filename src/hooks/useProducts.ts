import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  product_id: string;
  product_name: string;
  [key: string]: any; // Allow any additional fields from the database
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
       .schema('m8_schema')
        .from('products')
        .select('*')
        .order('product_name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: string): string => {
    const product = products.find(p => p.product_id === productId);
    return product?.product_name || `Producto ${productId}`;
  };

  return {
    products,
    loading,
    error,
    getProductName,
    refetch: fetchProducts
  };
}