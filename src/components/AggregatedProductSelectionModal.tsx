import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Package, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  product_id: string;
  product_name: string;
  category_name?: string;
  subcategory_name?: string;
  category_id?: string;
  subcategory_id?: string;
}

interface CategoryNode {
  id: string;
  name: string;
  type: 'category' | 'subcategory' | 'product';
  children?: CategoryNode[];
  product_id?: string;
  product_count?: number; // Number of products under this node
}

interface AggregatedProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: { type: 'category' | 'subcategory' | 'product'; id: string; name: string; productCount?: number }) => void;
}

export function AggregatedProductSelectionModal({ isOpen, onClose, onSelect }: AggregatedProductSelectionModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('products')
        .select('product_id, product_name, category_name, subcategory_name, category_id, subcategory_id')
        .order('product_name');

      if (error) throw error;
      
      const productsData = data || [];
      //console.log('Raw products data sample:', productsData.slice(0, 3)); // Debug log
      setProducts(productsData);
      buildCategoryTree(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildCategoryTree = (productsData: Product[]) => {
    const tree: CategoryNode[] = [];
    const categoryMap = new Map<string, CategoryNode>();
    const subcategoryMap = new Map<string, CategoryNode>();

    productsData.forEach(product => {
      // Create or get category - prioritize category_id over category_name
      const categoryKey = product.category_id || 'Sin Categoría';
      const categoryName = product.category_name || 'Sin Categoría';
      let categoryNode = categoryMap.get(categoryKey);
      if (!categoryNode) {
        categoryNode = {
          id: categoryKey,
          name: categoryName,
          type: 'category',
          children: [],
          product_count: 0
        };
        categoryMap.set(categoryKey, categoryNode);
        tree.push(categoryNode);
      }

      // Create or get subcategory - prioritize subcategory_id over subcategory_name
      const subcategoryId = product.subcategory_id || 'Sin Subcategoría';
      const subcategoryName = product.subcategory_name || 'Sin Subcategoría';
      const subcategoryKey = `${categoryKey}-${subcategoryId}`;
      let subcategoryNode = subcategoryMap.get(subcategoryKey);
      if (!subcategoryNode) {
        subcategoryNode = {
          id: subcategoryKey,
          name: subcategoryName,
          type: 'subcategory',
          children: [],
          product_count: 0
        };
        subcategoryMap.set(subcategoryKey, subcategoryNode);
        categoryNode.children!.push(subcategoryNode);
      }

      // Add product to subcategory
      const productNode: CategoryNode = {
        id: product.product_id,
        name: product.product_name || product.product_id,
        type: 'product',
        product_id: product.product_id,
        product_count: 1
      };
      subcategoryNode.children!.push(productNode);
      
      // Update product counts
      subcategoryNode.product_count = (subcategoryNode.product_count || 0) + 1;
      categoryNode.product_count = (categoryNode.product_count || 0) + 1;
    });

    setCategoryTree(tree);
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelect = (node: CategoryNode) => {
    //console.log('Node selected:', node); // Debug log
    
    // For subcategories, extract the subcategory ID from the composite key
    let formattedId = node.id;
    
    if (node.type === 'subcategory') {
      // Extract the subcategory ID from the composite key
      formattedId = node.id.split('-').pop() || node.id;
    }
    // For categories and products, keep the original ID
    
    //console.log('Formatted ID:', formattedId); // Debug log
    
    onSelect({
      type: node.type,
      id: formattedId,
      name: node.name,
      productCount: node.product_count
    });
    onClose();
    setSearchTerm('');
  };

  const filterTree = (nodes: CategoryNode[], searchTerm: string): CategoryNode[] => {
    if (!searchTerm) return nodes;
    
    return nodes.reduce((filtered: CategoryNode[], node) => {
      if (node.type === 'product') {
        if (node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            node.product_id?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return [...filtered, node];
        }
      } else if (node.children) {
        const filteredChildren = filterTree(node.children, searchTerm);
        if (filteredChildren.length > 0) {
          return [...filtered, { ...node, children: filteredChildren }];
        }
        if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return [...filtered, node];
        }
      }
      return filtered;
    }, []);
  };

  const getNodeIcon = (node: CategoryNode, isExpanded: boolean) => {
    switch (node.type) {
      case 'category':
        return isExpanded ? <FolderOpen className="h-4 w-4 mr-2 text-blue-600" /> : <Folder className="h-4 w-4 mr-2 text-blue-600" />;
      case 'subcategory':
        return isExpanded ? <FolderOpen className="h-4 w-4 mr-2 text-green-600" /> : <Folder className="h-4 w-4 mr-2 text-green-600" />;
      case 'product':
        return <Package className="h-4 w-4 mr-2 text-orange-500" />;
      default:
        return null;
    }
  };

  const getNodeBadge = (node: CategoryNode) => {
    switch (node.type) {
      case 'category':
        return (
          <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
            Categoría ({node.product_count} productos)
          </Badge>
        );
      case 'subcategory':
        return (
          <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
            Subcategoría ({node.product_count} productos)
          </Badge>
        );
      case 'product':
        return (
          <Badge variant="outline" className="ml-2 text-xs bg-orange-50 text-orange-700 border-orange-200">
            {node.product_id}
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderTreeNode = (node: CategoryNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const paddingLeft = level * 20;

    return (
      <div key={node.id}>
        <div 
          className={`flex items-center p-2 hover:bg-gray-50 cursor-pointer transition-colors ${
            node.type === 'product' ? 'text-sm' : 'font-medium'
          } ${node.type === 'category' ? 'bg-blue-50 hover:bg-blue-100' : ''} ${
            node.type === 'subcategory' ? 'bg-green-50 hover:bg-green-100' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => {
            // Allow selection of any node type
            handleSelect(node);
          }}
        >
          {hasChildren && (
            <div 
              className="mr-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the parent onClick
                toggleExpanded(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
          
          {getNodeIcon(node, isExpanded)}
          
          <span className="flex-1">{node.name}</span>
          
          {getNodeBadge(node)}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredTree = filterTree(categoryTree, searchTerm);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Seleccionar Producto, Categoría o Subcategoría</DialogTitle>
          <DialogDescription>
            Elige un producto específico, una categoría completa o una subcategoría para trabajar con datos agregados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre, ID o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Folder className="h-3 w-3 text-blue-600" />
                <span>Categoría</span>
              </div>
              <div className="flex items-center gap-1">
                <Folder className="h-3 w-3 text-green-600" />
                <span>Subcategoría</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3 text-orange-500" />
                <span>Producto</span>
              </div>
            </div>
          </div>

          <ScrollArea className="h-96 border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-sm text-muted-foreground">Cargando productos...</div>
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-sm text-muted-foreground">
                  {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
                </div>
              </div>
            ) : (
              <div className="p-2">
                {filteredTree.map(node => renderTreeNode(node))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
