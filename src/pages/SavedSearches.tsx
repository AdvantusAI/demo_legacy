
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Edit, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

interface QuickSearch {
  id: number;
  search_name: string;
  search_criteria: any;
  created_at: string;
  updated_at: string;
}

export default function SavedSearches() {
  const [searches, setSearches] = useState<QuickSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<QuickSearch | null>(null);
  const [formData, setFormData] = useState({
    search_name: "",
    search_criteria: ""
  });

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    try {
      setLoading(true);
      // Mock data since quick_searches table doesn't exist
      const mockSearches: QuickSearch[] = [
        {
          id: 1,
          search_name: "Productos con stock bajo",
          search_criteria: { stock_level: "low" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          search_name: "Productos de alta rotación",
          search_criteria: { turnover: "high" },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setSearches(mockSearches);
    } catch (error) {
      console.error('Error fetching searches:', error);
      toast.error('Error al cargar búsquedas guardadas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Mock implementation since table doesn't exist
      const newSearch: QuickSearch = {
        id: Date.now(),
        search_name: formData.search_name,
        search_criteria: JSON.parse(formData.search_criteria || '{}'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingSearch) {
        setSearches(prev => prev.map(s => s.id === editingSearch.id ? newSearch : s));
        toast.success('Búsqueda actualizada exitosamente');
      } else {
        setSearches(prev => [...prev, newSearch]);
        toast.success('Búsqueda guardada exitosamente');
      }

      setIsDialogOpen(false);
      setEditingSearch(null);
      resetForm();
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Error al guardar búsqueda');
    }
  };

  const handleEdit = (search: QuickSearch) => {
    setEditingSearch(search);
    setFormData({
      search_name: search.search_name,
      search_criteria: JSON.stringify(search.search_criteria, null, 2)
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (searchId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta búsqueda?')) return;

    try {
      setSearches(prev => prev.filter(s => s.id !== searchId));
      toast.success('Búsqueda eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Error al eliminar búsqueda');
    }
  };

  const resetForm = () => {
    setFormData({
      search_name: "",
      search_criteria: ""
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Search className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando búsquedas guardadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Búsquedas Guardadas</h1>
          <p className="text-muted-foreground">Gestiona tus búsquedas frecuentes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingSearch(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Búsqueda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSearch ? 'Editar Búsqueda' : 'Nueva Búsqueda'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="search_name">Nombre de la Búsqueda</Label>
                <Input
                  id="search_name"
                  value={formData.search_name}
                  onChange={(e) => setFormData({...formData, search_name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="search_criteria">Criterios de Búsqueda (JSON)</Label>
                <textarea
                  id="search_criteria"
                  className="w-full h-32 p-2 border border-gray-300 rounded-md"
                  value={formData.search_criteria}
                  onChange={(e) => setFormData({...formData, search_criteria: e.target.value})}
                  placeholder='{"category": "electronics", "stock_level": "low"}'
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSearch ? 'Actualizar' : 'Guardar'} Búsqueda
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Searches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Búsquedas Guardadas ({searches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Criterios</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searches.map((search) => (
                  <TableRow key={search.id}>
                    <TableCell className="font-medium">{search.search_name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 p-1 rounded">
                        {JSON.stringify(search.search_criteria)}
                      </code>
                    </TableCell>
                    <TableCell>{formatDate(search.created_at)}</TableCell>
                    <TableCell>{formatDate(search.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.info('Ejecutando búsqueda...')}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(search)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(search.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
