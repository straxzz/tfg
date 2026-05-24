import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * +html.tsx — plantilla HTML para la versión web.
 * El favicon lo inyecta Expo automáticamente desde app.json (web.favicon).
 * Solo se usa en web.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#000000" />
        <meta
          name="description"
          content="Tu armario digital. Organiza, descubre y comparte tu ropa."
        />
        <meta property="og:title" content="Virtual Closet" />
        <meta
          property="og:description"
          content="Tu armario digital. Organiza, descubre y comparte tu ropa."
        />
        <meta property="og:type" content="website" />

        {/*
          ScrollViewStyleReset ajusta overflow en html/body para que los
          scroll containers nativos funcionen correctamente en web.
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body { height: 100%; }
          #root { display: flex; flex: 1; height: 100%; }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
