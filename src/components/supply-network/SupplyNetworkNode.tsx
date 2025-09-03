import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Package, Truck, Factory, Store, Warehouse } from 'lucide-react';
export interface SupplyNetworkNodeData {
  label: string;
  nodeType: string;
  nodeTypeCode?: string;
  iconName?: string;
  properties?: Record<string, any>;
  status: string;
  color: string;
}
export const SupplyNetworkNode = memo(({
  data
}: NodeProps) => {
  const nodeData = data as unknown as SupplyNetworkNodeData;
  const getNodeIcon = (iconName?: string) => {
    const iconProps = { size: 24, className: "text-gray-700" };
    
    switch (iconName?.toLowerCase()) {
      case 'truck':
        return <Truck {...iconProps} />;
      case 'factory':
        return <Factory {...iconProps} />;
      case 'store':
        return <Store {...iconProps} />;
      case 'warehouse':
        return <Warehouse {...iconProps} />;
      case 'package':
      default:
        return <Package {...iconProps} />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'inactive':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'planning':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  return (
    <div className="relative">
      <Handle 
        type="target" 
        position={Position.Top} 
      />
      
      <div className="w-24 h-24 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col items-center justify-center cursor-pointer border border-gray-300">
        <div className="flex flex-col items-center justify-center h-full text-gray-600">
          {getNodeIcon(nodeData.iconName)}
          <span className="text-xs font-medium mt-1 text-center leading-tight">
            {nodeData.label}
          </span>
        </div>
        
        {nodeData.status === 'active' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
      />
    </div>
  );
});
SupplyNetworkNode.displayName = 'SupplyNetworkNode';