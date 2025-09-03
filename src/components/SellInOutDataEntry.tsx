import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSellInOutData } from '@/hooks/useSellInOutData';
import { useChannelPartners } from '@/hooks/useChannelPartners';
import { useProducts } from '@/hooks/useProducts';

interface SellInOutDataEntryProps {
  selectedProductId?: string;
  selectedLocationId?: string;
  selectedCustomerId?: string;
  selectedAggregation?: {
    type: 'category' | 'subcategory' | 'product';
    id: string;
    name: string;
    productCount?: number;
  } | null;
}

export function SellInOutDataEntry({ 
  selectedProductId = '', 
  selectedLocationId = '', 
  selectedCustomerId = '',
  selectedAggregation = null 
}: SellInOutDataEntryProps) {
  const [activeTab, setActiveTab] = useState('sell-in');
  const [sellInForm, setSellInForm] = useState({
    product_id: selectedProductId,
    location_id: selectedLocationId,
    channel_partner_id: selectedCustomerId,
    transaction_date: '',
    quantity: '',
    unit_price: '',
    invoice_number: '',
    payment_terms: '',
    discount_percentage: '',
  });
  
  const [sellOutForm, setSellOutForm] = useState({
    product_id: selectedProductId,
    location_id: selectedLocationId,
    channel_partner_id: selectedCustomerId,
    transaction_date: '',
    quantity: '',
    unit_price: '',
    end_customer_id: '',
    inventory_on_hand: '',
  });

  const [sellInDate, setSellInDate] = useState<Date>();
  const [sellOutDate, setSellOutDate] = useState<Date>();

  const { loading, createSellInRecord, createSellOutRecord } = useSellInOutData();
  const { partners } = useChannelPartners();
  const { products } = useProducts();

  // Update forms when filter props change
  useEffect(() => {
    setSellInForm(prev => ({
      ...prev,
      product_id: selectedProductId || '',
      location_id: selectedLocationId || '',
      channel_partner_id: selectedCustomerId || ''
    }));
    setSellOutForm(prev => ({
      ...prev,
      product_id: selectedProductId || '',
      location_id: selectedLocationId || '',
      channel_partner_id: selectedCustomerId || ''
    }));
  }, [selectedProductId, selectedLocationId, selectedCustomerId]);

  const handleSellInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...sellInForm,
      transaction_date: sellInDate ? format(sellInDate, 'yyyy-MM-dd') : '',
      quantity: parseFloat(sellInForm.quantity),
      unit_price: parseFloat(sellInForm.unit_price),
      total_value: parseFloat(sellInForm.quantity) * parseFloat(sellInForm.unit_price),
      discount_percentage: sellInForm.discount_percentage ? parseFloat(sellInForm.discount_percentage) : undefined,
    };

    const success = await createSellInRecord(data);
    if (success) {
      setSellInForm({
        product_id: '',
        location_id: '',
        channel_partner_id: '',
        transaction_date: '',
        quantity: '',
        unit_price: '',
        invoice_number: '',
        payment_terms: '',
        discount_percentage: '',
      });
      setSellInDate(undefined);
    }
  };

  const handleSellOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...sellOutForm,
      transaction_date: sellOutDate ? format(sellOutDate, 'yyyy-MM-dd') : '',
      quantity: parseFloat(sellOutForm.quantity),
      unit_price: parseFloat(sellOutForm.unit_price),
      total_value: parseFloat(sellOutForm.quantity) * parseFloat(sellOutForm.unit_price),
      inventory_on_hand: sellOutForm.inventory_on_hand ? parseFloat(sellOutForm.inventory_on_hand) : undefined,
    };

    const success = await createSellOutRecord(data);
    if (success) {
      setSellOutForm({
        product_id: '',
        location_id: '',
        channel_partner_id: '',
        transaction_date: '',
        quantity: '',
        unit_price: '',
        end_customer_id: '',
        inventory_on_hand: '',
      });
      setSellOutDate(undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entrada de Datos de Ventas Entrada/Salida</h1>
          <p className="text-muted-foreground">
            Registrar transacciones de socios comerciales para análisis de ventas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar Datos
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Plantilla
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sell-in">Datos de Entrada</TabsTrigger>
          <TabsTrigger value="sell-out">Datos de Salida</TabsTrigger>
        </TabsList>

        <TabsContent value="sell-in" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Transacción de Entrada</CardTitle>
              <CardDescription>
                Rastrear ventas de su empresa a socios comerciales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSellInSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sell-in-product">Producto *</Label>
                    <Select
                      value={sellInForm.product_id}
                      onValueChange={(value) => setSellInForm(prev => ({ ...prev, product_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.code} - {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-in-partner">Socio Comercial *</Label>
                    <Select
                      value={sellInForm.channel_partner_id}
                      onValueChange={(value) => setSellInForm(prev => ({ ...prev, channel_partner_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar socio" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map(partner => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Transacción *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !sellInDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {sellInDate ? format(sellInDate, "PPP") : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={sellInDate}
                          onSelect={setSellInDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-in-location">ID de Ubicación</Label>
                    <Input
                      id="sell-in-location"
                      value={sellInForm.location_id}
                      onChange={(e) => setSellInForm(prev => ({ ...prev, location_id: e.target.value }))}
                      placeholder="Identificador de ubicación/almacén"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-in-quantity">Cantidad *</Label>
                    <Input
                      id="sell-in-quantity"
                      type="number"
                      step="0.01"
                      value={sellInForm.quantity}
                      onChange={(e) => setSellInForm(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Unidades vendidas"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-in-price">Precio Unitario *</Label>
                    <Input
                      id="sell-in-price"
                      type="number"
                      step="0.01"
                      value={sellInForm.unit_price}
                      onChange={(e) => setSellInForm(prev => ({ ...prev, unit_price: e.target.value }))}
                      placeholder="Precio por unidad"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-in-invoice">Número de Factura</Label>
                    <Input
                      id="sell-in-invoice"
                      value={sellInForm.invoice_number}
                      onChange={(e) => setSellInForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                      placeholder="Referencia de factura"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-in-discount">Descuento %</Label>
                    <Input
                      id="sell-in-discount"
                      type="number"
                      step="0.01"
                      value={sellInForm.discount_percentage}
                      onChange={(e) => setSellInForm(prev => ({ ...prev, discount_percentage: e.target.value }))}
                      placeholder="Porcentaje de descuento"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sell-in-terms">Términos de Pago</Label>
                  <Textarea
                    id="sell-in-terms"
                    value={sellInForm.payment_terms}
                    onChange={(e) => setSellInForm(prev => ({ ...prev, payment_terms: e.target.value }))}
                                          placeholder="Términos y condiciones de pago"
                    rows={3}
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={loading} className="w-full md:w-auto">
                    {loading ? 'Registrando...' : 'Registrar Transacción de Entrada'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sell-out" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Transacción de Salida</CardTitle>
              <CardDescription>
                Rastrear ventas de socios comerciales a clientes finales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSellOutSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sell-out-product">Product *</Label>
                    <Select
                      value={sellOutForm.product_id}
                      onValueChange={(value) => setSellOutForm(prev => ({ ...prev, product_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.code} - {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-out-partner">Channel Partner *</Label>
                    <Select
                      value={sellOutForm.channel_partner_id}
                      onValueChange={(value) => setSellOutForm(prev => ({ ...prev, channel_partner_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map(partner => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Transaction Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !sellOutDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {sellOutDate ? format(sellOutDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={sellOutDate}
                          onSelect={setSellOutDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-out-location">Location ID</Label>
                    <Input
                      id="sell-out-location"
                      value={sellOutForm.location_id}
                      onChange={(e) => setSellOutForm(prev => ({ ...prev, location_id: e.target.value }))}
                      placeholder="Location/warehouse identifier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-out-quantity">Quantity *</Label>
                    <Input
                      id="sell-out-quantity"
                      type="number"
                      step="0.01"
                      value={sellOutForm.quantity}
                      onChange={(e) => setSellOutForm(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Units sold"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-out-price">Unit Price *</Label>
                    <Input
                      id="sell-out-price"
                      type="number"
                      step="0.01"
                      value={sellOutForm.unit_price}
                      onChange={(e) => setSellOutForm(prev => ({ ...prev, unit_price: e.target.value }))}
                      placeholder="Price per unit"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-out-customer">End Customer ID</Label>
                    <Input
                      id="sell-out-customer"
                      value={sellOutForm.end_customer_id}
                      onChange={(e) => setSellOutForm(prev => ({ ...prev, end_customer_id: e.target.value }))}
                      placeholder="Final customer identifier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-out-inventory">Inventory on Hand</Label>
                    <Input
                      id="sell-out-inventory"
                      type="number"
                      step="0.01"
                      value={sellOutForm.inventory_on_hand}
                      onChange={(e) => setSellOutForm(prev => ({ ...prev, inventory_on_hand: e.target.value }))}
                      placeholder="Remaining inventory units"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={loading} className="w-full md:w-auto">
                    {loading ? 'Recording...' : 'Record Sell-Out Transaction'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}