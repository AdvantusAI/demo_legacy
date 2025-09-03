
import React, { useState } from 'react';
import { ProductFilter } from '@/components/ProductFilter';

export default function Products() {
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    //console.log('Producto seleccionado:', productId);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProductFilter 
            onProductSelect={handleProductSelect}
            selectedProductId={selectedProductId}
          />
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Contenido del Producto</h2>
            {selectedProductId ? (
              <div>
                <p className="text-gray-600">Producto seleccionado:</p>
                <p className="font-medium text-lg">{selectedProductId}</p>
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">
                    Aquí puedes mostrar los detalles del producto seleccionado, 
                    como descripción, precio, imágenes, etc.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Selecciona un producto del filtro para ver sus detalles</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
