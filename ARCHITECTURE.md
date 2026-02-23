# Grafana Architecture

This document provides an overview of the Grafana codebase architecture, directory structure, and key components.

## Overview

Grafana is a full-stack application with a Go backend and React/TypeScript frontend. The architecture follows a service-oriented design with clear separation between API, business logic, and data layers.

## Tech Stack


| Layer    | Technology                                               |
| -------- | -------------------------------------------------------- |
| Frontend | React 18, TypeScript, Redux Toolkit, Emotion (CSS-in-JS) |
| Backend  | Go, Wire (dependency injection), XORM (database)         |
| Database | PostgreSQL, MySQL, or SQLite                             |
| Build    | Yarn (frontend), Go modules (backend)                    |


## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (React, TypeScript, Redux)                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                              │
│              Legacy (/api/...) │ Resource (/apis/...)           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                             │
│              (Business Logic, Validation, Orchestration)        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Storage Layer                             │
│          Legacy SQL Store │ Unified Storage (K8s-style)         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Database                                │
│               (PostgreSQL / MySQL / SQLite)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

### Root Level

```
grafana/
├── apps/               # Standalone application modules (K8s-style resources)
├── conf/               # Configuration files and defaults
├── contribute/         # Contribution guides and style documentation
├── devenv/             # Development environment configuration
├── docs/               # Documentation source files
├── e2e/                # Cypress end-to-end tests
├── e2e-playwright/     # Playwright end-to-end tests
├── emails/             # Email templates
├── kinds/              # Kind definitions (schema definitions)
├── packages/           # Shared NPM packages (@grafana/*)
├── packaging/          # OS packaging scripts (deb, rpm, docker)
├── pkg/                # Go backend source code
├── public/             # Frontend source and static assets
├── scripts/            # Build and development scripts
└── tools/              # Development tools
```

### Backend (`pkg/`)

The Go backend follows a service-oriented architecture with Wire dependency injection.

```
pkg/
├── api/                # HTTP API handlers and routing
├── apimachinery/       # API machinery (K8s-inspired types)
├── apis/               # Resource API definitions
├── apiserver/          # API server implementation
├── infra/              # Infrastructure utilities (logging, tracing)
├── middleware/         # HTTP middleware
├── plugins/            # Plugin management system
├── registry/           # Service registry (K8s-style resources)
├── server/             # Main server bootstrap
├── services/           # Business logic services
├── setting/            # Configuration management
├── storage/            # Storage layer abstractions
├── tsdb/               # Time series database connectors
├── util/               # Shared utilities
└── web/                # Web server utilities
```

#### Key Services (`pkg/services/`)


| Service                    | Description                       |
| -------------------------- | --------------------------------- |
| `accesscontrol`            | Role-based access control         |
| `alerting` / `ngalert`     | Alerting engine and rules         |
| `annotations`              | Annotation storage and retrieval  |
| `auth` / `authn` / `authz` | Authentication and authorization  |
| `dashboards`               | Dashboard CRUD operations         |
| `datasources`              | Data source management            |
| `featuremgmt`              | Feature flags management          |
| `folder`                   | Folder hierarchy management       |
| `live`                     | Real-time WebSocket communication |
| `plugins`                  | Plugin lifecycle management       |
| `provisioning`             | Configuration provisioning        |
| `user` / `org`             | User and organization management  |


### Frontend (`public/app/`)

The React frontend uses a feature-based organization with Redux Toolkit for state management.

```
public/app/
├── api/                # API client utilities
├── core/               # Core functionality (navigation, services)
├── features/           # Feature modules (main application code)
├── plugins/            # Built-in plugin implementations
├── routes/             # Application routing
├── store/              # Redux store configuration
└── types/              # Shared TypeScript types
```

#### Key Features (`public/app/features/`)


| Feature                         | Description                      |
| ------------------------------- | -------------------------------- |
| `alerting`                      | Alert rules and notifications UI |
| `dashboard` / `dashboard-scene` | Dashboard viewing and editing    |
| `datasources`                   | Data source configuration UI     |
| `explore`                       | Ad-hoc query exploration         |
| `folders`                       | Folder management UI             |
| `live`                          | Real-time updates                |
| `plugins`                       | Plugin management UI             |
| `variables`                     | Dashboard template variables     |


### Shared Packages (`packages/`)

Reusable NPM packages published under `@grafana/*`:


| Package              | Description                        |
| -------------------- | ---------------------------------- |
| `grafana-data`       | Core data structures and utilities |
| `grafana-ui`         | React component library            |
| `grafana-runtime`    | Runtime services and APIs          |
| `grafana-schema`     | TypeScript schema definitions      |
| `grafana-flamegraph` | Flamegraph visualization           |
| `grafana-prometheus` | Prometheus query utilities         |
| `grafana-alerting`   | Alerting utilities                 |


### Application Modules (`apps/`)

Standalone modules following K8s-style resource patterns:


| App         | Description                    |
| ----------- | ------------------------------ |
| `alerting`  | Alerting system                |
| `dashboard` | Dashboard resources            |
| `folder`    | Folder resources               |
| `iam`       | Identity and access management |
| `playlist`  | Playlist resources             |
| `plugins`   | Plugin registry                |
| `secret`    | Secret management              |


## API Architecture

Grafana has two API patterns that coexist:

### Legacy APIs (`/api/...`)

Traditional REST endpoints used by the current UI:

- Variable path structures
- Implicit versioning
- Handler-based routing

### Resource APIs (`/apis/<group>/<version>/...`)

Kubernetes-inspired API structure (future direction):

- Explicit versioning (e.g., `v0alpha1`, `v1`)
- Well-defined OpenAPI schemas
- Declarative, resource-oriented model
- Supports the unified storage layer

## Service Architecture

Backend services follow a consistent pattern:

```
pkg/services/myservice/
├── myservice.go           # Interface and types
├── models.go              # Commands, queries, domain models
├── errors.go              # Error definitions
├── myserviceimpl/         # Implementation
│   ├── service.go         # Business logic
│   └── store.go           # Database operations
└── api.go                 # HTTP handlers (optional)
```

### Dependency Injection

Services use Wire for compile-time dependency injection:

```go
// Wire provider function
func ProvideService(cfg *setting.Cfg, db db.DB) (*ServiceImpl, error) {
    return &ServiceImpl{cfg: cfg, db: db}, nil
}
```

## Plugin System

Grafana supports three types of plugins:


| Type        | Description              | Location                         |
| ----------- | ------------------------ | -------------------------------- |
| Panel       | Visualization components | `public/app/plugins/panel/`      |
| Data Source | Data connectors          | `public/app/plugins/datasource/` |
| App         | Full applications        | External or bundled              |


Plugins can be:

- **Core:** Built into Grafana
- **Bundled:** Shipped with Grafana but separately maintained
- **External:** Installed from the plugin catalog

## Frontend Architecture

### State Management

- **Redux Toolkit:** Application state with RTK Query for API calls
- **React Context:** Component-level state sharing
- **Local State:** Component-specific state with hooks

### Styling

- **Emotion:** CSS-in-JS with the `css` template literal
- **GrafanaTheme2:** Theming system for colors, spacing, typography
- **@grafana/ui:** Component library with consistent styling

### Routing

React Router v5 with route definitions in `public/app/routes/`.

## Development Workflow

### Prerequisites

- Git
- Go (version in `go.mod`)
- Node.js LTS (version in `.nvmrc`)
- Yarn (via Corepack)

### Commands

```sh
# Frontend development
yarn install --immutable
yarn start

# Backend development
make run

# Testing
yarn test           # Frontend unit tests
make test-go        # Backend unit tests
yarn test:e2e       # E2E tests (Playwright)

# Linting
make lint-go        # Backend
yarn lint           # Frontend
```

## Additional Resources

- [Contributing Guide](CONTRIBUTING.md)
- [Developer Guide](contribute/developer-guide.md)
- [Backend Style Guide](contribute/backend/style-guide.md)
- [Frontend Style Guide](contribute/style-guides/frontend.md)
- [Grafana Documentation](https://grafana.com/docs/)
- [Accessibility Style Guide](contribute/style-guides/accessibility.md)
# Sample Code
```tsx
<Button onClick={() => {}}>Click me</Button>
    <Field label="Username">
  <Input id="username" placeholder="Enter a name" value={'Test'} />
</Field>    
``` 

