import React, { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { supabase } from '@/integrations/supabase/client';
import { ColDef, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { commonAgGridConfig, agGridContainerStyles, defaultNoRowsOverlay } from '../lib/ag-grid-config';

interface ProductData {
  id: number;
  category_id: string;
  subcategory_id: string;
  category_name: string;
  subcategory_name: string;
}

interface DetailData {
  id: number;
  category_id: string;
  category_name: string;
  subcategory_id: string;
  subcategory_name: string;
  time_period: string;
  ventas: number | null;
  customer_name: string;
}

export function DataGrids() {
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [detailData, setDetailData] = useState<DetailData[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Column definitions for the first grid (Categories)
  const productColumns: ColDef[] = [
    { 
      field: 'category_id', 
      headerName: 'Category ID',
      flex: 1,
      cellStyle: { fontWeight: 'bold' }
    },
    { 
      field: 'category_name', 
      headerName: 'Category Name',
      flex: 1
    },
    { 
      field: 'subcategory_id', 
      headerName: 'Subcategory ID',
      flex: 1
    },
    { 
      field: 'subcategory_name', 
      headerName: 'Subcategory Name',
      flex: 1
    }
  ];

  // Column definitions for the second grid (Time Series Data)
  const detailColumns: ColDef[] = [
    { 
      field: 'category_name', 
      headerName: 'Category',
      flex: 1,
      cellStyle: { fontWeight: 'bold' }
    },
    { 
      field: 'subcategory_name', 
      headerName: 'Subcategory',
      flex: 1
    },
    { 
      field: 'ventas', 
      headerName: 'Ventas',
      flex: 1,
      type: 'numericColumn',
      cellStyle: { backgroundColor: '#f8edff' },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return '0';
        return params.value.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
      }
    },
    { 
      field: 'customer_name', 
      headerName: 'Customer',
      flex: 1
    }
  ];

  // Fetch initial category data from database
  const fetchProductData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Execute the SQL query using Supabase with correct schema
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('products')
        .select('category_id, subcategory_id, category_name, subcategory_name')
        .order('category_id', { ascending: true })
        .order('subcategory_id', { ascending: true })
        .order('subcategory_name', { ascending: true });

      if (error) {
        console.error('Error fetching data:', error);
        // Fallback to mock data if query fails
        
        return;
      }

      // Transform the data to match ProductData interface
      const transformedData: ProductData[] = data?.map((item, index) => ({
        id: index + 1,
        category_id: item.category_id || '',
        subcategory_id: item.subcategory_id || '',
        category_name: item.category_name || '',
        subcategory_name: item.subcategory_name || ''
      })) || [];

      // Remove duplicates based on category_id and subcategory_id
      const uniqueData = transformedData.filter((item, index, self) => 
        index === self.findIndex(t => 
          t.category_id === item.category_id && t.subcategory_id === item.subcategory_id
        )
      );

      setProductData(uniqueData);
    } catch (error) {
      console.error('Error in fetchProductData:', error);
      

    } finally {
      setLoading(false);
    }
  }, []);

    // Fetch detail data based on selected category
  const fetchDetailData = useCallback(async (subCategoryId: string) => {
    try {
      // Query the database view with subcategory filter
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('get_time_series_data')
        .select('*')
        .eq('subcategory_id', subCategoryId)


      if (error) {
        console.error('Error fetching detail data:', error);
        setDetailData([]);
        return;
      }

      // Transform the data to match DetailData interface
      const transformedData: DetailData[] = data?.map((item, index) => ({
        id: index + 1,
        category_id: item.category_id,
        category_name: item.category_name,
        subcategory_id: item.subcategory_id,
        subcategory_name: item.subcategory_name,
        time_period: item.time_period,
        ventas: item.ventas,
        customer_name: item.customer_name
      })) || [];

      //console.log('Raw data from view:', data);
      //console.log('Transformed data:', transformedData);

      setDetailData(transformedData);
    } catch (error) {
      console.error('Error in fetchDetailData:', error);
      setDetailData([]);
    }
  }, []);


  // Handle row selection in first grid
  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      const selectedProduct = selectedRows[0] as ProductData;
      setSelectedDepartmentId(selectedProduct.subcategory_id);
      fetchDetailData(selectedProduct.subcategory_id);
    }
  }, [fetchDetailData]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* First Grid - Product Groups */}
      <div className={`flex-1 ${agGridContainerStyles}`}>
        <AgGridReact
          rowData={productData}
          columnDefs={productColumns}
          defaultColDef={commonAgGridConfig.defaultColDef}
          animateRows={commonAgGridConfig.animateRows}
          headerHeight={commonAgGridConfig.headerHeight}
          rowHeight={commonAgGridConfig.rowHeight}
          theme={commonAgGridConfig.theme}
          pagination={commonAgGridConfig.pagination}
          paginationPageSize={commonAgGridConfig.paginationPageSize}
          paginationPageSizeSelector={commonAgGridConfig.paginationPageSizeSelector}
          statusBar={commonAgGridConfig.statusBar}
          onRowClicked={(event) => {
            const selectedCategory = event.data as ProductData;
            setSelectedDepartmentId(selectedCategory.subcategory_id);
            fetchDetailData(selectedCategory.subcategory_id);
          }}
        />
      </div>

      {/* Second Grid - Product-Locations */}
      <div className={`flex-1 ${agGridContainerStyles}`}>
        <AgGridReact
          rowData={detailData}
          columnDefs={detailColumns}
          defaultColDef={commonAgGridConfig.defaultColDef}
          animateRows={commonAgGridConfig.animateRows}
          headerHeight={commonAgGridConfig.headerHeight}
          rowHeight={commonAgGridConfig.rowHeight}
          theme={commonAgGridConfig.theme}
          pagination={commonAgGridConfig.pagination}
          paginationPageSize={commonAgGridConfig.paginationPageSize}
          paginationPageSizeSelector={commonAgGridConfig.paginationPageSizeSelector}
          statusBar={commonAgGridConfig.statusBar}
          noRowsOverlayComponent={() => (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-muted-foreground">Select a product group to view details</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}