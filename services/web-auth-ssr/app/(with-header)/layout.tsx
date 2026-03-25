import { Header } from '@supreme-int/design-system/src/components/Header/Header';

export default function WithHeaderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header logoText="🍳 Taste.IT" logoHref="/" />
      {children}
    </>
  );
}
