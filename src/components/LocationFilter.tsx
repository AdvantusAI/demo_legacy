import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface LocationNode {
  id: string;
  name: string;
  level: 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'location';
  children?: LocationNode[];
  isExpanded?: boolean;
  displayId?: string;
}

interface LocationFilterProps {
  onLocationSelect?: (locationId: string) => void;
  selectedLocationId?: string;
}

export function LocationFilter({
  onLocationSelect,
  selectedLocationId
}: LocationFilterProps) {
  const [locationTree, setLocationTree] = useState<LocationNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationLevels, setLocationLevels] = useState<number>(2);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchLocationLevels();
  }, []);
  useEffect(() => {
    if (locationLevels > 0) {
      fetchLocations();
    }
  }, [locationLevels, searchTerm]);
  const fetchLocationLevels = async () => {
    try {
     
      const {
        data,
        error
      } = await supabase.schema('m8_schema').from('system_config').select('location_levels');
      if (error) {
        console.error('Error fetching location levels:', error);
        setLocationLevels(2);
        return;
      }
     
      if (!data || data.length === 0) {
     
        setLocationLevels(2);
        return;
      }
      const levels = data[0]?.location_levels || 2;
     
      setLocationLevels(levels);
    } catch (error) {
      console.error('Error fetching location levels:', error);
      setLocationLevels(2);
    }
  };
  const fetchLocations = async () => {
    setLoading(true);
    try {
     
      let query = supabase
      .schema('m8_schema')
      .from('locations').select('*');
      if (searchTerm) {
        query = query.or(`location_name.ilike.%${searchTerm}%,level_1.ilike.%${searchTerm}%,level_2.ilike.%${searchTerm}%,level_3.ilike.%${searchTerm}%,level_4.ilike.%${searchTerm}%`);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
     
      const tree = buildLocationTree(data || [], locationLevels);
     
      setLocationTree(tree);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };
  const buildLocationTree = (locations: any[], levels: number): LocationNode[] => {
    //console.log('Building location tree with levels:', levels);
    const tree: Map<string, LocationNode> = new Map();
    locations.forEach(location => {
      // Level 1: Always included
      const level1Id = location.level_1 || 'no-level-1';
      const level1Name = location.level_1 || 'Sin Nivel 1';
      if (!tree.has(level1Id)) {
        tree.set(level1Id, {
          id: level1Id,
          name: level1Name,
          level: 'level_1',
          children: [],
          displayId: level1Id
        });
      }
      let currentParent = tree.get(level1Id)!;

      // Level 2: Included if levels >= 2
      if (levels >= 2 && location.level_2) {
        const level2Id = `${level1Id}-${location.level_2}`;
        const level2Name = location.level_2;
        let level2Node = currentParent.children?.find(child => child.id === level2Id);
        if (!level2Node) {
          level2Node = {
            id: level2Id,
            name: level2Name,
            level: 'level_2',
            children: [],
            displayId: location.level_2
          };
          currentParent.children!.push(level2Node);
        }
        currentParent = level2Node;
      }

      // Level 3: Included if levels >= 3
      if (levels >= 3 && location.level_3) {
        const level3Id = `${currentParent.id}-${location.level_3}`;
        const level3Name = location.level_3;
        let level3Node = currentParent.children?.find(child => child.id === level3Id);
        if (!level3Node) {
          level3Node = {
            id: level3Id,
            name: level3Name,
            level: 'level_3',
            children: [],
            displayId: location.level_3
          };
          currentParent.children!.push(level3Node);
        }
        currentParent = level3Node;
      }

      // Level 4: Included if levels >= 4
      if (levels >= 4 && location.level_4) {
        const level4Id = `${currentParent.id}-${location.level_4}`;
        const level4Name = location.level_4;
        let level4Node = currentParent.children?.find(child => child.id === level4Id);
        if (!level4Node) {
          level4Node = {
            id: level4Id,
            name: level4Name,
            level: 'level_4',
            children: [],
            displayId: location.level_4
          };
          currentParent.children!.push(level4Node);
        }
        currentParent = level4Node;
      }

      // Final level: Location (always included)
      if (location.location_name) {
        const locationNode: LocationNode = {
          id: location.location_id,
          name: `${location.location_id} - ${location.location_name}`,
          level: 'location',
          displayId: location.location_id
        };
        currentParent.children!.push(locationNode);
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
  const handleLocationClick = (locationId: string) => {
    onLocationSelect?.(locationId);
  };
  const renderNode = (node: LocationNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isLocation = node.level === 'location';
    const isSelected = selectedLocationId === node.id;
    return <div key={node.id} className="w-full">
        <div className={cn("flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded", isSelected && "bg-blue-100 text-blue-800", isLocation && "ml-4")} style={{
        paddingLeft: `${depth * 16 + 8}px`
      }} onClick={() => {
        if (isLocation) {
          handleLocationClick(node.id);
        } else if (hasChildren) {
          toggleNode(node.id);
        }
      }}>
          {hasChildren && !isLocation && <div className="mr-2">
              {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
            </div>}
          
          {isLocation && <div className="mr-2">
              <div className="h-4 w-4 flex items-center justify-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>}
          
          <span className={cn("text-sm", isLocation ? "font-normal" : "font-medium", isSelected && "font-semibold")}>
            {node.name}
          </span>
        </div>
        
        {hasChildren && isExpanded && <div className="ml-4">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>}
      </div>;
  };
  return (
    <div className="w-full max-w-md bg-white border border-gray-200 p-4 pt-4 my-0 mx-0 px-[14px] rounded-lg h-[500px] flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h3 className="font-semibold text-lg mb-2 flex items-center">
          <MapPin size={20} color="#878787" />&nbsp;
          Ubicaciones (Niveles: {locationLevels})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input type="text" placeholder="Buscar ubicaciones..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {loading ? <div className="text-center py-4 text-gray-500">Cargando ubicaciones...</div> : locationTree.length === 0 ? <div className="text-center py-4 text-gray-500">No se encontraron ubicaciones</div> : <div className="space-y-1 pr-4">
            {locationTree.map(node => renderNode(node))}
          </div>}
      </ScrollArea>
    </div>
  );
}
