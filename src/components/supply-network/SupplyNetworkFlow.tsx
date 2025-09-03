import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useSupplyNetwork } from '@/hooks/useSupplyNetwork';
import { SupplyNetworkNode } from './SupplyNetworkNode';
import { SupplyNetworkToolbar } from './SupplyNetworkToolbar';
import { EditNodeModal } from './EditNodeModal';
import { RelationshipEditorModal } from './RelationshipEditorModal';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Settings } from 'lucide-react';

const nodeTypes: NodeTypes = {
  supplyNetworkNode: SupplyNetworkNode,
};

const getNodeColor = (nodeTypeCode: string) => {
  // Return default color for all node types
  return '#082647'; // Default gray
};

// Save/load positions from localStorage
const saveNodePositions = (nodes: Node[]) => {
  const positions = nodes.reduce((acc, node) => {
    acc[node.id] = node.position;
    return acc;
  }, {} as Record<string, { x: number; y: number }>);
  localStorage.setItem('supply-network-positions', JSON.stringify(positions));
};

const loadNodePositions = (): Record<string, { x: number; y: number }> => {
  try {
    const saved = localStorage.getItem('supply-network-positions');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const SupplyNetworkFlow: React.FC = () => {
  const { nodes: dbNodes, relationships: dbRelationships, isLoading, createRelationship, deleteRelationship } = useSupplyNetwork();
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null);
  const [dbNodeTypes, setDbNodeTypes] = useState<Array<{id: string, type_code: string, type_name: string, icon_name: string}>>([]);
  const [contextMenu, setContextMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  // Fetch node types
  useEffect(() => {
    const fetchNodeTypes = async () => {
      try {
        const { data, error } = await 
          (supabase as any).schema('m8_schema').rpc('get_supply_network_node_types');
        if (error) throw error;
        setDbNodeTypes(data || []);
      } catch (error) {
        console.error('Error fetching node types:', error);
      }
    };

    fetchNodeTypes();
  }, []);
  
  // Convert database nodes to React Flow nodes
  const flowNodes: Node[] = useMemo(() => {
    if (!dbNodes) return [];
    
    const savedPositions = loadNodePositions();
    
    return dbNodes.map((node, index) => {
      const nodeTypeInfo = dbNodeTypes.find(nt => nt.id === node.node_type_id);
      const savedPosition = savedPositions[node.id];
      
      return {
        id: node.id,
        type: 'supplyNetworkNode',
        position: savedPosition || { 
          x: (index % 4) * 250 + 100, 
          y: Math.floor(index / 4) * 200 + 100 
        },
        data: {
          label: node.node_name || node.id,
          nodeType: node.node_type_id || 'unknown',
          nodeTypeCode: nodeTypeInfo?.type_code || 'unknown',
          iconName: nodeTypeInfo?.icon_name || 'Package',
          properties: node.contact_information || {},
          status: node.status,
          color: getNodeColor(nodeTypeInfo?.type_code || 'unknown'),
        },
      };
    });
  }, [dbNodes, dbNodeTypes]);

  // Convert database relationships to React Flow edges
  const flowEdges: Edge[] = useMemo(() => {
    if (!dbRelationships) return [];
    
    return dbRelationships.map((rel) => {
      // Create a meaningful label with lead time and cost
      const leadTime = rel.lead_time_days ? `${rel.lead_time_days}d` : '';
      const cost = rel.primary_transport_cost ? `$${rel.primary_transport_cost}` : '';
      const labelParts = [leadTime, cost].filter(Boolean);
      const label = labelParts.length > 0 ? labelParts.join(' | ') : 'Connection';

              return {
          id: rel.id,
          source: rel.source_node_id,
          target: rel.target_node_id,
          animated: rel.status === 'active',
          label: '',
          style: {
            strokeWidth: 2,
            stroke: '#FF0072',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#FF0072',
          },
          data: {
          relationshipId: rel.id,
          relationshipType: rel.relationship_type_id || 'unknown',
          properties: { 
            description: rel.description || '', 
            cost: rel.cost || 0,
            leadTime: rel.lead_time_days || 0
          },
          status: rel.status,
        },
      };
    });
  }, [dbRelationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Save positions when nodes change
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    // Save positions after a short delay to avoid excessive saves during dragging
    setTimeout(() => {
      setNodes((currentNodes) => {
        saveNodePositions(currentNodes);
        return currentNodes;
      });
    }, 100);
  }, [onNodesChange, setNodes]);

  // Update nodes and edges when database data changes
  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        createRelationship.mutate({
          source_node_id: params.source,
          target_node_id: params.target,
          relationship_type_id: 'supplies',
          status: 'active',
          description: 'Auto-created relationship',
        });
      }
    },
    [createRelationship]
  );

  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      if (edge.data?.relationshipId && typeof edge.data.relationshipId === 'string') {
        setEditingRelationshipId(edge.data.relationshipId);
      }
    },
    []
  );

  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setEditingNodeId(node.id);
    },
    []
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        id: node.id,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full h-[800px] p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-full w-full" />
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full h-[800px] relative">
      <SupplyNetworkToolbar />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
        className="bg-background"
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>

      {editingNodeId && (
        <EditNodeModal
          isOpen={!!editingNodeId}
          onClose={() => setEditingNodeId(null)}
          nodeId={editingNodeId}
        />
      )}

      {editingRelationshipId && (
        <RelationshipEditorModal
          isOpen={!!editingRelationshipId}
          onClose={() => setEditingRelationshipId(null)}
          relationshipId={editingRelationshipId}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#e1ebf7] border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
            onClick={() => {
              console.log('Supply workbench clicked for node:', contextMenu.id);
              setContextMenu(null);
            }}
          >
            <Wrench className="mr-2 h-4 w-4" /> Supply workbench
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
            onClick={() => {
              console.log('Parámetros de suministro clicked for node:', contextMenu.id);
              setContextMenu(null);
            }}
          >
            <Settings className="mr-2 h-4 w-4" /> Parámetros de suministro
          </button>
        </div>
      )}
    </div>
  );
};