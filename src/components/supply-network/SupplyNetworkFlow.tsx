import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  Edge,
  Node,
  NodeTypes,
  MarkerType,
  EdgeChange,
  NodeChange,
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

// ---------- helpers ----------
const nodeTypes: NodeTypes = { supplyNetworkNode: SupplyNetworkNode };

const getNodeColor = (nodeTypeCode: string) => {
  switch (nodeTypeCode?.toLowerCase()) {
    case 'factory':
    case 'manufacturer':
      return '#ef4444';
    case 'warehouse':
      return '#3b82f6';
    case 'distributor':
    case 'distribution_center':
      return '#10b981';
    case 'retailer':
    case 'retail':
      return '#8b5cf6';
    case 'supplier':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

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

// shallow guard: update only if ids/length changed (prevents loops from new array identities)
const sameNodeSet = (a: Node[], b: Node[]) =>
  a.length === b.length && a.every((n, i) => n.id === b[i]?.id);

const sameEdgeSet = (a: Edge[], b: Edge[]) =>
  a.length === b.length && a.every((e, i) => e.id === b[i]?.id);

// stable signatures of upstream data (so effects don’t run each render due to new refs)
const nodesSignature = (dbNodes: any[] | undefined, dbNodeTypes: any[]) =>
  JSON.stringify(
    (dbNodes ?? [])
      .map(n => [n.id, n.node_name, n.node_type_id, n.status])
      .sort((x, y) => String(x[0]).localeCompare(String(y[0])))
      .concat(
        dbNodeTypes
          .map(t => ['t', t.id, t.type_code])
          .sort((x, y) => String(x[1]).localeCompare(String(y[1])))
      )
  );

const relsSignature = (rels: any[] | undefined) =>
  JSON.stringify(
    (rels ?? [])
      .map(r => [r.id, r.source_node_id, r.target_node_id, r.status, r.lead_time_days, r.primary_transport_cost])
      .sort((x, y) => String(x[0]).localeCompare(String(y[0])))
  );

// ---------- component ----------
export const SupplyNetworkFlow: React.FC = () => {
  const {
    nodes: dbNodes,
    relationships: dbRelationships,
    isLoading,
    createRelationship,
    deleteRelationship, // not used here, but kept from your hook
  } = useSupplyNetwork();

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null);
  const [dbNodeTypes, setDbNodeTypes] = useState<Array<{ id: string; type_code: string; type_name: string; icon_name: string }>>([]);

  // Fetch node types once
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_supply_network_node_types');
        if (error) throw error;
        if (!ignore) setDbNodeTypes(data || []);
      } catch (err) {
        console.error('Error fetching node types:', err);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Build flow nodes from DB + saved positions (pure, memoized)
  const builtFlowNodes: Node[] = useMemo(() => {
    if (!dbNodes) return [];
    const saved = loadNodePositions();
    return dbNodes.map((node: any, index: number) => {
      const typeInfo = dbNodeTypes.find(nt => nt.id === node.node_type_id);
      const savedPos = saved[node.id];
      return {
        id: node.id,
        type: 'supplyNetworkNode',
        position: savedPos || { x: (index % 4) * 250 + 100, y: Math.floor(index / 4) * 200 + 100 },
        data: {
          label: node.node_name || node.id,
          nodeType: node.node_type_id || 'unknown',
          nodeTypeCode: typeInfo?.type_code || 'unknown',
          iconName: typeInfo?.icon_name || 'Package',
          properties: node.contact_information || {},
          status: node.status,
          color: getNodeColor(typeInfo?.type_code || 'unknown'),
        },
      } as Node;
    });
  }, [dbNodes, dbNodeTypes]);

  // Build flow edges from DB (pure, memoized)
  const builtFlowEdges: Edge[] = useMemo(() => {
    if (!dbRelationships) return [];
    return dbRelationships.map((rel: any) => {
      const leadTime = rel.lead_time_days ? `${rel.lead_time_days}d` : '';
      const cost = rel.primary_transport_cost ? `$${rel.primary_transport_cost}` : '';
      const labelParts = [leadTime, cost].filter(Boolean);
      const label = labelParts.length ? labelParts.join(' | ') : 'Connection';

      return {
        id: rel.id,
        source: rel.source_node_id,
        target: rel.target_node_id,
        type: 'smoothstep',
        animated: rel.status === 'active',
        label,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: {
          stroke: rel.status === 'active' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
        },
        data: {
          relationshipId: rel.id,
          relationshipType: rel.relationship_type_id || 'unknown',
          properties: {
            description: rel.description || '',
            cost: rel.cost || 0,
            leadTime: rel.lead_time_days || 0,
          },
          status: rel.status,
        },
      } as Edge;
    });
  }, [dbRelationships]);

  // Local state
  const [nodes, setNodes] = useState<Node[]>(builtFlowNodes);
  const [edges, setEdges] = useState<Edge[]>(builtFlowEdges);

  // Stable signatures of upstream data
  const nodesSig = useMemo(() => nodesSignature(dbNodes, dbNodeTypes), [dbNodes, dbNodeTypes]);
  const edgesSig = useMemo(() => relsSignature(dbRelationships), [dbRelationships]);

  // Sync local nodes only when DB content meaningfully changes
  useEffect(() => {
    setNodes(prev => (sameNodeSet(prev, builtFlowNodes) ? prev : builtFlowNodes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesSig]); // intentionally not depending on builtFlowNodes identity

  // Sync local edges only when DB content meaningfully changes
  useEffect(() => {
    setEdges(prev => (sameEdgeSet(prev, builtFlowEdges) ? prev : builtFlowEdges));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgesSig]); // intentionally not depending on builtFlowEdges identity

  // Handlers
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(current => {
      const updated = applyNodeChanges(changes, current);
      // debounce-ish save; harmless for render loop (no state change)
      setTimeout(() => saveNodePositions(updated), 100);
      return updated;
    });
  }, []);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(current => applyEdgeChanges(changes, current));
  }, []);

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

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    const id = edge.data?.relationshipId;
    if (typeof id === 'string') setEditingRelationshipId(id);
  }, []);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setEditingNodeId(node.id);
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
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
        style={{ backgroundColor: 'hsl(var(--background))' }}
        className="bg-background"
      >
        <Controls />
        <MiniMap
          style={{ backgroundColor: 'hsl(var(--muted))' }}
          nodeColor={(node) => (node.style?.background as string) || 'hsl(var(--primary))'}
        />
        <Background color="hsl(var(--muted-foreground))" gap={20} style={{ backgroundColor: 'hsl(var(--background))' }} />
      </ReactFlow>

      {editingNodeId && (
        <EditNodeModal isOpen onClose={() => setEditingNodeId(null)} nodeId={editingNodeId} />
      )}

      {editingRelationshipId && (
        <RelationshipEditorModal isOpen onClose={() => setEditingRelationshipId(null)} relationshipId={editingRelationshipId} />
      )}
    </div>
  );
};
