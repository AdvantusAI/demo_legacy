
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderFiltersProps {
  filters: {
    vendorFilter: string;
    productFilter: string;
    statusFilter: string;
    dateFrom: Date | undefined;
    dateTo: Date | undefined;
  };
  onFiltersChange: (filters: any) => void;
}

export function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="space-y-2">
        <Label htmlFor="vendor">Proveedor</Label>
        <Input
          id="vendor"
          placeholder="Buscar proveedor..."
          value={filters.vendorFilter}
          onChange={(e) => handleFilterChange('vendorFilter', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product">Producto</Label>
        <Input
          id="product"
          placeholder="Buscar producto..."
          value={filters.productFilter}
          onChange={(e) => handleFilterChange('productFilter', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Estado</Label>
        <Select value={filters.statusFilter} onValueChange={(value) => handleFilterChange('statusFilter', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="APPROVED">Aprobada</SelectItem>
            <SelectItem value="SENT">Enviada</SelectItem>
            <SelectItem value="RECEIVED">Recibida</SelectItem>
            <SelectItem value="CANCELLED">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Fecha Desde</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy") : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateFrom}
              onSelect={(date) => handleFilterChange('dateFrom', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Fecha Hasta</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy") : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateTo}
              onSelect={(date) => handleFilterChange('dateTo', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
