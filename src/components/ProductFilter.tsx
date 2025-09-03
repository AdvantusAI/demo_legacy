import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, PackageSearch } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ProductNode {
  id: string;
  name: string;
  level: 'category' | 'subcategory' | 'class' | 'subclass' | 'product';
  children?: ProductNode[];
  isExpanded?: boolean;
  displayId?: string; // Add displayId for showing the original ID
}
interface ProductFilterProps {
  onProductSelect?: (productId: string) => void;
  selectedProductId?: string;
}
export function ProductFilter({
  onProductSelect,
  selectedProductId
}: ProductFilterProps) {
  const [productTree, setProductTree] = useState<ProductNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productLevels, setProductLevels] = useState<number>(2); // Default to 2 instead of 4
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchProductLevels();
  }, []);
  useEffect(() => {
    if (productLevels > 0) {
      fetchProducts();
    }
  }, [productLevels, searchTerm]);
  const fetchProductLevels = async () => {
    try {
      //console.log('Fetching product levels...');
      const {
        data,
        error
      } = await supabase.schema('m8_schema').from('system_config').select('product_levels');
      if (error) {
        console.error('Error fetching product levels:', error);
        setProductLevels(2); // Default to 2 levels
        return;
      }
      //console.log('System config data:', data);
      if (!data || data.length === 0) {
        //console.log('No system config found, using default 2 levels');
        setProductLevels(2);
        return;
      }
      const levels = data[0]?.product_levels || 2;
      //console.log('Product levels from database:', levels);
      setProductLevels(levels);
    } catch (error) {
      console.error('Error fetching product levels:', error);
      setProductLevels(2); // Default to 2 levels
    }
  };
  const fetchProducts = async () => {
    setLoading(true);
    try {
      //console.log('Fetching products with levels:', productLevels);
      let query = supabase.from('products').select('*');
      if (searchTerm) {
        query = query.or(`product_name.ilike.%${searchTerm}%,category_name.ilike.%${searchTerm}%,subcategory_name.ilike.%${searchTerm}%,class_name.ilike.%${searchTerm}%,subclass_name.ilike.%${searchTerm}%`);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      //console.log('Products data:', data);
      const tree = buildProductTree(data || [], productLevels);
      //console.log('Built tree:', tree);
      setProductTree(tree);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };
  const buildProductTree = (products: any[], levels: number): ProductNode[] => {
    //console.log('Building tree with levels:', levels);
    const tree: Map<string, ProductNode> = new Map();
    products.forEach(product => {
      // Level 1: Category (always included)
      const categoryId = product.category_id || 'no-category';
      const categoryName = product.category_name || 'Sin Categoría';
      if (!tree.has(categoryId)) {
        tree.set(categoryId, {
          id: categoryId,
          name: `${categoryId} - ${categoryName}`,
          level: 'category',
          children: [],
          displayId: categoryId
        });
      }
      let currentParent = tree.get(categoryId)!;

      // Level 2: Subcategory (included if levels >= 2)
      if (levels >= 2) {
        const subcategoryId = `${categoryId}-${product.subcategory_id || 'no-subcategory'}`;
        const subcategoryName = product.subcategory_name || 'Sin Subcategoría';
        const originalSubcategoryId = product.subcategory_id || 'no-subcategory';
        let subcategoryNode = currentParent.children?.find(child => child.id === subcategoryId);
        if (!subcategoryNode) {
          subcategoryNode = {
            id: subcategoryId,
            name: `${originalSubcategoryId} - ${subcategoryName}`,
            level: 'subcategory',
            children: [],
            displayId: originalSubcategoryId
          };
          currentParent.children!.push(subcategoryNode);
        }
        currentParent = subcategoryNode;
      }

      // Level 3: Class (included if levels >= 3)
      if (levels >= 3) {
        const classId = `${currentParent.id}-${product.class_id || 'no-class'}`;
        const className = product.class_name || 'Sin Clase';
        const originalClassId = product.class_id || 'no-class';
        let classNode = currentParent.children?.find(child => child.id === classId);
        if (!classNode) {
          classNode = {
            id: classId,
            name: `${originalClassId} - ${className}`,
            level: 'class',
            children: [],
            displayId: originalClassId
          };
          currentParent.children!.push(classNode);
        }
        currentParent = classNode;
      }

      // Level 4: Subclass (included if levels >= 4)
      if (levels >= 4) {
        const subclassId = `${currentParent.id}-${product.subclass_id || 'no-subclass'}`;
        const subclassName = product.subclass_name || 'Sin Subclase';
        const originalSubclassId = product.subclass_id || 'no-subclass';
        let subclassNode = currentParent.children?.find(child => child.id === subclassId);
        if (!subclassNode) {
          subclassNode = {
            id: subclassId,
            name: `${originalSubclassId} - ${subclassName}`,
            level: 'subclass',
            children: [],
            displayId: originalSubclassId
          };
          currentParent.children!.push(subclassNode);
        }
        currentParent = subclassNode;
      }

      // Final level: Product (always included)
      if (product.product_name) {
        const productNode: ProductNode = {
          id: product.product_id,
          name: `${product.product_id} - ${product.product_name}`,
          level: 'product',
          displayId: product.product_id
        };
        currentParent.children!.push(productNode);
      }
    });
    return Array.from(tree.values());
  };
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };
  const handleProductClick = (productId: string) => {
    onProductSelect?.(productId);
  };
  const renderNode = (node: ProductNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isProduct = node.level === 'product';
    const isSelected = selectedProductId === node.id;
    return <div key={node.id} className="w-full">
        <div className={cn("flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded", isSelected && "bg-green-100 text-green-800", isProduct && "ml-4")} style={{
        paddingLeft: `${depth * 16 + 8}px`
      }} onClick={() => {
        if (isProduct) {
          handleProductClick(node.id);
        } else if (hasChildren) {
          toggleNode(node.id);
        }
      }}>
          {hasChildren && !isProduct && <div className="mr-2">
              {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
            </div>}
          
          {isProduct && <div className="mr-2">
              <div className="h-4 w-4 flex items-center justify-center">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
            </div>}
          
          <span className={cn("text-sm", isProduct ? "font-normal" : "font-medium", isSelected && "font-semibold")}>
            {node.name}
          </span>
        </div>
        
        {hasChildren && isExpanded && <div className="ml-4">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>}
      </div>;
  };
  return <div className="w-full max-w-md bg-white border border-gray-200 p-4 pt-4 my-0 mx-0 px-[14px] rounded-lg h-[500px] flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h3 className="font-semibold text-lg mb-2 flex items-center">
          <PackageSearch size={20} color="#878787" />&nbsp;
          
          Productos (Niveles: {productLevels})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {loading ? <div className="text-center py-4 text-gray-500">Cargando productos...</div> : productTree.length === 0 ? <div className="text-center py-4 text-gray-500">No se encontraron productos</div> : <div className="space-y-1 pr-4">
            {productTree.map(node => renderNode(node))}
          </div>}
      </ScrollArea>
    </div>;
}
