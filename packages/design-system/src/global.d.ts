declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// declare module '*.svg' {
//   import type { FC, SVGProps } from 'react';
//   const ReactComponent: FC<SVGProps<SVGSVGElement>>;
//   export default ReactComponent;
// }

declare module '*.svg' {
  import { FC, SVGProps } from 'react';
  const content: FC<SVGProps<SVGElement>>;
  export default content;
}

declare module '*.svg?url' {
  const content: any;
  export default content;
}
