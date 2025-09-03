
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface VendorNode {
  id: string;
  code: string;
  name: string;
  vendor_id: string;
  level_1?: string;
  level_1_name?: string;
  children?: VendorNode[];
  isExpanded?: boolean;
}

interface VendorFilterProps {
  onVendorSelect?: (vendorId: string) => void;
  selectedVendorId?: string;
  selectedProductId?: string;
}

export function VendorFilter({
  onVendorSelect,
  selectedVendorId,
  selectedProductId
}: VendorFilterProps) {
  const [vendorTree, setVendorTree] = useState<VendorNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [vendorLevels, setVendorLevels] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemConfig();
  }, []);
  
  useEffect(() => {
    if (selectedProductId) {
      fetchVendorsForProduct();
    } else {
      setVendorTree([]);
      setLoading(false);
    }
  }, [searchTerm, vendorLevels, selectedProductId]);

  const fetchSystemConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('vendor_levels')
        .single();
      
      if (error || !data) {
        //console.log('No system config found, using default vendor_levels = 1');
        setVendorLevels(1);
        return;
      }
      
      // Handle case where vendor_levels column might not exist
      const levels = (data as any)?.vendor_levels || 1;
      setVendorLevels(levels);
      //console.log('Vendor levels:', levels);
    } catch (error) {
      console.error('Error fetching system config:', error);
      setVendorLevels(1);
    }
  };

  const fetchVendorsForProduct = async () => {
    if (!selectedProductId) {
      setVendorTree([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      //console.log('Fetching vendors for product:', selectedProductId);
      
      // Create mock vendor data since vendor tables don't exist yet
      const mockVendors = [
        { code: 'V001', name: 'Proveedor Principal', level_1: 'L1', level_1_name: 'Nivel 1' },
        { code: 'V002', name: 'Proveedor Secundario', level_1: 'L1', level_1_name: 'Nivel 1' },
        { code: 'V003', name: 'Proveedor Especial', level_1: 'L2', level_1_name: 'Nivel 2' }
      ];

      //console.log('Using mock vendor data:', mockVendors);

      if (vendorLevels === 1) {
        // Flat structure: just vendor_code - vendor_name
        const vendorNodes: VendorNode[] = mockVendors.map(vendor => ({
          id: vendor.code,
          code: vendor.code,
          name: vendor.name ? `${vendor.code} - ${vendor.name}` : vendor.code,
          vendor_id: vendor.code
        }));
        setVendorTree(vendorNodes);
      } else {
        const hierarchicalVendors = buildHierarchy(mockVendors);
        setVendorTree(hierarchicalVendors);
      }
    } catch (error) {
      console.error('Error fetching vendors for product:', error);
      setVendorTree([]);
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (data: any[]): VendorNode[] => {
    const hierarchyMap = new Map<string, VendorNode>();

    data.forEach(vendor => {
      const level1Key = (vendor as any)?.level_1 || 'Sin proveedor';
      const level1Name = (vendor as any)?.level_1_name || 'Sin nombre';
      const level1Id = `level1-${level1Key}`;

      // Create or get level 1 node
      if (!hierarchyMap.has(level1Id)) {
        hierarchyMap.set(level1Id, {
          id: level1Id,
          code: level1Key,
          name: `${level1Key} - ${level1Name}`,
          vendor_id: level1Key,
          level_1: level1Key,
          level_1_name: level1Name,
          children: [],
          isExpanded: false
        });
      }
      // Add vendor to level 1
      const level1Node = hierarchyMap.get(level1Id)!;
      const vendorNode: VendorNode = {
        id: (vendor as any)?.code || 'unknown',
        code: (vendor as any)?.code || 'unknown',
        name: (vendor as any)?.name ? `${(vendor as any).code} - ${(vendor as any).name}` : (vendor as any)?.code || 'unknown',
        vendor_id: (vendor as any)?.code || 'unknown'
      };

      level1Node.children!.push(vendorNode);
    });

    return Array.from(hierarchyMap.values());
  };

  const handleNodeToggle = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleVendorClick = (vendorId: string, hasChildren: boolean = false) => {
    if (hasChildren) {
      handleNodeToggle(vendorId);
    } else {
      onVendorSelect?.(vendorId);
    }
  };

  const renderNode = (node: VendorNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedVendorId === node.code;
    const isVendorLevel = !hasChildren;

    return (
      <div key={node.id} className="w-full">
        <div
          className={cn(
            "flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded",
            level > 0 && "ml-4",
            isSelected && isVendorLevel && "bg-orange-100 text-orange-800",
            hasChildren && "font-medium text-gray-700"
          )}
          onClick={() => handleVendorClick(node.id, hasChildren)}
        >
          <div className="mr-2">
            {hasChildren ? (
              <div className="h-4 w-4 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>
            ) : (
              <div className="h-4 w-4 flex items-center justify-center">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
              </div>
            )}
          </div>
          
          <span className={cn(
            "text-sm",
            hasChildren && "font-medium",
            isSelected && isVendorLevel && "font-semibold",
            !hasChildren && "font-normal"
          )}>
            {node.name}
          </span>
        </div>

        {hasChildren && isExpanded && node.children && (
          <div className="ml-2">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 p-4 pt-4 my-0 mx-0 px-[14px] rounded-lg h-[500px] flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h3 className="font-semibold text-lg mb-2 flex items-center">
          <Truck className="w-4 h-4 mr-2 text-gray-400" />
          Proveedores
        </h3>
        {!selectedProductId && (
          <div className="text-sm text-gray-500 mb-2">
            Selecciona un producto primero
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={!selectedProductId}
          />
        </div>
      </div>
      
      <ScrollArea className="h-96 border rounded-md">
        {!selectedProductId ? (
          <div className="flex items-center justify-center p-8 text-gray-500">Selecciona un producto para ver proveedores</div>
        ) : loading ? (
          <div className="text-center py-4 text-gray-500">Cargando proveedores...</div>
        ) : vendorTree.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No se encontraron proveedores para este producto</div>
        ) : (
          <div className="space-y-1 pr-4">
            {vendorTree.map(vendor => renderNode(vendor))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
