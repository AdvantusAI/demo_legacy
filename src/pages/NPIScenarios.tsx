import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Plus,
  ArrowLeft,
  BarChart3,
  Edit,
  Trash2,
  Copy,
  GitCompare,
  Filter,
  Search
} from "lucide-react";
import { useNPIScenarios } from "@/hooks/useNPIScenarios";
import { useNPIProducts } from "@/hooks/useNPIProducts";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const scenarioTypeColors = {
  optimistic: "bg-green-100 text-green-700 border-green-200",
  realistic: "bg-blue-100 text-blue-700 border-blue-200",
  pessimistic: "bg-red-100 text-red-700 border-red-200"
};

const scenarioTypeIcons = {
  optimistic: TrendingUp,
  realistic: Target,
  pessimistic: TrendingDown
};

type ScenarioFilter = 'all' | 'optimistic' | 'realistic' | 'pessimistic';

export default function NPIScenarios() {
  const navigate = useNavigate();
  const { scenarios, loading: isLoading } = useNPIScenarios();
  const { npiProducts } = useNPIProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<ScenarioFilter>('all');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  
  const filteredScenarios = scenarios?.filter(scenario => {
    const product = npiProducts?.find(p => p.id === scenario.npi_product_id);
    const productName = product?.product?.product_name || 'Unknown Product';
    
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scenario.scenario_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scenario.assumptions?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || scenario.scenario_type === filter;
    
    return matchesSearch && matchesFilter;
  }) || [];

  const getProductName = (productId: string) => {
    const product = npiProducts?.find(p => p.id === productId);
    return product?.product?.product_name || 'Unknown Product';
  };

  const getScenarioStats = () => {
    const stats = scenarios?.reduce((acc, scenario) => {
      acc[scenario.scenario_type] = (acc[scenario.scenario_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const totalRevenue = scenarios?.reduce((sum, scenario) => 
      sum + (scenario.forecast_value || 0), 0) || 0;
    
    const totalVolume = scenarios?.reduce((sum, scenario) => 
      sum + (scenario.forecast_value || 0), 0) || 0;

    return {
      total: scenarios?.length || 0,
      optimistic: stats.optimistic || 0,
      realistic: stats.realistic || 0,
      pessimistic: stats.pessimistic || 0,
      totalRevenue,
      totalVolume
    };
  };

  const stats = getScenarioStats();

  const toggleScenarioSelection = (scenarioId: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const groupedScenarios = filteredScenarios.reduce((acc, scenario) => {
    const productId = scenario.npi_product_id;
    if (!acc[productId]) {
      acc[productId] = [];
    }
    acc[productId].push(scenario);
    return acc;
  }, {} as Record<string, typeof filteredScenarios>);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scenarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/npi-dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">NPI Scenarios</h1>
            <p className="text-muted-foreground">Manage and compare forecast scenarios</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={selectedScenarios.length < 2}>
            <GitCompare className="h-4 w-4 mr-2" />
            Compare ({selectedScenarios.length})
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Scenario
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Total Scenarios</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Optimistic</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.optimistic}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Realistic</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.realistic}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">Pessimistic</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.pessimistic}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold">${(stats.totalRevenue / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scenarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'optimistic' ? 'default' : 'outline'}
            onClick={() => setFilter('optimistic')}
            size="sm"
          >
            Optimistic
          </Button>
          <Button
            variant={filter === 'realistic' ? 'default' : 'outline'}
            onClick={() => setFilter('realistic')}
            size="sm"
          >
            Realistic
          </Button>
          <Button
            variant={filter === 'pessimistic' ? 'default' : 'outline'}
            onClick={() => setFilter('pessimistic')}
            size="sm"
          >
            Pessimistic
          </Button>
        </div>
      </div>

      {/* Scenarios Content */}
      <Tabs defaultValue="grouped" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grouped">Grouped by Product</TabsTrigger>
          <TabsTrigger value="list">All Scenarios</TabsTrigger>
          <TabsTrigger value="comparison">Comparison View</TabsTrigger>
        </TabsList>

        <TabsContent value="grouped" className="space-y-4">
          {Object.entries(groupedScenarios).map(([productId, productScenarios]) => (
            <Card key={productId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{getProductName(productId)}</span>
                  <Badge variant="outline">{productScenarios.length} scenarios</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productScenarios.map((scenario) => {
                    const ScenarioIcon = scenarioTypeIcons[scenario.scenario_type as keyof typeof scenarioTypeIcons];
                    const isSelected = selectedScenarios.includes(scenario.id);
                    
                    return (
                      <div
                        key={scenario.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleScenarioSelection(scenario.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge className={scenarioTypeColors[scenario.scenario_type as keyof typeof scenarioTypeColors]}>
                            <ScenarioIcon className="h-3 w-3 mr-1" />
                            {scenario.scenario_type}
                          </Badge>
                          <Badge variant="outline">{scenario.confidence_level}%</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Revenue</span>
                            <span className="font-medium">${(scenario.forecast_value || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Volume</span>
                            <span className="font-medium">{(scenario.forecast_value || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-medium">{scenario.confidence_level}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Date</span>
                            <span className="font-medium">
                              {scenario.postdate ? format(new Date(scenario.postdate), 'MMM yyyy') : 'TBD'}
                            </span>
                          </div>
                        </div>
                        
                        {scenario.assumptions && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                              {scenario.assumptions.length > 100 
                                ? `${scenario.assumptions.substring(0, 100)}...` 
                                : scenario.assumptions}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2 mt-3">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {Object.keys(groupedScenarios).length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scenarios found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Create your first scenario to get started'}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Scenario
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Scenarios ({filteredScenarios.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredScenarios.map((scenario) => {
                  const ScenarioIcon = scenarioTypeIcons[scenario.scenario_type as keyof typeof scenarioTypeIcons];
                  const isSelected = selectedScenarios.includes(scenario.id);
                  
                  return (
                    <div
                      key={scenario.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleScenarioSelection(scenario.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ScenarioIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{getProductName(scenario.npi_product_id)}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{scenario.scenario_type} scenario</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <p className="font-medium">${(scenario.forecast_value || 0).toLocaleString()}</p>
                            <p className="text-muted-foreground">Revenue</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{(scenario.forecast_value || 0).toLocaleString()}</p>
                            <p className="text-muted-foreground">Volume</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{scenario.confidence_level}%</p>
                            <p className="text-muted-foreground">Confidence</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedScenarios.length < 2 ? (
                <div className="text-center py-8">
                  <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select scenarios to compare</h3>
                  <p className="text-muted-foreground">
                    Choose 2 or more scenarios from other tabs to see a detailed comparison
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedScenarios.map(scenarioId => {
                      const scenario = scenarios?.find(s => s.id === scenarioId);
                      if (!scenario) return null;
                      
                      const ScenarioIcon = scenarioTypeIcons[scenario.scenario_type as keyof typeof scenarioTypeIcons];
                      
                      return (
                        <Card key={scenarioId} className="border-2">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge className={scenarioTypeColors[scenario.scenario_type as keyof typeof scenarioTypeColors]}>
                                <ScenarioIcon className="h-3 w-3 mr-1" />
                                {scenario.scenario_type}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleScenarioSelection(scenarioId)}
                              >
                                ×
                              </Button>
                            </div>
                            <h4 className="font-medium">{getProductName(scenario.npi_product_id)}</h4>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Revenue</span>
                              <span className="font-medium">${(scenario.forecast_value || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Volume</span>
                              <span className="font-medium">{(scenario.forecast_value || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Confidence</span>
                              <span className="font-medium">{scenario.confidence_level}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Date</span>
                              <span className="font-medium">
                                {scenario.postdate ? format(new Date(scenario.postdate), 'MMM yyyy') : 'TBD'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}