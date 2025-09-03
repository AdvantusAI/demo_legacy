import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw, Plus, X, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useForecastReconciliation } from '@/hooks/useForecastReconciliation';
import { useChannelPartners } from '@/hooks/useChannelPartners';
import { useProducts } from '@/hooks/useProducts';

export function ForecastReconciliationDashboard() {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [minVariance, setMinVariance] = useState<string>('');
  const [newActionItem, setNewActionItem] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');

  const {
    loading,
    reconciliationData,
    gapAnalysis,
    fetchReconciliationData,
    updateReconciliationRecord,
    addActionItem,
    removeActionItem,
    calculateGapAnalysis,
    refreshVarianceCalculations,
  } = useForecastReconciliation();

  const { partners } = useChannelPartners();
  const { products } = useProducts();

  useEffect(() => {
    const filters: any = {};
    if (selectedProduct && selectedProduct !== 'all') filters.product_id = selectedProduct;
    if (selectedPartner && selectedPartner !== 'all') filters.channel_partner_id = selectedPartner;
    if (selectedStatus && selectedStatus !== 'all') filters.reconciliation_status = selectedStatus;
    if (periodStart) filters.period_start = periodStart;
    if (periodEnd) filters.period_end = periodEnd;
    if (minVariance) filters.min_variance = parseFloat(minVariance);

    fetchReconciliationData(filters);
  }, [selectedProduct, selectedPartner, selectedStatus, periodStart, periodEnd, minVariance, fetchReconciliationData]);

  useEffect(() => {
    calculateGapAnalysis();
  }, [reconciliationData, calculateGapAnalysis]);

  // Calculate summary metrics
  const totalRecords = reconciliationData.length;
  const criticalVariances = reconciliationData.filter(r => 
    Math.abs(r.sell_in_variance || 0) > 1000 || Math.abs(r.sell_out_variance || 0) > 1000
  ).length;
  
  const avgSellInAccuracy = reconciliationData.length > 0
    ? reconciliationData.reduce((sum, r) => sum + (r.sell_in_accuracy_percentage || 0), 0) / reconciliationData.length
    : 0;

  const avgSellOutAccuracy = reconciliationData.length > 0
    ? reconciliationData.reduce((sum, r) => sum + (r.sell_out_accuracy_percentage || 0), 0) / reconciliationData.length
    : 0;

  const statusDistribution = reconciliationData.reduce((acc, record) => {
    acc[record.reconciliation_status] = (acc[record.reconciliation_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare chart data
  const chartData = reconciliationData
    .sort((a, b) => new Date(a.forecast_period).getTime() - new Date(b.forecast_period).getTime())
    .map(record => ({
      period: format(new Date(record.forecast_period), 'MMM yyyy'),
      sellInAccuracy: record.sell_in_accuracy_percentage || 0,
      sellOutAccuracy: record.sell_out_accuracy_percentage || 0,
      sellInVariance: Math.abs(record.sell_in_variance || 0),
      sellOutVariance: Math.abs(record.sell_out_variance || 0),
      partnerName: partners.find(p => p.id === record.channel_partner_id)?.partner_name || 'Direct',
    }));

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleStatusUpdate = async (recordId: string, newStatus: string) => {
    await updateReconciliationRecord(recordId, { reconciliation_status: newStatus });
  };

  const handleAddActionItem = async () => {
    if (newActionItem && selectedRecordId) {
      await addActionItem(selectedRecordId, newActionItem);
      setNewActionItem('');
      setSelectedRecordId('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forecast Reconciliation</h1>
          <p className="text-muted-foreground">
            Analyze variance between forecasted and actual sell-in/sell-out performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshVarianceCalculations} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Calculations
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.code} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Channel Partner</Label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger>
                  <SelectValue placeholder="All Partners" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="all">All Partners</SelectItem>
                  {partners.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.partner_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Period End</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Min Variance</Label>
              <Input
                type="number"
                placeholder="e.g., 100"
                value={minVariance}
                onChange={(e) => setMinVariance(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Reconciliation periods
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sell-In Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSellInAccuracy.toFixed(1)}%</div>
            <Progress value={avgSellInAccuracy} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sell-Out Accuracy</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSellOutAccuracy.toFixed(1)}%</div>
            <Progress value={avgSellOutAccuracy} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Variances</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalVariances}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
          <TabsTrigger value="gap">Gap Analysis</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Trends</CardTitle>
                <CardDescription>Forecast accuracy over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="sellInAccuracy" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Sell-In Accuracy (%)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sellOutAccuracy" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={2}
                        name="Sell-Out Accuracy (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Reconciliation status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statusDistribution).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(status)}>
                          {status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="variance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variance Analysis</CardTitle>
              <CardDescription>Absolute variance between forecast and actual values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sellInVariance" fill="hsl(var(--primary))" name="Sell-In Variance" />
                    <Bar dataKey="sellOutVariance" fill="hsl(var(--secondary))" name="Sell-Out Variance" />
                    <ReferenceLine y={1000} stroke="red" strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Variance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reconciliationData.map((record) => {
                  const partner = partners.find(p => p.id === record.channel_partner_id);
                  const product = products.find(p => p.id === record.product_id);
                  
                  return (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {product?.name || record.product_id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {partner?.partner_name || 'Direct'} • {format(new Date(record.forecast_period), 'MMM yyyy')}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Sell-In Variance</div>
                          <div className="font-medium">{(record.sell_in_variance || 0).toFixed(0)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Sell-Out Variance</div>
                          <div className="font-medium">{(record.sell_out_variance || 0).toFixed(0)}</div>
                        </div>
                        <Select
                          value={record.reconciliation_status}
                          onValueChange={(value) => handleStatusUpdate(record.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gap" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gapAnalysis.map((analysis, index) => {
              const record = reconciliationData[index];
              if (!record) return null;
              
              return (
                <Card key={record.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {products.find(p => p.id === record.product_id)?.name || record.product_id}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(record.forecast_period), 'MMM yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Gap Percentage</span>
                        <Badge variant={getRiskBadgeVariant(analysis.risk_level)}>
                          {analysis.gap_percentage.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Primary Factors:</span>
                        {analysis.primary_factors.map((factor, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground">• {factor}</div>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Recommended Actions:</span>
                        {analysis.recommended_actions.map((action, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground">• {action}</div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Action Item</CardTitle>
              <CardDescription>Create new action items for reconciliation records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Record</Label>
                    <Select value={selectedRecordId} onValueChange={setSelectedRecordId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a record" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {reconciliationData.map(record => {
                          const product = products.find(p => p.id === record.product_id);
                          return (
                            <SelectItem key={record.id} value={record.id}>
                              {product?.name || record.product_id} - {format(new Date(record.forecast_period), 'MMM yyyy')}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Action Item</Label>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Describe the action item..."
                        value={newActionItem}
                        onChange={(e) => setNewActionItem(e.target.value)}
                        rows={1}
                      />
                      <Button onClick={handleAddActionItem} disabled={!newActionItem || !selectedRecordId}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Items by Record</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {reconciliationData.filter(record => record.action_items && record.action_items.length > 0).map((record) => {
                  const product = products.find(p => p.id === record.product_id);
                  
                  return (
                    <div key={record.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {product?.name || record.product_id} - {format(new Date(record.forecast_period), 'MMM yyyy')}
                        </h4>
                        <Badge variant={getStatusBadgeVariant(record.reconciliation_status)}>
                          {record.reconciliation_status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {(record.action_items || []).map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm">{item}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeActionItem(record.id, index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}