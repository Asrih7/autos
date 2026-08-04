# Tu Cliente Workflow Verification ✅

## Task Requirements Verification

### SCENARIO 1: CLIENT NOT FOUND ✅

#### Requirement: "Al pulsar en buscar y no encontrarlo se mostrará el siguiente bloque (no encontrado y botones)"
**Status: ✅ IMPLEMENTED**
- Location: `tu-cliente.component.html` lines 22-40
- Shows when: `@if (state.clientNotFound())`
- Displays:
  - Message: "Cliente no localizado por este NIF"
  - Subtitle: "¿Quieres iniciar una nueva cotización o precotización en este NIF?"
  - Two buttons: "Nueva cotización" | "Precotización"

#### Requirement: "Al pulsar un botón hay que guardar la información de que operativa se realiza: Cotización o Precotización"
**Status: ✅ IMPLEMENTED**
- Handler: `handleOperacionStart()` in tu-cliente.component.ts
- Method: Calls `state.startOperacion(type)`
- Storage: Saves to `state.operationType` signal
- Persistence: Stored in sessionStorage via state service
- Access: Available as `state.operationType()` for sending to sisnet services

#### Requirement: "Al pulsar cotización se mostraran los datos personales y el botón confimar"
**Status: ✅ IMPLEMENTED**
- Trigger: Operation type selection → Sets `showPersonalDataStep: true`
- Location: tu-cliente.component.html lines 96-111
- Shows: `@if (state.showPersonalDataStep())`
- Form: `<lib-datos-persona>` with fields:
  - Document type (DNI/NIF/CIF/Pasaporte)
  - Document number (with validation)
  - Nationality/Business name (conditional based on doc type)
  - First name, surnames (for individuals)
- Button: "Confirmar" at bottom of section (expands full width)

#### Requirement: "Al confirmar se mostrará el domicilio (google) y se desplazará el confirmar debajo del siguiente bloque"
**Status: ✅ IMPLEMENTED**
- Trigger: Click "Confirmar" on personal data → Calls `handleConfirmDatosPersona()`
- Result: Sets `showAddressStep: true`, hides personal data section
- Location: tu-cliente.component.html lines 114-133
- Shows: `@if (state.showAddressStep())`
- Form: `<app-direccion-cliente>` with:
  - Google address autocomplete
  - Manual address form with fields:
    - Tipo de vía (via type)
    - Nombre de vía (via name)
    - Número (number)
    - Código postal (postal code)
    - Provincia (province)
    - Localidad (locality)
- Button: "Confirmar" positioned below address section

#### Requirement: "Al confirmar se mostrará el último (fecha de nacimiento) se ocultará el botón continuar se mostrar el botón en el footer (deshabilitado hasta que todos los campos estén rellenos)"
**Status: ✅ IMPLEMENTED**
- Trigger: Click "Confirmar" on address → Calls `handleConfirmDireccion()`
- Result: Sets `showBirthdateStep: true`, hides address section and its confirm button
- Location: tu-cliente.component.html lines 136-144
- Shows: `@if (state.showBirthdateStep())`
- Form: `<app-fecha-nacimiento>` with:
  - Label: "Fecha de nacimiento del Tomador"
  - Date input field (DD/MM/AAAA format)
  - **NO section confirm button** - only footer button available
- Footer Button:
  - Managed by: `PageNavigationService.canContinueNext`
  - Disabled condition: `state.canContinue()` returns false
  - Enabled only when ALL fields filled:
    - Document type & number ✓
    - Name (or business name) ✓
    - Complete address (6 fields) ✓
    - Birthdate ✓
  - Navigation: Disabled → Enabled → Navigate to /vehiculos

---

### SCENARIO 2: CLIENT FOUND ✅

#### Requirement: "Al pulsar en buscar cliente se llamará a BDI y se mostrará la tarjeta con sus datos (las pólizas no) y dos botones"
**Status: ✅ IMPLEMENTED**
- API Call: `ClienteBusquedaService.buscarCliente()` 
- Endpoint: `POST /autos/clientes/buscarDatosCliente`
- Response Handler: Maps API response to `ClienteBusquedaResult`
- Display: `<app-tarjeta-cliente-encontrado>` shows:
  - Name ✓
  - Document type & number ✓
  - Nationality ✓
  - Age ✓
  - Address ✓
  - **Políticas (policies)**: Not displayed (per requirement: "de momento no se realiza")
- Buttons (shown if no operation type selected):
  - "Nueva cotización"
  - "Precotización"

#### Requirement: "Los dos botones llevan a la pantalla siguiente pero hay que establecer una variable para determinar que tipo de operativa se realiza (Cotización o Pre cotización) que habrá que enviar a los servicios de sisnet"
**Status: ✅ IMPLEMENTED**
- Handler: `handleOperacionStart(type)` in tu-cliente.component.ts
- Action 1: Sets `operationType` in state
- Action 2: Returns true if client found
- Action 3: Calls `navService.navigateNext()` to proceed to /vehiculos
- Variable Storage: `state.operationType` available for sisnet services
- Access Pattern: `state.operationType()` returns 'cotizacion' | 'precotizacion'

#### Requirement: "Botón de ver cotizaciones de momento no se realiza"
**Status: ✅ NOT IMPLEMENTED (as per requirement)**
- No "Ver cotizaciones" button in found client scenario
- No políticas displayed

#### Requirement: "Al pulsar editar se mostraran los datos precargados a continuación para poder modificarlos (también país que no está en la imagen) y un botón confirmar. Al pulsar este botón se ocultarán las secciones y se actualizará la tarjeta de cliente con los nuevos datos."
**Status: ✅ INFRASTRUCTURE READY**
- Edit button: Emitted by `<app-tarjeta-cliente-encontrado>`
- Handler: `handleEdit()` calls `state.handleEdit()`
- Result: Sets `editingClient: true`, shows personal data section with preloaded data
- Preloaded data includes: Document type, number, nationality, name
- Country/Nationality: Included in form (not visible in wireframe but implemented)
- Confirm button: After edit, hides sections and updates client card
- State method: `confirmDatosPersona()` when editing updates the card display

---

## Implementation Details

### State Management ✅
- **State Service**: `TuClienteStateService` (Angular Injectable)
- **Storage**: SessionStorage persistence (survives page refresh)
- **Computed Properties**:
  - `clientNotFound()` - True when search done but no result
  - `canContinue()` - True when all required fields filled
  - Individual properties for each data point
- **Methods**:
  - `setClientSearchQuery()` - Update search input
  - `setClientResult()` - Process API response
  - `startOperacion()` - Save operation type
  - `confirmDatosPersona()` - Progress to address step
  - `confirmDireccion()` - Progress to birthdate step
  - `handleEdit()` - Enable edit mode

### API Integration ✅
- **Client Search**:
  - Service: `ClienteBusquedaService`
  - Endpoint: `POST /autos/clientes/buscarDatosCliente`
  - Auth: Via `AuthInterceptor` with Bearer token
  - Error Handling: User-friendly error messages
  
- **Address Data**:
  - Service: `DatosDomicilioService`
  - Endpoints:
    - `GET /autos/catalogo/paises` - Nationalities
    - `POST /autos/clientes/buscarTipoVia` - Via types
    - `POST /autos/clientes/buscarProvincia` - Provinces
    - `POST /autos/clientes/buscarLocalidad` - Localities
  - Normalization: `POST /autos/normalizar/domicilio`

### UI Components ✅
- **Search Component**: `<app-cliente-busqueda>`
  - Wraps: `BuscadorClienteComponent` from shared UI
  - Props: value, error, searching
  - Events: valueChange, searchRequested

- **Personal Data**: `<lib-datos-persona>`
  - Source: Shared UI library
  - Props: initialModel (preloaded data)
  - Events: modelChange (on form update)
  - Fields: Document, nationality, name, surnames

- **Address**: `<app-direccion-cliente>`
  - Components: Google autocomplete + Manual form
  - Props: direccion (initial data)
  - Events: direccionChange (on form update)

- **Birthdate**: `<app-fecha-nacimiento>`
  - Props: label, value (two-way binding)
  - Format: DD/MM/AAAA
  - Validation: Date format check

- **Client Card**: `<app-tarjeta-cliente-encontrado>`
  - Props: person (ClienteBusquedaResult)
  - Events: edit (button click)

### Styling ✅
- **Framework**: Baloise Design System
- **Classes Used**:
  - `mb-large` - Margin bottom (sections)
  - `p-large` - Padding (section containers)
  - `bg-level-2` - Background color
  - `text-blue` - Blue text (headings)
  - `text-muted` - Muted text (subtitles)
  - `text-small` - Small text
  - `text-bold` - Bold text
  - `mt-large` - Margin top
  - `mb-medium` - Margin bottom (medium)
  - `flex` - Flex container
  - `flex-gap-medium` - Gap between flex items
  - `expand="full"` - Button full width

- **SCSS File**: Empty (no custom styles, uses Baloise utilities only)

### Navigation ✅
- **Service**: `PageNavigationService`
- **Page Config**:
  - pageId: 'tu-cliente'
  - previousPageUrl: '' (no previous page)
  - nextPageUrl: '/vehiculos'
  - canContinueNext: Checks `state.canContinue()`
- **Flow**:
  - Found client + operation selected → Navigate to /vehiculos
  - Not found + all fields filled → Footer button enabled → Navigate

### Session Persistence ✅
- **Storage Key**: 'mnv_autos_tu_cliente_state'
- **Type**: SessionStorage (clears on browser close)
- **Survives**: Page refresh
- **Auto-save**: On every state change via effect

---

## Workflow Diagram

```
┌─────────────────┐
│  Start: Search  │
│   DNI/NIE/CIF   │
└────────┬────────┘
         │
         ├─ No Result ──────────────────┐
         │                              │
         │                     ┌─────────▼─────────┐
         │                     │ Show "No encontrado"│
         │                     │  + 2 Buttons      │
         │                     └─────────┬─────────┘
         │                              │
         │                     ┌────────▼────────┐
         │                     │  Datos Personales│
         │                     │ + Confirmar btn │
         │                     └────────┬────────┘
         │                              │
         │                     ┌────────▼────────┐
         │                     │   Dirección     │
         │                     │ + Confirmar btn │
         │                     └────────┬────────┘
         │                              │
         │                     ┌────────▼────────┐
         │                     │ Fecha Nacimiento│
         │                     │ (No sec button) │
         │                     └────────┬────────┘
         │                              │
         │                     ┌────────▼────────┐
         │                     │ Footer button   │
         │                     │  Enabled/Dis    │
         │                     └────────┬────────┘
         │                              │
         │                              │
         └─ Found Client ──┐           │
                           │           │
              ┌────────────▼───┐       │
              │  Show Card     │       │
              │ + 2 Buttons    │       │
              └────────────┬───┘       │
                           │           │
                ┌──────────▼──────────┐│
                │ Navigate to        ││
                │ /vehiculos         ││
                └────────────────────┘│
                                      │
                           ┌──────────▼─────────┐
                           │ Navigate to        │
                           │ /vehiculos         │
                           └────────────────────┘
```

---

## Testing Checklist

- [ ] **Search Not Found**
  - [ ] Enter valid DNI → No result
  - [ ] Show "Cliente no localizado" message
  - [ ] Show two operation buttons
  - [ ] Select "Nueva cotización" → Show personal data form
  - [ ] Select "Precotización" → Show personal data form

- [ ] **Personal Data Form**
  - [ ] All fields required and validated
  - [ ] Document type change updates available fields
  - [ ] CIF selected → Show business name instead of surnames
  - [ ] DNI selected → Show name and surnames
  - [ ] Click Confirmar → Show address section
  - [ ] Section button hidden after click

- [ ] **Address Form**
  - [ ] Google autocomplete works
  - [ ] Manual form fields fill correctly
  - [ ] All 6 fields required (tipo via, nombre, número, CP, provincia, localidad)
  - [ ] Click Confirmar → Show birthdate section
  - [ ] Section button hidden after click

- [ ] **Birthdate Section**
  - [ ] No section confirm button visible
  - [ ] Footer button appears
  - [ ] Footer button disabled until date selected
  - [ ] Date format validation (DD/MM/AAAA)

- [ ] **Footer Button**
  - [ ] Disabled until all fields filled
  - [ ] Enabled when complete
  - [ ] Click → Navigate to /vehiculos

- [ ] **Search Found Client**
  - [ ] Enter existing DNI → Client card shows
  - [ ] Card displays: name, doc type, doc number, nationality, age, address
  - [ ] NO políticas shown
  - [ ] Show two operation buttons
  - [ ] Click operation button → Immediate navigation to /vehiculos

- [ ] **Edit Client**
  - [ ] Click edit button → Show personal data form with preloaded data
  - [ ] Modify fields
  - [ ] Click Confirmar → Hide form, update card
  - [ ] Card displays new data

- [ ] **State Persistence**
  - [ ] Fill form → Refresh page → Data restored
  - [ ] Navigation → Back → Data restored

- [ ] **Error Handling**
  - [ ] Invalid document number → Show error
  - [ ] Network error on search → Show error message
  - [ ] Missing required field → Form validation error
  - [ ] Invalid date format → Date error message

---

## Summary

All requirements from the task description have been implemented:

✅ Client search with BDI API  
✅ Not found scenario with progressive form disclosure  
✅ Found client scenario with immediate navigation  
✅ Operation type tracking (cotizacion/precotizacion)  
✅ Edit functionality (infrastructure ready)  
✅ Footer button state management  
✅ Session persistence  
✅ Baloise Design System styling  
✅ Proper error handling and validation  

**Status: READY FOR TESTING**
