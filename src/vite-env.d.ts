/// <reference types="vite/client" />

declare module '*?raw' {
  const __bucketLocaleRawContent: string;
  export default __bucketLocaleRawContent;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function gtag(...args: any[]): void;
