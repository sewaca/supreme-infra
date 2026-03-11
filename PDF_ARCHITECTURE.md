# PDF Document Architecture

## Overview

This document describes the architecture for PDF document generation and storage for orders, references, and applications in the supreme-infra system.

## Requirements

1. **Generate PDFs** for orders, references, and applications
2. **Store PDFs** securely with access control
3. **Support both** generated and uploaded (signed) PDFs
4. **Enable PDF download** via API endpoints
5. **Track PDF versions** for audit purposes
6. **Handle updates** when source data changes

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
│            │                 │
│            ▼                 │
│  ┌─────────────────────┐    │
│  │ 2. Render HTML      │    │
│  │    template         │    │
│  │    (Jinja2)         │    │
│  └─────────┬───────────┘    │
│            │                 │
│            ▼                 │
│  ┌─────────────────────┐    │
│  │ 3. Convert to PDF   │    │
│  │    (WeasyPrint)     │    │
│  └─────────┬───────────┘    │
│            │                 │
│            ▼                 │
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

### Option B: Pre-Generated with S3 Storage (Production Recommendation)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /orders/{id}/pdf
       ▼
┌─────────────────────────────────────┐
│  core-applications API              │
│  ┌─────────────────────┐            │
│  │ 1. Check pdf_url    │            │
│  │    in database      │            │
│  └─────────┬───────────┘            │
│            │                         │
│      ┌─────┴─────┐                  │
│      │           │                  │
│   Exists      Not Exists            │
│      │           │                  │
│      ▼           ▼                  │
│  ┌────────┐  ┌──────────────┐      │
│  │Return  │  │Generate PDF  │      │
│  │Signed  │  │              │      │
│  │URL     │  │Upload to S3  │      │
│  │        │  │              │      │
│  │        │  │Save pdf_url  │      │
│  │        │  │              │      │
│  │        │  │Return URL    │      │
│  └────────┘  └──────────────┘      │
└──────────┬──────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │   MinIO/S3   │
    │   Storage    │
    │              │
    │ /pdfs/       │
    │  orders/     │
    │  references/ │
    │  applications│
    └──────────────┘
```

**Pros:**

- ✅ Fast response times (<100ms)
- ✅ Can handle signed documents
- ✅ Scalable to high traffic
- ✅ Can implement CDN caching
- ✅ Offline access possible

**Cons:**

- ❌ Storage costs
- ❌ More complex implementation
- ❌ Need to handle updates/invalidation
- ❌ Requires S3-compatible storage

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
│            │                         │
│      ┌─────┴─────────┐              │
│      │               │              │
│   Official       Temporary          │
│   Document       Document           │
│      │               │              │
│      ▼               ▼              │
│  ┌────────┐    ┌──────────┐        │
│  │ S3     │    │Generate  │        │
│  │Storage │    │On-Demand │        │
│  └────────┘    └──────────┘        │
└─────────────────────────────────────┘
```

**Decision Logic:**

- **Official documents** (signed orders, archived references) → Pre-generate & store in S3
- **Temporary documents** (draft orders, pending references) → Generate on-demand
- **Frequently accessed** → Cache in S3 after first generation

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
    pdf_url VARCHAR,  -- Existing
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
    pdf_url VARCHAR  -- Existing
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

### Phase 2: Storage Integration (S3)

**Goal:** Add persistent storage for official documents

**Stack:**

- **MinIO** - S3-compatible object storage (can run in k8s)
- **boto3** - AWS S3 client for Python

**Steps:**

1. **Deploy MinIO to Kubernetes**

   ```yaml
   # infra/helmcharts/minio/values.yaml
   mode: standalone
   persistence:
     enabled: true
     size: 50Gi
   buckets:
     - name: pdfs
       policy: none
       purge: false
   ```

2. **Create Storage Service**

   ```python
   # services/core-applications/app/services/storage.py
   import boto3
   from app.config import settings

   class StorageService:
       def __init__(self):
           self.s3 = boto3.client(
               's3',
               endpoint_url=settings.s3_endpoint,
               aws_access_key_id=settings.s3_access_key,
               aws_secret_access_key=settings.s3_secret_key
           )
           self.bucket = settings.s3_bucket_name

       def upload_pdf(self, file_bytes: bytes, path: str) -> str:
           self.s3.put_object(
               Bucket=self.bucket,
               Key=path,
               Body=file_bytes,
               ContentType='application/pdf'
           )
           return f"s3://{self.bucket}/{path}"

       def get_signed_url(self, path: str, expires_in: int = 3600) -> str:
           return self.s3.generate_presigned_url(
               'get_object',
               Params={'Bucket': self.bucket, 'Key': path},
               ExpiresIn=expires_in
           )
   ```

3. **Update Endpoints for Hybrid Approach**

   ```python
   @router.get("/{order_id}/pdf")
   async def get_order_pdf(order_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
       order = await get_order_by_id(order_id, user_id, db)

       # Check if PDF exists in storage
       if order.pdf_url and order.pdf_url.startswith('s3://'):
           signed_url = storage_service.get_signed_url(order.pdf_url)
           return RedirectResponse(url=signed_url)

       # Generate on-demand
       pdf_bytes = pdf_generator.generate_order_pdf(order)

       # For official documents, save to S3
       if order.type in ['scholarship', 'education']:
           path = f"orders/{order.id}.pdf"
           order.pdf_url = storage_service.upload_pdf(pdf_bytes, path)
           order.pdf_generated_at = datetime.now()
           await db.commit()

       return Response(content=pdf_bytes, media_type="application/pdf")
   ```

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
   - Encrypt PDFs at rest in S3
   - Use IAM roles for S3 access (no hardcoded keys)
   - Implement bucket policies to prevent public access

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
   - Total storage used
   - Number of PDFs stored
   - S3 API call count

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

### Production (S3 Storage)

- **Storage:** 50GB × $0.023/GB = ~$1.15/month
- **Requests:** 100k requests × $0.0004/1k = ~$0.04/month
- **Data Transfer:** 50GB × $0.09/GB = ~$4.50/month (if external)
- **Total:** ~$5-10/month

---

## Migration Path

1. **Week 1:** Implement MVP with on-demand generation
2. **Week 2:** Deploy MinIO to staging, test S3 integration
3. **Week 3:** Implement hybrid approach, A/B test performance
4. **Week 4:** Roll out to production, monitor metrics
5. **Week 5+:** Add advanced features based on usage patterns

---

## Decision: MVP Approach

**For initial implementation, we will use Option A (On-Demand Generation):**

**Rationale:**

- ✅ Fastest time to market
- ✅ No infrastructure dependencies
- ✅ Easy to iterate on design
- ✅ Sufficient for current traffic levels
- ✅ Can upgrade to hybrid later without breaking changes

**Next Steps:**

1. Add `weasyprint` to `pyproject.toml`
2. Create PDF templates for orders, references, applications
3. Implement PDF generator service
4. Update endpoints to return PDF bytes
5. Test with real data
6. Monitor performance and decide when to add S3 storage
