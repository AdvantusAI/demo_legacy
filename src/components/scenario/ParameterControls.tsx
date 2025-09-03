// File: src/components/scenario/ParameterControls.tsx
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScenarioType, ScenarioParameters } from '@/types/scenario';

interface ParameterControlsProps {
  scenarioType: ScenarioType;
  parameters: ScenarioParameters;
  onParametersChange: (parameters: ScenarioParameters) => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  scenarioType,
  parameters,
  onParametersChange
}) => {
  const updateParameter = <K extends keyof ScenarioParameters>(
    key: K,
    value: ScenarioParameters[K]
  ) => {
    onParametersChange({
      ...parameters,
      [key]: value
    });
  };

  const renderDemandParameters = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="demand-multiplier">
          Demand Multiplier: {parameters.demand_multiplier?.toFixed(1)}x
        </Label>
        <Slider
          id="demand-multiplier"
          min={0.1}
          max={5.0}
          step={0.1}
          value={[parameters.demand_multiplier || 1.0]}
          onValueChange={([value]) => updateParameter('demand_multiplier', value)}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>0.1x</span>
          <span>5.0x</span>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Seasonality Adjustment</Label>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="peak-multiplier">Peak</Label>
            <Input
              id="peak-multiplier"
              type="number"
              step="0.1"
              value={parameters.seasonality_adjustment?.peak_multiplier || 1.5}
              onChange={(e) => updateParameter('seasonality_adjustment', {
                ...parameters.seasonality_adjustment,
                peak_multiplier: parseFloat(e.target.value) || 1.5,
                normal_multiplier: parameters.seasonality_adjustment?.normal_multiplier || 1.0,
                low_multiplier: parameters.seasonality_adjustment?.low_multiplier || 0.7
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="normal-multiplier">Normal</Label>
            <Input
              id="normal-multiplier"
              type="number"
              step="0.1"
              value={parameters.seasonality_adjustment?.normal_multiplier || 1.0}
              onChange={(e) => updateParameter('seasonality_adjustment', {
                ...parameters.seasonality_adjustment,
                peak_multiplier: parameters.seasonality_adjustment?.peak_multiplier || 1.5,
                normal_multiplier: parseFloat(e.target.value) || 1.0,
                low_multiplier: parameters.seasonality_adjustment?.low_multiplier || 0.7
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="low-multiplier">Low</Label>
            <Input
              id="low-multiplier"
              type="number"
              step="0.1"
              value={parameters.seasonality_adjustment?.low_multiplier || 0.7}
              onChange={(e) => updateParameter('seasonality_adjustment', {
                ...parameters.seasonality_adjustment,
                peak_multiplier: parameters.seasonality_adjustment?.peak_multiplier || 1.5,
                normal_multiplier: parameters.seasonality_adjustment?.normal_multiplier || 1.0,
                low_multiplier: parseFloat(e.target.value) || 0.7
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSupplyParameters = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="lead-time-adjustment">
          Lead Time Adjustment: +{parameters.lead_time_adjustment || 0} days
        </Label>
        <Slider
          id="lead-time-adjustment"
          min={-30}
          max={90}
          step={1}
          value={[parameters.lead_time_adjustment || 0]}
          onValueChange={([value]) => updateParameter('lead_time_adjustment', value)}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>-30 days</span>
          <span>+90 days</span>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Vendor Availability</Label>
        <div className="space-y-2">
          {['VENDOR_A', 'VENDOR_B', 'VENDOR_C'].map((vendor) => (
            <div key={vendor} className="flex items-center justify-between">
              <Label htmlFor={`vendor-${vendor}`}>{vendor}</Label>
              <Switch
                id={`vendor-${vendor}`}
                checked={parameters.vendor_availability?.[vendor] !== false}
                onCheckedChange={(checked) => updateParameter('vendor_availability', {
                  ...parameters.vendor_availability,
                  [vendor]: checked
                })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCostParameters = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cost-change">
          Cost Change: {(parameters.cost_change_percentage || 0) >= 0 ? '+' : ''}
          {parameters.cost_change_percentage?.toFixed(1) || 0}%
        </Label>
        <Slider
          id="cost-change"
          min={-50}
          max={100}
          step={0.5}
          value={[parameters.cost_change_percentage || 0]}
          onValueChange={([value]) => updateParameter('cost_change_percentage', value)}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>-50%</span>
          <span>+100%</span>
        </div>
      </div>
    </div>
  );

  const renderServiceParameters = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="service-level">
          Service Level Target: {((parameters.service_level_target || 0.95) * 100).toFixed(1)}%
        </Label>
        <Slider
          id="service-level"
          min={0.8}
          max={0.99}
          step={0.01}
          value={[parameters.service_level_target || 0.95]}
          onValueChange={([value]) => updateParameter('service_level_target', value)}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>80%</span>
          <span>99%</span>
        </div>
      </div>
    </div>
  );

  const renderCapacityParameters = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Capacity Constraints</Label>
        <div className="space-y-2">
          {['Warehouse_A', 'Warehouse_B', 'Production_Line_1'].map((resource) => (
            <div key={resource} className="space-y-2">
              <Label htmlFor={`capacity-${resource}`}>
                {resource}: {((parameters.capacity_constraints?.[resource] || 1.0) * 100).toFixed(0)}%
              </Label>
              <Slider
                id={`capacity-${resource}`}
                min={0.1}
                max={2.0}
                step={0.1}
                value={[parameters.capacity_constraints?.[resource] || 1.0]}
                onValueChange={([value]) => updateParameter('capacity_constraints', {
                  ...parameters.capacity_constraints,
                  [resource]: value
                })}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderParameterControls = () => {
    switch (scenarioType) {
      case 'demand':
        return renderDemandParameters();
      case 'supply':
        return renderSupplyParameters();
      case 'cost':
        return renderCostParameters();
      case 'service':
        return renderServiceParameters();
      case 'capacity':
        return renderCapacityParameters();
      default:
        return <div className="text-muted-foreground">Select a scenario type to configure parameters</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        {renderParameterControls()}
      </CardContent>
    </Card>
  );
};