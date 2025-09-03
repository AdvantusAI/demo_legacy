import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { Plus, Search, Edit, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Location {
  location_id: string;
  location_name: string | null;
  type: string | null;
  level_1: string | null;
  level_2: string | null;
  level_3: string | null;
  level_4: string | null;
  working_cal: string | null;
  borrowing_pct: number | null;
  service_level_goal: number | null;
  warehouse_control_factors_active: boolean | null;
}

type LocationForm = Omit<Location, 'created_at' | 'updated_at'>;

const ITEMS_PER_PAGE = 10;

const LocationsCatalog = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const form = useForm<LocationForm>({
    defaultValues: {
      location_id: "",
      location_name: "",
      type: "",
      level_1: "",
      level_2: "",
      level_3: "",
      level_4: "",
      working_cal: "",
      borrowing_pct: null,
      service_level_goal: null,
      warehouse_control_factors_active: false,
    },
  });

  const fetchLocations = async (page: number = 1) => {
    try {
      setLoading(true);
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from("locations")
        .select("*", { count: 'exact' })
        .range(start, end);
      
      if (searchTerm) {
        query = query.or(`location_id.ilike.%${searchTerm}%,location_name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`);
      }
      
      const { data, error, count } = await query.order("location_id");
      
      if (error) throw error;
      
      setLocations(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      
      //console.log('Locations fetched:', data?.length, 'Total count:', count, 'Total pages:', Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Error al cargar las ubicaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: LocationForm) => {
    try {
      if (editingLocation) {
        const { error } = await supabase
          .from("locations")
          .update(data)
          .eq("location_id", editingLocation.location_id);
        
        if (error) throw error;
        toast.success("Ubicación actualizada exitosamente");
      } else {
        const { error } = await supabase
          .from("locations")
          .insert([data]);
        
        if (error) throw error;
        toast.success("Ubicación creada exitosamente");
      }
      
      setIsDialogOpen(false);
      setEditingLocation(null);
      form.reset();
      fetchLocations(currentPage);
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Error al guardar la ubicación");
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    form.reset(location);
    setIsDialogOpen(true);
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta ubicación?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("location_id", locationId);
      
      if (error) throw error;
      toast.success("Ubicación eliminada exitosamente");
      fetchLocations(currentPage);
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Error al eliminar la ubicación");
    }
  };

  const handleNewLocation = () => {
    setEditingLocation(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchLocations(page);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLocations(1);
  };

  useEffect(() => {
    fetchLocations(currentPage);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <PaginationItem key={page}>
          <PaginationLink
            onClick={() => handlePageChange(page)}
            isActive={page === currentPage}
            className="cursor-pointer"
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MapPin className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando ubicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Ubicaciones</h1>
          <p className="text-muted-foreground">Gestiona tus ubicaciones y almacenes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewLocation}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Ubicación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "Editar Ubicación" : "Nueva Ubicación"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID de Ubicación *</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!!editingLocation} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de Ubicación</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="level_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel 1</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="level_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel 2</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="level_3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel 3</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="level_4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel 4</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="working_cal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calendario de Trabajo</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="borrowing_pct"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porcentaje de Préstamo</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            value={field.value || ""} 
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="service_level_goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta de Nivel de Servicio</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            value={field.value || ""} 
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingLocation ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Ubicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ubicaciones por ID, nombre o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ubicaciones ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Ubicación</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nivel 1</TableHead>
                  <TableHead>Nivel 2</TableHead>
                  <TableHead>Nivel de Servicio</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No se encontraron ubicaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((location) => (
                    <TableRow key={location.location_id}>
                      <TableCell className="font-medium">{location.location_id}</TableCell>
                      <TableCell>{location.location_name || "-"}</TableCell>
                      <TableCell>{location.type || "-"}</TableCell>
                      <TableCell>{location.level_1 || "-"}</TableCell>
                      <TableCell>{location.level_2 || "-"}</TableCell>
                      <TableCell>{location.service_level_goal || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(location)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(location.location_id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {/* Show first page if not visible */}
              {currentPage > 3 && totalPages > 5 && (
                <>
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {currentPage > 4 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {/* Visible pages */}
              {renderPaginationItems()}

              {/* Show last page if not visible */}
              {currentPage < totalPages - 2 && totalPages > 5 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default LocationsCatalog;
