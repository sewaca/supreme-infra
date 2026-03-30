# PDF Document Architecture

## Overview

This document describes the architecture for PDF document generation and storage for orders, references, and applications in the supreme-infra system.

### Alignment with platform file storage (source of truth)

Persistent object storage for **any** files (including PDFs) is standardized on **MinIO (S3-compatible)** and a **dedicated file service** (`core-files` / `core-storage`), not ad-hoc S3 clients inside domain services. Implementation details, Helm layout, boto3 settings, buckets, validation limits, and ingress live in:

[`docs/prompts/29-03-2026__21-00__s3-file-service-instructions.md`](../prompts/29-03-2026__21-00__s3-file-service-instructions.md)

**PDF-specific rule:** `core-applications` (or another domain service) **generates** PDFs and **persists** them by integrating with that stack—typically via `core-files` (HTTP) and/or presigned URLs—rather than owning its own long-lived MinIO credentials and upload logic. Chat attachments and generated PDFs can share the same MinIO cluster; **bucket and key prefix** should separate concerns (e.g. `messages-attachments` vs `pdfs` or `…/orders/…` keys), with **private buckets and short-lived presigned GET** for sensitive documents (see [Security Considerations](#security-considerations)).

**Infrastructure already in repo:** `infra/helmcharts/minio/` (ClusterIP API `:9000`, console `:9001`, 10Gi PVC, secrets via `MINIO_SECRET_KEY`). Local dev: `docker-compose.dev.yml` MinIO service; internal URL pattern: `http://minio.default.svc.cluster.local:9000`.

## Requirements

1. **Generate PDFs** for orders, references, and applications
2. **Store PDFs** in MinIO **through the same platform pattern as other files** (`core-files` + buckets/keys), with access control appropriate to document sensitivity
3. **Support both** generated and uploaded (signed) PDFs (uploaded binaries also flow through the file service / same storage model)
4. **Enable PDF download** via API endpoints (domain API returns bytes, redirects, or **presigned** URLs—consistent with how `core-files` exposes objects)
5. **Track PDF versions** for audit purposes (metadata in DB; blobs in object storage)
6. **Handle updates** when source data changes (re-upload new object, bump version, invalidate or replace URL reference)

## Architecture Options

### Option A: On-Demand Generation (MVP Recommendation)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /orders/{id}/pdf
       ▼
┌─────────────────────────────┐
│  core-applications API      │
│  ┌─────────────────────┐    │
│  │ 1. Fetch data       │    │
│  │    from DB          │    │
│  └─────────┬───────────┘    │
│            │                │
│            ▼                │
│  ┌─────────────────────┐    │
│  │ 2. Render HTML      │    │
│  │    template         │    │
│  │    (Jinja2)         │    │
│  └─────────┬───────────┘    │
│            │                │
│            ▼                │
│  ┌─────────────────────┐    │
│  │ 3. Convert to PDF   │    │
│  │    (WeasyPrint)     │    │
│  └─────────┬───────────┘    │
│            │                │
│            ▼                │
│  ┌─────────────────────┐    │
│  │ 4. Return bytes     │    │
│  │    with headers     │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

**Pros:**

- ✅ Simple implementation
- ✅ No storage costs
- ✅ Always up-to-date data
- ✅ No cache invalidation needed
- ✅ Easy to iterate on design

**Cons:**

- ❌ Higher CPU usage per request
- ❌ Slower response times (2-5 seconds)
- ❌ Cannot handle pre-signed documents
- ❌ No offline access

**Use Cases:**

- Development and testing
- Frequently changing documents
- Low-traffic scenarios

---

### Option B: Pre-Generated with MinIO Storage (Production Recommendation)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /orders/{id}/pdf
       ▼
┌─────────────────────────────────────┐
│  core-applications API              │
│  ┌─────────────────────┐            │
│  │ 1. Check pdf_url /  │            │
│  │    object ref in DB │            │
│  └─────────┬───────────┘            │
│            │                        │
│      ┌─────┴─────┐                  │
│      │           │                  │
│   Exists      Not Exists            │
│      │           │                  │
│      ▼           ▼                  │
│   ┌────────┐  ┌──────────────┐      │
│   │Return  │  │Generate PDF  │      │
│   │presign │  │bytes         │      │
│   │or      │  │              │      │
│   │redirect│  │Upload via    │      │
│   │        │  │core-files    │      │
│   │        │  │(S3 put)      │      │
│   │        │  │              │      │
│   │        │  │Save URL/key  │      │
│   │        │  │in DB         │      │
│   └────────┘  └──────────────┘      │
└──────────┬──────────────────────────┘
           │ server-side upload / presign
           ▼
    ┌──────────────┐      ┌──────────────┐
    │  core-files  │─────▶│    MinIO     │
    │  (optional   │ S3   │  (cluster)   │
    │   presign)   │ API  │              │
    └──────────────┘      └──────────────┘
```

**Pros:**

- ✅ Fast response times for clients once object exists (<100ms to issue redirect/presigned URL)
- ✅ Can handle signed documents (binary stored once; access via controlled URLs)
- ✅ Scalable to high traffic
- ✅ Can implement CDN caching in front of stable public URLs if policy allows
- ✅ Offline access possible
- ✅ Same operational model as message attachments and other files

**Cons:**

- ❌ Storage and backup planning for MinIO PVC / capacity
- ❌ More moving parts (domain service + `core-files` + MinIO)
- ❌ Need to handle updates/invalidation and versioning
- ❌ Requires S3-compatible storage (provided by MinIO in-cluster)

**Use Cases:**

- Production environment
- High-traffic scenarios
- Official signed documents
- Long-term archival

---

### Option C: Hybrid Approach (Recommended Final Solution)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /orders/{id}/pdf
       ▼
┌─────────────────────────────────────┐
│  core-applications API              │
│  ┌─────────────────────┐            │
│  │ Check pdf_url &     │            │
│  │ document type       │            │
│  └─────────┬───────────┘            │
│            │                        │
│      ┌─────┴─────────┐              │
│      │               │              │
│   Official       Temporary          │
│   Document       Document           │
│      │               │              │
│      ▼               ▼              │
│  ┌────────┐    ┌──────────┐         │
│  │ MinIO  │    │Generate  │         │
│  │via     │    │On-Demand │         │
│  │core-   │    │          │         │
│  │files   │    │          │         │
│  └────────┘    └──────────┘         │
└─────────────────────────────────────┘
```

**Decision Logic:**

- **Official documents** (signed orders, archived references) → Pre-generate & store in MinIO via `core-files` (or equivalent internal upload/presign flow)
- **Temporary documents** (draft orders, pending references) → Generate on-demand (optional: promote to stored object after first generation)
- **Frequently accessed** → Persist in object storage after first generation to reduce CPU

---

## Database Schema

### Current Schema

```sql
-- Orders
CREATE TABLE "order" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR NOT NULL,
    number VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    date DATE NOT NULL,
    additional_fields JSONB,
    pdf_url VARCHAR,  -- Existing: prefer URL or stable key aligned with core-files / MinIO object identity
    actions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- References
CREATE TABLE reference_order (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    reference_type VARCHAR NOT NULL,
    type_label VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'preparation',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pickup_point_id VARCHAR,
    virtual_only BOOLEAN DEFAULT FALSE,
    storage_until TIMESTAMP WITH TIME ZONE,
    pdf_url VARCHAR  -- Existing: same semantics as orders
);

-- Applications
CREATE TABLE user_application (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    application_type VARCHAR NOT NULL,
    application_number VARCHAR NOT NULL,
    additional_fields JSONB,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notifications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Proposed Enhancements (Future)

```sql
-- Add PDF tracking fields
ALTER TABLE "order" ADD COLUMN pdf_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "order" ADD COLUMN pdf_version INTEGER DEFAULT 1;
ALTER TABLE "order" ADD COLUMN pdf_signed BOOLEAN DEFAULT FALSE;

ALTER TABLE reference_order ADD COLUMN pdf_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reference_order ADD COLUMN pdf_version INTEGER DEFAULT 1;

ALTER TABLE user_application ADD COLUMN pdf_url VARCHAR;
ALTER TABLE user_application ADD COLUMN pdf_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_application ADD COLUMN pdf_version INTEGER DEFAULT 1;

-- Optional: PDF generation log table
CREATE TABLE pdf_generation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR NOT NULL,  -- 'order', 'reference', 'application'
    entity_id UUID NOT NULL,
    version INTEGER NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID,  -- user_id or 'system'
    storage_path VARCHAR,
    file_size_bytes INTEGER,
    generation_time_ms INTEGER
);
```

---

## Implementation Plan

### Phase 1: MVP (On-Demand Generation)

**Goal:** Get basic PDF generation working quickly

**Stack:**

- **WeasyPrint** - HTML to PDF converter (supports CSS3, modern layouts)
- **Jinja2** - Template engine (already used by FastAPI)
- **Python-Multipart** - File handling (already installed)

**Steps:**

1. **Create PDF Generator Service**

   ```python
   # services/core-applications/app/services/pdf_generator.py
   from weasyprint import HTML
   from jinja2 import Environment, FileSystemLoader

   class PDFGenerator:
       def __init__(self):
           self.env = Environment(
               loader=FileSystemLoader('app/templates/pdf')
           )

       def generate_order_pdf(self, order: Order) -> bytes:
           template = self.env.get_template('order.html')
           html_content = template.render(order=order)
           pdf_bytes = HTML(string=html_content).write_pdf()
           return pdf_bytes

       def generate_reference_pdf(self, reference: ReferenceOrder) -> bytes:
           template = self.env.get_template('reference.html')
           html_content = template.render(reference=reference)
           pdf_bytes = HTML(string=html_content).write_pdf()
           return pdf_bytes
   ```

2. **Create HTML Templates**

   ```html
   <!-- app/templates/pdf/order.html -->
   <!DOCTYPE html>
   <html>
     <head>
       <meta charset="UTF-8" />
       <style>
         @page {
           size: A4;
           margin: 2cm;
         }
         body {
           font-family: "DejaVu Sans", Arial, sans-serif;
         }
         .header {
           text-align: center;
           margin-bottom: 2cm;
         }
         .content {
           margin: 1cm 0;
         }
         .footer {
           position: fixed;
           bottom: 0;
         }
       </style>
     </head>
     <body>
       <div class="header">
         <h1>Приказ №{{ order.number }}</h1>
         <p>{{ order.title }}</p>
         <p>от {{ order.date }}</p>
       </div>
       <div class="content">
         {% for key, value in order.additional_fields.items() %}
         <p><strong>{{ key }}:</strong> {{ value }}</p>
         {% endfor %}
       </div>
     </body>
   </html>
   ```

3. **Update Endpoints**

   ```python
   from fastapi.responses import Response
   from app.services.pdf_generator import PDFGenerator

   pdf_generator = PDFGenerator()

   @router.get("/{order_id}/pdf")
   async def get_order_pdf(order_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
       order = await get_order_by_id(order_id, user_id, db)
       if not order:
           raise HTTPException(404, "api.orders.not_found")

       pdf_bytes = pdf_generator.generate_order_pdf(order)

       return Response(
           content=pdf_bytes,
           media_type="application/pdf",
           headers={
               "Content-Disposition": f'attachment; filename="order-{order.number}.pdf"'
           }
       )
   ```

### Phase 2: Storage Integration (MinIO via `core-files`)

**Goal:** Add persistent storage for official documents using the **same** MinIO + service boundaries as the rest of the platform.

**Stack (see file-service instructions):**

- **MinIO** — already charted at `infra/helmcharts/minio/` (not AWS S3 unless you add it later)
- **`core-files`** — owns boto3/S3 client, bucket ensure-on-startup, validation, optional thumbnails (not required for PDF)
- **`core-applications`** — WeasyPrint/Jinja2 only; talks to `core-files` over HTTP (or consumes presigned URLs), **does not** embed a second copy of S3 credentials for routine uploads

**Steps:**

1. **MinIO in cluster** — Deploy/operate per [`docs/prompts/29-03-2026__21-00__s3-file-service-instructions.md`](../prompts/29-03-2026__21-00__s3-file-service-instructions.md). Bucket(s): either a dedicated bucket for PDFs (e.g. `pdfs`) or a separate key prefix in an existing bucket—choose based on lifecycle and IAM-style policies you apply at the bucket level.

2. **Extend or use `core-files` for server-side PDF bytes** — The public prompt focuses on **multipart upload from clients** (`POST /core-files/upload`). For generated PDFs, add one of:
   - **Internal/trusted upload** from `core-applications` (service account / mTLS / cluster-only route): accept `application/pdf` bytes + metadata (`entity_type`, `entity_id`, `version`) and return the same shape as user uploads (`file_url`, `mime_type`, `file_size`, …).
   - **Presigned PUT** issued by `core-files`, then `core-applications` `PUT`s the PDF to MinIO—still no boto3 in the domain service.

   boto3 configuration in `core-files` should match the platform pattern (`Config(signature_version="s3v4")`, `endpoint_url`, region `us-east-1` for MinIO compatibility)—see the instructions doc.

3. **Persist reference in domain DB** — Store whatever the file service returns as the stable handle (`file_url` and/or object key + bucket). Prefer **presigned GET** (or redirect) at download time for private buckets rather than handing clients long-lived public URLs for sensitive PDFs. The messages use-case may use a more public URL pattern; **orders/references/applications should default to private object + short TTL presign**.

4. **Update endpoints (hybrid) — illustrative flow**

   ```python
   @router.get("/{order_id}/pdf")
   async def get_order_pdf(order_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
       order = await get_order_by_id(order_id, user_id, db)

       if order.pdf_url:
           # Resolve via core-files: presigned GET or redirect (implementation detail of file API)
           signed_url = await core_files_client.presign_get(order.pdf_url)
           return RedirectResponse(url=signed_url)

       pdf_bytes = pdf_generator.generate_order_pdf(order)

       if order.type in ["scholarship", "education"]:
           meta = await core_files_client.upload_pdf(
               content=pdf_bytes,
               key_hint=f"orders/{order.id}.pdf",
               mime_type="application/pdf",
           )
           order.pdf_url = meta["file_url"]
           order.pdf_generated_at = datetime.now()
           await db.commit()

       return Response(content=pdf_bytes, media_type="application/pdf")
   ```

   `core_files_client` is a placeholder for the real HTTP client and API surface once `core-files` defines internal vs public upload routes.

### Phase 3: Advanced Features

1. **Digital Signatures** - Integrate with electronic signature service
2. **Watermarks** - Add university logo and security watermarks
3. **QR Codes** - Add verification QR codes to documents
4. **Batch Generation** - Generate multiple PDFs in background tasks
5. **PDF Compression** - Optimize file sizes
6. **Version Control** - Track document changes over time

---

## Security Considerations

1. **Access Control**
   - Verify `user_id` matches document owner
   - Use signed URLs with expiration (1 hour default)
   - Log all PDF access attempts

2. **Data Privacy**
   - Don't expose sensitive data in URLs
   - Use HTTPS for all PDF transfers
   - Implement rate limiting on PDF endpoints

3. **Storage Security**
   - Encrypt PDFs at rest (MinIO at-rest encryption / underlying storage class as deployed)
   - **No duplicate secrets in domain services:** MinIO credentials live with `core-files` (e.g. `S3_ACCESS_KEY` / `S3_SECRET_KEY` from the cluster secrets store, mapped from `MINIO_*` per the file-service instructions)
   - Bucket policy: default to **no public read** for PDF buckets; use presigned GET with short TTL. Only open read policies where the product explicitly requires it (similar trade-off as optional public-read for attachments in the instructions doc)

---

## Performance Optimization

1. **Caching Strategy**

   ```
   - Cache generated PDFs in Redis for 1 hour
   - Invalidate cache when source data changes
   - Use ETag headers for browser caching
   ```

2. **Async Generation**

   ```python
   # For large documents, use background tasks
   from fastapi import BackgroundTasks

   @router.post("/{order_id}/generate-pdf")
   async def generate_pdf_async(
       order_id: UUID,
       background_tasks: BackgroundTasks,
       db: AsyncSession = Depends(get_db)
   ):
       background_tasks.add_task(generate_and_upload_pdf, order_id)
       return {"status": "generating", "message": "PDF generation started"}
   ```

3. **CDN Integration**
   - Serve PDFs through CloudFlare or similar CDN
   - Set appropriate cache headers
   - Use edge locations for faster delivery

---

## Monitoring & Metrics

Track the following metrics:

1. **Generation Metrics**
   - PDF generation time (p50, p95, p99)
   - Success/failure rate
   - File sizes

2. **Storage Metrics**
   - Total storage used (MinIO PVC / object count)
   - Number of PDFs stored
   - S3 API call count (from `core-files` and MinIO metrics)

3. **Access Metrics**
   - PDF download count
   - Cache hit rate
   - Error rate (404, 500)

---

## Cost Estimation

### MVP (On-Demand Only)

- **Compute:** ~$0 (uses existing pods)
- **Storage:** $0
- **Total:** ~$0/month

### Production (MinIO in-cluster + `core-files`)

- **Object storage:** primarily **PVC capacity** and backup/DR for the MinIO volume (no per-GB AWS S3 line item unless you later use external S3)
- **Compute:** `core-files` pods + existing `core-applications` PDF generation CPU
- **Egress:** same as today for whatever path serves downloads (ingress → client)

If you later move blobs to **hosted S3**, reuse the same `core-files` abstraction and revisit per-request/transfer pricing.

---

## Migration Path

1. **Week 1:** Implement MVP with on-demand generation (no object storage dependency)
2. **Week 2:** Ensure MinIO + `core-files` on staging per the file-service instructions; add server-side PDF upload path (internal API or presigned PUT)
3. **Week 3:** Implement hybrid approach in `core-applications` (DB `pdf_url` + presigned GET), measure latency and CPU
4. **Week 4:** Roll out to production, monitor metrics
5. **Week 5+:** Add advanced features based on usage patterns

---

## Decision: MVP Approach

**For initial implementation, we will use Option A (On-Demand Generation):**

**Rationale:**

- ✅ Fastest time to market
- ✅ No dependency on `core-files` upload APIs being ready
- ✅ Easy to iterate on design
- ✅ Sufficient for current traffic levels
- ✅ Can upgrade to Option B/C later: persistence goes through **MinIO + `core-files`**, not a one-off S3 client in `core-applications`

**Next Steps:**

1. Add `weasyprint` to `pyproject.toml`
2. Create PDF templates for orders, references, applications
3. Implement PDF generator service
4. Update endpoints to return PDF bytes
5. Test with real data
6. When persistent PDFs are needed: follow [`docs/prompts/29-03-2026__21-00__s3-file-service-instructions.md`](../prompts/29-03-2026__21-00__s3-file-service-instructions.md) and Phase 2 in this document (hybrid + presigned access)
