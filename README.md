# Version Cero
Versión cero de proyectos Angular basados en Angular 20 y Baloise Design System.

## Stack  

### Base
| Área         | Versión           |
| ------------ | ----------------- | 
| Node         | 24.13.1           |
| npm          | 11.8.0            | 
| Nx           | 22.4.5            |

### Frameworks  
| Área                                | Versión   |
| ----------------------------------- | --------- | 
| Angular                             | ~20.3.x   |
| Helvetia Baloise design system      | 19.10.1   |


### Testing  
| Área         | Versión             | 
| ------------ | ------------------- | 
| Unit testing | Vitest (+ AnalogJS) |
| E2E          | Cypress             |

## Estructura del proyecto (Nx + Angular)

### apps/

Contiene las aplicaciones finales ejecutables.

- Solo incluye **orquestación**, no lógica de negocio.
- Define:
  - Routing principal (`app.routes.ts`)
  - Layout (shell, header, sidebar…)
  - Configuración global
  - Integración de las librerías

👉 Regla: la app **consume libs**, no implementa lógica.

---

### libs/

Contiene toda la lógica reutilizable y estructurada por responsabilidades:

- `core/` → servicios globales, utilidades, contratos
- `data/` → acceso a APIs, repositorios
- `ui/` → componentes visuales reutilizables
- `shared/` → utilidades comunes (pipes, helpers…)
- `features/` → funcionalidades de negocio (dominio)

👉 Regla: aquí vive **toda la lógica real de la aplicación**.

### Uso recomendado

- La app define **qué se carga y cuándo (routing)**  
- Las libs definen **cómo funciona el sistema**

## Recursos  
- [Angular](https://angular.dev/)
- [Helvetia Baloise design system](https://design.baloise.dev/?path=/docs/welcome--documentation)
- [Gobierno Fron Caser/Helvetia](https://caser.atlassian.net/wiki/spaces/AT/pages/16482358/Angular+-+Gobierno+Front)

## Requisitos previos 

- Instalacion de NodeEnv https://developerportaltest.caser.local/documentation/fundamentals/nodenv 

## Instalación 
0. Arrancar el CmDer (ver [nodeEnv](https://developerportaltest.caser.local/documentation/fundamentals/nodenv)) y revisar que la versión de node es la 24.13.1
```bash
node -v
```
Si no es la version 24.13.1,  usar nvm para instalar y/o seleccionar esta versión 
```bash
nvm use 24.13.1
```
Y si no esta instalada previamente
```bash
nvm install 24.13.1
```
1. Clone 
```bash
git clone {{url-repo}}
```
2. Ir a carpeta de proyecto
```bash
cd {{folder-repo}}
```
3. Install  
```bash
npm install
```

## Arranque del proyecto 
```bash
npm start
```
## Construcción del proyecto 
```bash
npm run build:docker
``` 
## Testing  
```bash
npm run test:ci
```

## Despliegue 

### Jobs  

| Tipo         | Url             | 
| ------------ | ------------------- | 
| Construcción | https://jenkins.caser.local/job/{{area}}/job/OCP/job/FRONT/job/{{name-aprovisionamiento}}/job/build/ |
| Despliegue   | https://jenkins.caser.local/job/{{area}}/job/OCP/job/FRONT/job/{{name-aprovisionamiento}}/job/deploy/ |

### Urls de publicación

| Entorno      | Url             | 
| ------------ | ------------------- | 
| Integración  | https://{{name-aprovisionamiento}}.rosa-inte-front.caser.local/ |
| Test         | https://{{name-aprovisionamiento}}.rosa-test-front.caser.local/ |
| Produccion   | https://{{name-aprovisionamiento}}.caser.local/ |

## Fucionalidades y utilidades  
Funcionalidades y utilidades integracadas en esta versión cero. 

### OCP y SSO 
Integración con OCP 
- [Documentacion en Confluence](https://caser.atlassian.net/wiki/spaces/AT/pages/311591083/Documentaci+n+proyecto+OpenShift+Front)

- [Helvetia lib](https://archit-storybooks-nginte.caser.local/?name=archit-lib-helvetiang)

### SSO 
- [Helvetia lib](https://archit-storybooks-nginte.caser.local/?name=archit-lib-helvetiang)

### SonarQB 
Configuración de SonarQB
[Informes SonarQB](https://sonar.caser.local/dashboard?id={{name-aprovisionamiento}})