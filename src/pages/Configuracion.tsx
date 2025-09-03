
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Settings } from "lucide-react";

interface SystemConfig {
  id: number;
  product_levels: number | null;
  location_levels: number | null;
  client_levels: number | null;
}

type SystemConfigForm = Omit<SystemConfig, 'id'>;

const Configuracion = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<SystemConfigForm>({
    defaultValues: {
      product_levels: null,
      location_levels: null,
      client_levels: null,
    },
  });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      //console.log('Fetching system configuration...');
      
      const { data, error } = await supabase
        .from("system_config")
        .select("*")
        .limit(1);
      
      if (error) {
        console.error('Error fetching system config:', error);
        throw error;
      }

      //console.log('System config data:', data);
      
      if (data && data.length > 0) {
        const configData = data[0];
        setConfig(configData);
        form.reset({
          product_levels: configData.product_levels,
          location_levels: configData.location_levels,
          client_levels: configData.client_levels,
        });
      } else {
        //console.log('No system configuration found');
        setConfig(null);
      }
    } catch (error) {
      console.error("Error fetching system configuration:", error);
      toast.error("Error al cargar la configuración del sistema");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: SystemConfigForm) => {
    try {
      setSaving(true);
      //console.log('Saving system configuration:', data);

      if (config) {
        // Update existing configuration
        const { error } = await supabase
          .from("system_config")
          .update(data)
          .eq("id", config.id);
        
        if (error) throw error;
        toast.success("Configuración actualizada exitosamente");
      } else {
        // Create new configuration
        const { error } = await supabase
          .from("system_config")
          .insert([data]);
        
        if (error) throw error;
        toast.success("Configuración creada exitosamente");
      }
      
      fetchConfig();
    } catch (error) {
      console.error("Error saving system configuration:", error);
      toast.error("Error al guardar la configuración del sistema");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Configuración de Niveles</CardTitle>
          <CardDescription>
            Configure los niveles jerárquicos para productos, ubicaciones y clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="product_levels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveles de Producto</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="1"
                        max="10"
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        placeholder="Ingrese el número de niveles de producto"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location_levels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveles de Ubicación</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="1"
                        max="10"
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        placeholder="Ingrese el número de niveles de ubicación"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="client_levels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveles de Cliente</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="1"
                        max="10"
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        placeholder="Ingrese el número de niveles de cliente"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="submit" 
                  disabled={saving}
                >
                  {saving ? "Guardando..." : config ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </Form>

          {config && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Configuración Actual:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>ID:</strong> {config.id}</p>
                <p><strong>Niveles de Producto:</strong> {config.product_levels || 'No configurado'}</p>
                <p><strong>Niveles de Ubicación:</strong> {config.location_levels || 'No configurado'}</p>
                <p><strong>Niveles de Cliente:</strong> {config.client_levels || 'No configurado'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracion;
