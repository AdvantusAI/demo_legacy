
import React, { useState, useEffect } from 'react';
import { Search, Users, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CustomerNode {
  id: string;
  name: string;
  customer_id: string;
  level_1?: string;
  level_1_name?: string;
  children?: CustomerNode[];
  isExpanded?: boolean;
}

interface CustomerFilterProps {
  onCustomerSelect?: (customerId: string) => void;
  selectedCustomerId?: string;
}

export function CustomerFilter({
  onCustomerSelect,
  selectedCustomerId
}: CustomerFilterProps) {
  const [customers, setCustomers] = useState<CustomerNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [clientLevels, setClientLevels] = useState<number>(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, clientLevels]);

  const fetchSystemConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('client_levels')
        .single();
      
      if (error) throw error;
      
      setClientLevels(data?.client_levels || 1);
      //console.log('Client levels:', data?.client_levels);
    } catch (error) {
      console.error('Error fetching system config:', error);
      setClientLevels(1);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      ////console.log('Fetching customers with client levels:', clientLevels);
      let query = supabase.from('customers').select('*');

      if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,customer_id.ilike.%${searchTerm}%,level_1_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('customer_name');
      if (error) throw error;

      ////console.log('Customers data:', data);
      
      if (clientLevels === 1) {
        // Flat structure: just customer_id - customer_name
        const customerNodes: CustomerNode[] = (data || []).map(customer => ({
          id: customer.customer_id || customer.id,
          name: customer.customer_name ? `${customer.customer_id} - ${customer.customer_name}` : customer.customer_id || 'Sin nombre',
          customer_id: customer.customer_id || customer.id
        }));
        setCustomers(customerNodes);
      } else {
        // Hierarchical structure: level_1 - level_1_name > customer_id - customer_name
        const hierarchicalCustomers = buildHierarchy(data || []);
        setCustomers(hierarchicalCustomers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (data: any[]): CustomerNode[] => {
    const hierarchyMap = new Map<string, CustomerNode>();

    data.forEach(customer => {
      const level1Key = customer.level_1 || 'Sin categoría';
      const level1Name = customer.level_1_name || 'Sin nombre';
      const level1Id = `level1-${level1Key}`;

      // Create or get level 1 node
      if (!hierarchyMap.has(level1Id)) {
        hierarchyMap.set(level1Id, {
          id: level1Id,
          name: `${level1Key} - ${level1Name}`,
          customer_id: level1Key,
          level_1: level1Key,
          level_1_name: level1Name,
          children: [],
          isExpanded: false
        });
      }

      // Add customer to level 1
      const level1Node = hierarchyMap.get(level1Id)!;
      const customerNode: CustomerNode = {
        id: customer.customer_id || customer.id,
        name: customer.customer_name ? `${customer.customer_id} - ${customer.customer_name}` : customer.customer_id || 'Sin nombre',
        customer_id: customer.customer_id || customer.id
      };

      level1Node.children!.push(customerNode);
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

  const handleCustomerClick = (customerId: string, hasChildren: boolean = false) => {
    if (hasChildren) {
      handleNodeToggle(customerId);
    } else {
      onCustomerSelect?.(customerId);
    }
  };

  const renderCustomer = (customer: CustomerNode, level: number = 0) => {
    const hasChildren = customer.children && customer.children.length > 0;
    const isExpanded = expandedNodes.has(customer.id);
    const isSelected = selectedCustomerId === customer.id;
    const isCustomerLevel = !hasChildren;

    return (
      <div key={customer.id} className="w-full">
        <div
          className={cn(
            "flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded",
            level > 0 && "ml-4",
            isSelected && isCustomerLevel && "bg-orange-100 text-orange-800",
            hasChildren && "font-medium text-gray-700"
          )}
          onClick={() => handleCustomerClick(customer.id, hasChildren)}
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
            isSelected && isCustomerLevel && "font-semibold",
            !hasChildren && "font-normal"
          )}>
            {customer.name}
          </span>
        </div>

        {hasChildren && isExpanded && customer.children && (
          <div className="ml-2">
            {customer.children.map(child => renderCustomer(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 p-4 pt-4 my-0 mx-0 px-[14px] rounded-lg h-[500px] flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h3 className="font-semibold text-lg mb-2 flex items-center">
          <Users className="w-4 h-4 mr-2 text-gray-400" />
          Clientes
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Cargando clientes...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No se encontraron clientes</div>
        ) : (
          <div className="space-y-1 pr-4">
            {customers.map(customer => renderCustomer(customer))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
