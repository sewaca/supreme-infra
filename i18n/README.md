# i18n Keyset

This directory contains internationalization (i18n) translation keys used across the supreme-infra project.

## Structure

```
i18n/
  keyset.json  - Main translation file with all keys in Russian and English
```

## Format

The keyset uses a nested structure with language codes at the top level:

```json
{
  "ru": {
    "key.path": "Русский перевод"
  },
  "en": {
    "key.path": "English translation"
  }
}
```

## Key Naming Convention

Keys follow a hierarchical dot-notation pattern:

```
<domain>.<category>.<item>
```

### Examples:

- `orders.type.scholarship` - Order type translation
- `orders.field.startDate` - Order additional field label
- `references.status.ready` - Reference status translation
- `api.references.not_found` - API error message

## Domains

### `orders.*`

Order-related translations

- `orders.type.*` - Order types (dormitory, scholarship, education, general)
- `orders.field.*` - Additional field labels (comment, startDate, faculty, etc.)

### `references.*`

Reference-related translations

- `references.type.*` - Reference types (rdzd, workplace, military, etc.)
- `references.status.*` - Reference statuses (preparation, ready, cancelled, etc.)

### `applications.*`

Application-related translations

- `applications.type.*` - Application types (scholarship, dormitory)
- `applications.field.*` - Additional field labels (amount, currency, address, etc.)

### `api.*`

API response messages

- `api.references.*` - Reference API messages
- `api.student.*` - Student API messages
- `api.orders.*` - Order API messages (future)

## Usage

### Backend (FastAPI)

Backend services return **i18n keys** instead of translated strings. The frontend is responsible for translation.

**Example:**

```python
# ❌ Wrong - returning translated string
raise HTTPException(status_code=404, detail="Справка не найдена")

# ✅ Correct - returning i18n key
raise HTTPException(status_code=404, detail="api.references.not_found")
```

**Response example:**

```json
{
  "id": "88888888-8888-8888-8888-888888888888",
  "reference_type": "rdzd",
  "type_label": "references.type.rdzd",
  "status": "ready"
}
```

### Frontend (Next.js/React)

Frontend loads the keyset and translates keys based on user's language preference.

**Example:**

```typescript
import keyset from "@/i18n/keyset.json";

const t = (key: string, lang: "ru" | "en" = "ru") => {
  return keyset[lang][key] || key;
};

// Usage
const referenceType = t(reference.type_label); // "РЖД"
const status = t(`references.status.${reference.status}`); // "Готово"
```

## Adding New Keys

When adding new translatable content:

1. **Add to keyset.json** with both `ru` and `en` translations
2. **Use consistent naming** following the domain.category.item pattern
3. **Update backend** to return the key instead of hardcoded strings
4. **Update frontend** to translate the key

**Example:**

```json
{
  "ru": {
    "orders.action.download": "Скачать PDF"
  },
  "en": {
    "orders.action.download": "Download PDF"
  }
}
```

## Best Practices

1. **Always provide both languages** - Never add a key in only one language
2. **Use descriptive keys** - Key names should indicate where they're used
3. **Keep translations consistent** - Use the same translation for the same concept
4. **Avoid concatenation** - Don't build sentences from multiple keys
5. **Backend returns keys** - Never translate on the backend
6. **Frontend translates** - All translation happens on the frontend

## Migration

When migrating existing hardcoded strings:

1. Find all hardcoded Russian/English strings in backend
2. Create appropriate i18n keys in keyset.json
3. Replace hardcoded strings with keys
4. Update frontend to translate the keys
5. Test both languages

## Related Files

- `/infra/config/reference-types.json` - Reference type configuration (uses i18n keys)
- `/services/core-applications/app/routers/references.py` - References API (returns i18n keys)
- `/services/core-client-info/app/routers/profile.py` - Profile API (returns i18n keys)
- `/PDF_ARCHITECTURE.md` - PDF generation architecture (future: will use i18n for templates)
