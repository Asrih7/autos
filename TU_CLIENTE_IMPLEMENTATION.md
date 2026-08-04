# Tu Cliente - Complete Implementation

## Overview
The Tu Cliente feature is the first step in the insurance quotation process. It identifies the client (insured party) and collects their personal information, address, and birthdate.

## Architecture

### Component Structure
```
apps/mnv-autos-ng/src/app/components/tu-cliente/
├── tu-cliente.component.ts          (Main orchestration)
├── tu-cliente.component.html        (Workflow UI)
├── tu-cliente.component.scss        (Styling)
├── tu-cliente-state.service.ts      (State management)
├── data-access/                     (Empty - uses shared services)
└── steps/
    ├── cliente-busqueda/            (Wrapper around BuscadorClienteComponent)
    ├── datos-persona/               (Shared UI component adapter)
    ├── direccion-cliente/           (Address form orchestrator)
    ├── fecha-nacimiento/            (Birthdate input component)
    └── tarjeta-cliente-encontrado/  (Client card display)
```

### Shared UI Components Used
- `BuscadorClienteComponent` - Client search input
- `DatosPersona` - Personal data form
- `DatosDomicilioGoogle` - Google address autocomplete
- `DatosDomicilioForm` - Manual address form
- `FechaNacimiento` - Birthdate picker

## Workflow

### 1. Client Search
- User enters DNI/NIE/CIF
- Component calls `ClienteBusquedaService.buscarCliente()`
- API call to: `POST /autos/clientes/buscarDatosCliente`
- Response is mapped and stored in state

### 2. Scenario A: Client NOT Found
Flow:
1. Search returns no result
2. Show "Cliente no localizado" message with two buttons:
   - "Nueva cotización" 
   - "Precotización"
3. User selects button → Operation type saved to state
4. Show "Datos Personales" section
   - Form with: Document type, Document number, Nationality/Business name, Name, Surnames
   - Confirm button shows "Dirección" section
5. Show "Dirección" section
   - Google address autocomplete + manual form
   - Confirm button shows "Fecha Nacimiento" section
6. Show "Fecha Nacimiento" section
   - Date picker
   - Footer "Next" button becomes enabled when all fields filled
7. User clicks footer "Next" button → Navigate to /vehiculos

### 3. Scenario B: Client FOUND
Flow:
1. Search returns client data
2. Show client card with:
   - Name
   - Document type and number
   - Nationality
   - Age
   - Address (if available)
3. Show two operation type buttons:
   - "Nueva cotización"
   - "Precotización"
4. User clicks button → Operation type saved
5. **Immediate navigation** to /vehiculos (no form filling needed)
6. Optional: User can click "Editar" to modify preloaded data before proceeding

## State Management

### TuClienteStateService
Manages application state with computed properties and methods:

**Main State Properties:**
- `clientSearchQuery: string` - Current search input
- `clientResult: ClienteBusquedaResult | null` - Found client data
- `operationType: 'cotizacion' | 'precotizacion'` - Selected operation
- `datosPersona: DatosPersonaModel` - Personal data form
- `direccion: DatosDomicilioModel` - Address form
- `birthDate: string | undefined` - Birthdate

**Computed Properties:**
- `clientNotFound()` - True if search performed but no result
- `canContinue()` - True when all required fields are filled

**State Methods:**
- `setClientSearchQuery(value)` - Update search input
- `setClientResult(result)` - Update search result
- `startOperacion(type)` - Save operation type, show appropriate sections
- `confirmDatosPersona()` - Validate personal data, show address section
- `confirmDireccion()` - Validate address, show birthdate section
- `setBirthDate(value)` - Update birthdate
- `handleEdit()` - Enable edit mode for found client
- `setDatosPersona()` - Update personal data
- `setDireccion()` - Update address

## API Integration

### Services Used
1. **ClienteBusquedaService**
   - Endpoint: `POST /autos/clientes/buscarDatosCliente`
   - Maps API response to `ClienteBusquedaResult`
   - Handles both existing customers and prospects

2. **DatosDomicilioService**
   - `GET /autos/clientes/buscarTipoVia` - Address types
   - `POST /autos/clientes/buscarProvincia` - Provinces
   - `POST /autos/clientes/buscarLocalidad` - Localities
   - `POST /autos/normalizar/domicilio` - Normalize address
   - All calls include authentication via AuthInterceptor

3. **DatosPersonaHttpService**
   - `GET /autos/catalogo/paises` - List of countries/nationalities
   - Combines with hardcoded document types

### Request/Response Format (from data.json)
```typescript
// Search Request
{
  documento: string;
  usuario: string;
  aplicacion: string;
  consultarProspect: string;
  idioma: string;
}

// Search Response
{
  clientes?: Cliente[];
  prospectoClientes?: Cliente[];
}

// Cliente Object
{
  clienId?: number;
  documento?: string;
  tipoPersona?: string;  // DNI, NIF, CIF, NIE
  nombre?: string;
  apell1?: string;
  apell2?: string;
  razonSocial?: string;
  fecNac?: string;
  indSexo?: string;
}
```

## Footer Button Logic

The footer "Next" button state is controlled by:
```typescript
canContinueNext: () => this.state.canContinue()
```

The `canContinue()` computed property returns true only when:
- Birthdate step is visible
- Document type and number are provided
- Name (first + surnames OR business name for CIF) is provided
- Complete address: tipo via, nombre via, numero, postal code, province, locality
- Birthdate is set

This ensures the button is disabled until the user has completed all required information.

## Navigation Flow

### Current Page Config
```typescript
{
  pageId: 'tu-cliente',
  previousPageUrl: '',
  previousPageLabel: '',
  nextPageUrl: '/vehiculos',
  canContinueNext: () => this.state.canContinue(),
}
```

### Navigation Logic
1. **From Tu Cliente to Vehiculos:**
   - Found client: Immediate after operation type selection
   - Not found client: After all forms completed and footer Next clicked

2. **Back Navigation:**
   - Returns to previous page (if applicable) or home

## Styling

Uses Baloise Design System components:
- `BalButton` - Action buttons
- `BalHeading` - Section titles
- `BalField`, `BalFieldControl`, `BalFieldLabel` - Form fields
- `BalInput`, `BalSelect` - Input controls

Sections have:
- Consistent spacing and padding
- Color scheme from Baloise
- Responsive layout

## Session Persistence

All state is persisted to `sessionStorage` with key `mnv_autos_tu_cliente_state`.
- Survives page refresh
- Cleared on browser close
- Automatically saved on any state change

## Error Handling

1. **Search Errors:**
   - Network errors → Show generic error message
   - Empty input → Validation error
   - No results → "Cliente no encontrado" message

2. **Form Validation:**
   - Document number → Type-specific validation
   - Address fields → Required field validation
   - Birthdate → Required field validation

3. **API Call Errors:**
   - Handled by HttpInterceptor with automatic retry
   - Falls back to mock data if available
   - Shows error toast to user

## Refactoring Recommendations

### Code Deduplication
1. **DatosPersonaHttpService** - Duplicate between:
   - `apps/mnv-autos-ng/src/app/components/tu-cliente/steps/datos-persona/data-access/`
   - `libs/shared/ui/src/lib/datos-persona/data-access/`
   - **Action:** Keep the one in shared/ui, remove app-local version

2. **DatosPersona Component** - Two versions exist:
   - Local version with Signal-based inputs (incomplete)
   - Shared UI version with @Input/@Output (complete)
   - **Action:** Use only the shared UI version

3. **Step Components** - Could be moved to shared/ui:
   - ClienteBusquedaComponent - wrapper over BuscadorClienteComponent
   - TarjetaClienteEncontrado - card display component
   - **Action:** Consider moving to libs/shared/ui for reuse

### Future Enhancements
1. Add i18n support for:
   - Form labels
   - Error messages
   - Section titles

2. Add comprehensive form validation:
   - Real-time validation
   - Field-level error messages
   - Cross-field validation

3. Add loading indicators:
   - Skeleton loaders while API calls pending
   - Disabled form fields during save

4. Add client edit workflow:
   - Currently has `editingClient` flag in state
   - Need to implement full edit UI and save

## Testing Checklist

- [ ] Search with valid DNI → Client found
- [ ] Search with invalid DNI → Client not found
- [ ] Client not found → Fill form → Navigate to vehiculos
- [ ] Client found → Select operation type → Navigate to vehiculos
- [ ] Form validation → All fields required
- [ ] Footer button → Disabled until form complete
- [ ] Session persistence → Refresh page → Data restored
- [ ] Address autocomplete → Select from Google
- [ ] Manual address entry → All fields filled correctly
- [ ] Birthdate validation → Date format valid
- [ ] Back navigation → Returns to previous page
- [ ] Edit client → Modify and save preloaded data

## Deployment Notes

1. **Environment Variables:**
   - API base URL configured in environment files
   - Auth credentials stored in environment

2. **Dependencies:**
   - Baloise Design System (latest version)
   - @ngx-translate for i18n
   - RxJS for observables

3. **Breaking Changes:**
   - None - new feature

4. **Migration Path:**
   - Standalone feature
   - No changes to existing components required
