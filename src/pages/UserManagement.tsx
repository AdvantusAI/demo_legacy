import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-enterprise';
import { useAuth } from '@/contexts/AuthContext';

import 'ag-grid-enterprise';
import '../styles/ag-grid-custom.css';
import { configureAGGridLicense, defaultGridOptions } from '@/lib/ag-grid-config';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_id: number | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface UserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface EditUserForm {
  full_name: string;
  active: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [createForm, setCreateForm] = useState<UserForm>({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });

  const [editForm, setEditForm] = useState<EditUserForm>({
    full_name: "",
    active: true
  });

  const { signUp } = useAuth();

  useEffect(() => {
    configureAGGridLicense();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .schema('m8_schema')
        .from('user_profiles')
        .select('*')
        .order('email');

      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);

    try {
      const { error } = await signUp(
        createForm.email, 
        createForm.password, 
        createForm.firstName, 
        createForm.lastName
      );
      
      if (error) {
        setError(error.message);
        toast.error('Error al crear usuario: ' + error.message);
      } else {
        toast.success('¡Usuario creado exitosamente!');
        setIsCreateDialogOpen(false);
        resetCreateForm();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || "",
      active: user.active ?? true
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .schema('m8_schema')
        .from('user_profiles')
        .update({
          full_name: editForm.full_name,
          active: editForm.active
        })
        .eq('id', editingUser.id);
      
      if (error) throw error;
      
      toast.success('Usuario actualizado exitosamente');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return;

    try {
      // Note: This will delete from user_profiles, but the auth user will remain
      // For complete deletion, you'd need to use supabase.auth.admin.deleteUser()
      const { error } = await supabase
        .schema('m8_schema')
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      email: "",
      password: "",
      firstName: "",
      lastName: ""
    });
    setError(null);
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const ActionCellRenderer = (props: any) => {
    const user = props.data;
    
    return (
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEdit(user)}
          title="Editar usuario"
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDeleteUser(user.id)}
          title="Eliminar usuario"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const StatusCellRenderer = (props: any) => {
    const isActive = props.value;
    
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {isActive ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: "Email",
      field: "email",
      sortable: true,
      filter: true,
      flex: 1,
      resizable: true
    },
    {
      headerName: "Nombre Completo",
      field: "full_name",
      sortable: true,
      filter: true,
      flex: 1,
      resizable: true,
      valueFormatter: (params) => params.value || '-'
    },
    {
      headerName: "Estado",
      field: "active",
      cellRenderer: StatusCellRenderer,
      sortable: true,
      filter: true,
      width: 120,
      resizable: true
    },
    {
      headerName: "Fecha Creación",
      field: "created_at",
      sortable: true,
      filter: true,
      width: 150,
      resizable: true,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('es-ES');
      }
    },
    {
      headerName: "Última Actualización",
      field: "updated_at",
      sortable: true,
      filter: true,
      width: 170,
      resizable: true,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('es-ES');
      }
    },
    {
      headerName: "Acciones",
      field: "actions",
      cellRenderer: ActionCellRenderer,
      width: 120,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'right'
    }
  ], []);

  // Filter data based on search term
  const filteredUsersForGrid = useMemo(() => {
    if (!searchTerm) return users;
    
    return users.filter(user =>
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetCreateForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})}
                    placeholder="Apellido"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  required
                  placeholder="usuario@email.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createLoading || !createForm.email || !createForm.password}>
                  {createLoading ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Existentes ({filteredUsersForGrid.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="ag-theme-quartz ag-theme-custom" style={{ height: '600px', width: '100%' }}>
            <AgGridReact
              rowData={filteredUsersForGrid}
              columnDefs={columnDefs}
              onGridReady={onGridReady}
              {...defaultGridOptions}
              rowHeight={50}
              getRowId={(params) => params.data.id}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                placeholder="Nombre completo"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={editForm.active}
                onChange={(e) => setEditForm({...editForm, active: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="active">Usuario activo</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Actualizar Usuario
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}