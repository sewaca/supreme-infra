# web-profile-ssr

profile

## Features

- Next.js 15 with App Router
- Server-side rendering (SSR)
- OpenTelemetry instrumentation
- Prometheus metrics
- TypeScript
- SVG imports as React components

## Prerequisites

- Node.js 22+
- pnpm 9+

## Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run Development Server

```bash
pnpm run dev
```

The application will start on http://localhost:3005

### 3. Access Application

- Homepage: http://localhost:3005
- Health check: http://localhost:3005/api/status
- Metrics: http://localhost:9464/metrics

## Testing

```bash
# Run unit tests
pnpm run unit --verbose

# Run tests in watch mode
pnpm run unit:watch

# Run tests with coverage
pnpm run unit:coverage
```

## Building

```bash
# Build for production
pnpm run build

# Run production build
pnpm run start
```

## Environment Variables

| Variable                  | Description                      | Default     |
| ------------------------- | -------------------------------- | ----------- |
| PORT                      | Server port                      | 3005        |
| NODE_ENV                  | Environment                      | development |
| BACKEND_SERVICE_NAMESPACE | Kubernetes namespace for backend | default     |

## Project Structure

```
app/
├── layout.tsx          # Root layout
├── page.tsx            # Homepage
└── api/
    └── status/
        └── route.ts    # Health check endpoint

src/
├── components/         # Reusable components
├── shared/            # Shared utilities
└── views/             # Page views
```

## SVG Icons

You can import SVG files as React components:

```tsx
import MyIcon from "./path/to/icon.svg";

function MyComponent() {
  return <MyIcon width={24} height={24} className="icon" />;
}
```

SVG components accept all standard SVG props (width, height, className, fill, stroke, etc.).

## License

ISC
