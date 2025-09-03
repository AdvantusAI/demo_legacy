import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Plus, Search, Edit, Trash2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-enterprise';

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

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  assigned_by: string | null;
  assigned_at: string;
  created_at: string;
}

interface UserWithRoles extends UserProfile {
  roles: string[];
  primary_role: string | null;
}

interface RoleForm {
  user_id: string;
  role: string;
}

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'administrator', label: 'Administrador Principal' },
  { value: 'demand_planner', label: 'Planificador de Demanda' },
  { value: 'supply_planner', label: 'Planificador de Suministro' },
  { value: 'user', label: 'Usuario' }
];

export default function UserRoles() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [formData, setFormData] = useState<RoleForm>({
    user_id: "",
    role: ""
  });

  useEffect(() => {
    configureAGGridLicense();
    fetchUsersWithRoles();
  }, []);

  const fetchUsersWithRoles = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .schema('m8_schema')
        .from('user_profiles')
        .select('*')
        .order('email');

      if (usersError) throw usersError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .schema('m8_schema')
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = (usersData || []).map(user => {
        const userRoles = (rolesData || []).filter(role => role.user_id === user.id);
        return {
          ...user,
          roles: userRoles.map(r => r.role),
          primary_role: userRoles.length > 0 ? userRoles[0].role : null
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      toast.error('Error al cargar usuarios y roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.role || !formData.user_id) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    
    try {
      if (editingRole) {
        const { error } = await supabase
          .schema('m8_schema')
          .from('user_roles')
          .update({ role: formData.role as any })
          .eq('id', editingRole.id);
        
        if (error) throw error;
        toast.success('Rol actualizado exitosamente');
      } else {
        const currentUser = await supabase.auth.getUser();
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: formData.user_id,
            role: formData.role as any,
            assigned_by: currentUser.data.user?.id || null
          });
        
        if (error) throw error;
        toast.success('Rol asignado exitosamente');
      }

      setIsDialogOpen(false);
      setEditingRole(null);
      resetForm();
      fetchUsersWithRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Error al guardar rol');
    }
  };

  const handleEdit = (user: UserWithRoles) => {
    if (user.primary_role) {
      setFormData({
        user_id: user.id,
        role: user.primary_role
      });
      setEditingRole({
        id: '', // We'll need to fetch the actual role ID
        user_id: user.id,
        role: user.primary_role,
        assigned_by: null,
        assigned_at: '',
        created_at: ''
      });
    } else {
      setFormData({
        user_id: user.id,
        role: ""
      });
      setEditingRole(null);
    }
    setIsDialogOpen(true);
  };

  const handleDeleteRole = async (userId: string, role: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este rol?')) return;

    try {
      const { error } = await supabase
        .schema('m8_schema')
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) throw error;
      toast.success('Rol eliminado exitosamente');
      fetchUsersWithRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Error al eliminar rol');
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      role: ""
    });
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
          title="Editar rol"
        >
          <Edit className="h-3 w-3" />
        </Button>
        {user.primary_role && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteRole(user.id, user.primary_role)}
            title="Eliminar rol"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  const RoleCellRenderer = (props: any) => {
    const roles = props.value || [];
    const roleLabels = roles.map((role: string) => {
      const roleObj = AVAILABLE_ROLES.find(r => r.value === role);
      return roleObj ? roleObj.label : role;
    });

    if (roleLabels.length === 0) {
      return <span className="text-muted-foreground">Sin rol asignado</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {roleLabels.map((label: string, index: number) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
          >
            <Shield className="h-3 w-3 mr-1" />
            {label}
          </span>
        ))}
      </div>
    );
  };

  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: "Email",
      field: "email",
      sortable: true,
      filter: true,
      flex: 1,
      resizable: true,
      valueFormatter: (params) => params.value || '-'
    },
    {
      headerName: "Nombre",
      field: "full_name",
      sortable: true,
      filter: true,
      flex: 1,
      resizable: true,
      valueFormatter: (params) => params.value || '-'
    },
    {
      headerName: "Roles",
      field: "roles",
      cellRenderer: RoleCellRenderer,
      sortable: false,
      filter: false,
      flex: 1,
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
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <UserCog className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando usuarios y roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Roles de Usuario</h1>
          <p className="text-muted-foreground">Asigna y gestiona roles para los usuarios del sistema</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingRole(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Asignar Rol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Editar Rol' : 'Asignar Nuevo Rol'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="user_id">Usuario</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({...formData, user_id: value})}
                  disabled={!!editingRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} ({user.full_name || 'Sin nombre'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.user_id || !formData.role}>
                  {editingRole ? 'Actualizar' : 'Asignar'} Rol
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
              placeholder="Buscar por email, nombre o rol..."
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
          <CardTitle>Usuarios y Roles ({filteredUsersForGrid.length})</CardTitle>
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
    </div>
  );
}