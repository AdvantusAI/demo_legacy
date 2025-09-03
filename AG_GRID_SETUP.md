# AG Grid Enterprise Setup

## Configuración de License Key

Para usar AG Grid Enterprise en este proyecto, necesitas configurar tu license key:

### Opción 1: Variable de Entorno (Recomendado)

1. Crea un archivo `.env.local` en la raíz del proyecto
2. Agrega tu license key:
```
VITE_AG_GRID_LICENSE_KEY=tu_license_key_aqui
```

### Opción 2: Configuración Directa

1. Abre `src/lib/ag-grid-config.ts`
2. Reemplaza `'YOUR_LICENSE_KEY_HERE'` con tu license key actual:
```typescript
const licenseKey = 'tu_license_key_aqui';
```

## Características Habilitadas

Con AG Grid Enterprise tienes acceso a:

- ✅ Filtros avanzados
- ✅ Agrupación de filas
- ✅ Pivoting
- ✅ Exportación a Excel
- ✅ Gráficos integrados
- ✅ Range selection
- ✅ Clipboard operations
- ✅ Master/Detail
- ✅ Tree data
- ✅ Server-side row model

## Personalización de Estilos

Los estilos personalizados están definidos en `src/styles/ag-grid-custom.css` y están sincronizados con el tema de la aplicación usando variables CSS semánticas.

## Uso en el Catálogo de Clientes

El componente `CustomersCatalog` ya está configurado con:
- Paginación
- Filtros por columna
- Búsqueda global
- Acciones personalizadas (Editar/Eliminar)
- Tema consistente con la aplicación