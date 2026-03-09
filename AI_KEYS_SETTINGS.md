# AI_KEYS_SETTINGS

## Objetivo
Administrar API keys de IA (OpenAI y Claude/Anthropic) desde Settings, sin exponer la clave completa al frontend.

## Proveedores soportados
- `OPENAI`
- `ANTHROPIC`

## Modelo de datos
Tabla: `ai_provider_keys`
- `provider`
- `encryptedKey`
- `iv`
- `authTag`
- `keyFingerprint`
- `last4`
- `isActive`
- `branchId`
- `createdById`
- `deletedAt` (baja logica)

## Seguridad implementada
- Cifrado en backend con `AES-256-GCM`.
- Clave de cifrado derivada desde:
  - `SETTINGS_ENCRYPTION_KEY` (preferido), o
  - `JWT_SECRET` como fallback.
- Nunca se devuelve `apiKey` completa.
- El frontend recibe solo:
  - proveedor
  - mascara (`OpenAI ************ABCD`)
  - `last4`
  - estado activa/inactiva

## Operaciones soportadas
- Agregar key
- Listar keys enmascaradas
- Reemplazar key
- Activar / desactivar key
- Eliminar key (soft delete)

## Endpoints
- `GET /settings/ai-keys`
- `POST /settings/ai-keys`
- `PUT /settings/ai-keys/:id/replace`
- `PUT /settings/ai-keys/:id/toggle`
- `DELETE /settings/ai-keys/:id`

## UX en Settings
Pantalla: `/dashboard/settings`, tab `IA Keys`
- Formulario simple (proveedor + key)
- Listado de claves guardadas (mascaradas)
- Botones de eliminar, activar/inactivar y reemplazar

## Validacion basica
- OpenAI: prefijo `sk-`
- Anthropic: prefijo `sk-ant-` o `sk-`

## Riesgos y recomendacion
- Si no se define `SETTINGS_ENCRYPTION_KEY`, se usa `JWT_SECRET` como fallback.
- Recomendado en produccion: definir `SETTINGS_ENCRYPTION_KEY` dedicada y rotarla con plan controlado.

