
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, ChevronRight, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Location{
  location_id: string,
  location_name: string,
  level_1?:string,
  level_2?:string,
  level_3?:string,
  level_4?:string,
  type?:string
}

interface LocationNode {
  id: string;
  name: string;
  level: 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'location';
  children?: LocationNode[];
  isExpanded?: boolean;
  location_id?: string;
  type?:string;
}

interface LocationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (locationId: string) => void;
}

interface LocationFilterProps {
  onLocationSelect?: (locationId: string) => void;
  selectedLocationId?: string;
}

export function LocationSelectionModal({isOpen,onClose, onSelect}: LocationSelectionModalProps) {  
  const [locations, setLocations] = useState<Location[]>([]);
  const [ciudad, setCiudadTree] = useState<LocationNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  
  useEffect(() => {
      if (isOpen) {
        fetchLocations();
      }
  }, [isOpen]);

const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('locations')
        .select('location_id, location_name, level_1, level_2, level_3, level_4, type')
        .order('location_name');

      if (error) throw error;
      
      const locationsData = data || [];
      setLocations(locationsData);
      buildLevel1Tree(locationsData);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  
  const buildLevel1Tree = (locationsData: Location[]) => {
    const tree: LocationNode[] = [];
    const level1Map = new Map<string, LocationNode>();

    locationsData.forEach(location => {
      // Create or get level_1
      const level1Key = location.level_1 || 'Sin Localidad';
      let level1Node = level1Map.get(level1Key);
      if (!level1Node) {
        level1Node = {
          id: level1Key,
          name: location.level_1 || 'Sin Localidad',
          level: 'level_1',
          type: 'category',
          children: []
        };
        level1Map.set(level1Key, level1Node);
        tree.push(level1Node);
      }

      // Add location to level_1
      const locationNode: LocationNode = {
        id: location.location_id,
        name: location.location_name || location.location_id,
        level: 'location',
        type: 'location',
        location_id: location.location_id
      };
      level1Node.children!.push(locationNode);
    });

    setCiudadTree(tree);
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

  const handleSelect = (productId: string) => {
    onSelect(productId);
    onClose();
    setSearchTerm('');
  };

  const filterTree = (nodes: LocationNode[], searchTerm: string): LocationNode[] => {
    if (!searchTerm) return nodes;
    
    return nodes.reduce((filtered: LocationNode[], node) => {
      if (node.type === 'location') {
        if (node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            node.location_id?.toLowerCase().includes(searchTerm.toLowerCase())) {
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

  const renderTreeNode = (node: LocationNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const paddingLeft = level * 20;

    return (
      <div key={node.id}>
        <div 
          className={`flex items-center p-2 hover:bg-gray-50 cursor-pointer ${
            node.type === 'location' ? 'text-sm' : 'font-medium'
          }`}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => {
            if (node.type === 'location' && node.location_id) {
              handleSelect(node.location_id);
            } else if (hasChildren) {
              toggleExpanded(node.id);
            }
          }}
        >
          {hasChildren && (
            <div className="mr-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
          
          {node.type === 'location' && <Package className="h-4 w-4 mr-2 text-blue-500" />}
          
          <span className="flex-1">{node.name}</span>
          
          {node.type === 'category' && (
            <Badge variant="outline" className="ml-2 text-xs">
              Compañía
            </Badge>
          )}
          {node.type === 'subcategory' && (
            <Badge variant="outline" className="ml-2 text-xs">
              Subcategoría
            </Badge>
          )}
          {node.type === 'location' && (
            <Badge variant="outline" className="ml-2 text-xs">
              {node.location_id}
            </Badge>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredTree = filterTree(ciudad, searchTerm);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Seleccionar Ubicación
          </DialogTitle>
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

          <ScrollArea className="h-96 border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-sm text-muted-foreground">Cargando ubicaciones...</div>
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-sm text-muted-foreground">
                  {searchTerm ? 'No se encontraron ubicaciones' : 'No hay ubicaciones disponibles'}
                </div>
              </div>
            ) : (
              <div className="p-2">
                {filteredTree.map(node => renderTreeNode(node))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
