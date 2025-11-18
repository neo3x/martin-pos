# Martin POS Desktop

Aplicación de escritorio para Martin POS construida con Electron.

## Características

- Interfaz de escritorio nativa
- Integración con impresoras térmicas POS
- Impresión de etiquetas
- Soporte para lectores de código de barras USB
- Modo offline

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Build

```bash
# Build para todas las plataformas
pnpm build

# La aplicación se generará en la carpeta `out/`
```

## Integración con Impresoras

La aplicación soporta impresoras térmicas ESC/POS conectadas via:
- USB
- Red (TCP/IP)
- Serial

Configurar en Settings la ruta de conexión.
