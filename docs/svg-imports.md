# SVG Imports as React Components

This repository is configured to import SVG files as React components across all packages and Next.js services.

## Usage

You can import SVG files directly and use them as React components:

```tsx
import MyIcon from "./path/to/icon.svg";

function MyComponent() {
  return (
    <div>
      <MyIcon width={24} height={24} className="my-icon" />
    </div>
  );
}
```

## Configuration

### Next.js Services

All Next.js services (`frontend`, `auth-ssr`, `web-documents-ssr`) are configured with:

1. **Webpack configuration** in `next.config.ts`:
   - Uses `@svgr/webpack` to transform SVG files into React components
   - Excludes SVG from Next.js default file loader to prevent conflicts
   - Supports `?url` query parameter for importing SVG as URL if needed

2. **TypeScript declarations** in `svg.d.ts`:
   - Provides type definitions for SVG imports

### Packages

The `design-system` package and other packages can import SVGs thanks to:

1. **Global type declarations** in `global.d.ts`:
   - Defines SVG module types for TypeScript

### Testing with Vitest

SVG imports are automatically mocked in Vitest tests:

- Each service's `vitest.setup.ts` includes a mock for `*.svg` files
- SVG components are replaced with simple `<svg>` elements in tests

## Example

See `packages/design-system/src/components/NavBar/NavBar.tsx` for a working example:

```tsx
import BackShortArrow from "../../icons/BackShortArrow.svg";

export const NavBar = ({ onBack }: Props) => {
  return (
    <div className={styles.backButton} onClick={onBack}>
      <BackShortArrow />
    </div>
  );
};
```

## Props

SVG components accept all standard SVG props:

- `width`, `height` - Size of the icon
- `className` - CSS class name
- `fill`, `stroke` - Colors (use `currentColor` to inherit text color)
- All other SVG attributes

## Best Practices

1. Use `currentColor` for fill/stroke in SVG files to allow CSS color control
2. Set default viewBox in SVG files for proper scaling
3. Remove unnecessary attributes from SVG files (width, height, etc.)
4. Use semantic names for icon files
