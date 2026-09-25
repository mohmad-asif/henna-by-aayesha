# Henna by Aayesha

Production-ready web application for **Henna by Aayesha**, an exclusive bespoke bridal and organic mehndi artist in Bangalore / Bengaluru.

---

## Multi-Provider AI Architecture

The website features an enterprise-grade, provider-agnostic AI assistant called **AI Design Assistant** ("✨ Ask Aayesha AI") that helps visitors explore mehndi styles, bridal packages, and booking guidance strictly tailored for Bangalore.

### 1. AI Provider Abstraction
Rather than hardcoding any specific provider (such as Gemini), all AI interactions route through a unified abstraction layer (`AIProvider` interface) located in `src/lib/ai/types.ts`:

- `generateText(params)`: Executes grounded completions with temperature, max tokens, system prompt, and signal timeouts.
- `testConnection(apiKey, model)`: Tests API connectivity and computes round-trip latency in milliseconds.

The architecture decouples the frontend user interface from the underlying model providers, allowing new providers to be added seamlessly without modifying chat or application components.

### 2. Supported Provider Adapters
Provider adapters reside in `src/lib/ai/providers/` and use official REST APIs with zero runtime bloat:

1. **Google Gemini** (`gemini.ts`): Google Generative AI REST API (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`).
2. **Groq** (`groq.ts`): High-speed OpenAI-compatible Chat API (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`).
3. **OpenRouter** (`openrouter.ts`): Multi-model gateway (`meta-llama/llama-3.2-3b-instruct:free`, `google/gemini-flash-1.5`, `mistralai/mistral-7b-instruct:free`).
4. **Mistral AI** (`mistral.ts`): Mistral official API (`mistral-small-latest`, `mistral-medium-latest`, `open-mistral-7b`).
5. **Cohere** (`cohere.ts`): Cohere v2 Chat API (`command-r-plus-08-2024`, `command-r-08-2024`).
6. **Cloudflare Workers AI** (`cloudflare.ts`): Cloudflare AI Gateway/REST API (`@cf/meta/llama-3.1-8b-instruct`).

*Note: Model availability, pricing, and rate limits vary per provider and tier. The system treats all providers as configurable external integrations.*

### 3. Server-Side Security & Encryption
- **Zero API Key Leaks**: Provider API keys are never included in frontend JavaScript bundles, HTML documents, React client components, or `NEXT_PUBLIC_*` environment variables.
- **Server-Side AES-256-GCM Encryption**: All provider API keys entered in the Admin Panel are encrypted at rest using Node's native `crypto` module with AES-256-GCM authenticated encryption (`src/lib/ai/encryption.ts`).
- **Secret Key Storage**: Encryption uses the server-side environment secret `AI_SETTINGS_ENCRYPTION_KEY`.
- **Database Row Level Security (RLS)**: The `ai_providers` table has RLS enabled with access restricted to authenticated administrators only. Public unauthenticated users cannot read or inspect keys.
- **Masked in Admin UI**: Admin endpoints return only a masked preview (e.g. `AIza...••••89x`) and boolean `has_api_key: true`. Decrypted keys are never transmitted over the network to the browser.

### 4. Priority-Based Routing & Automatic Fallback
The Provider Router (`src/lib/ai/router.ts`) executes controlled failover:
1. Loads all enabled providers from Supabase, sorted by **Priority** (Rank 1 = highest priority).
2. Attempts the highest-priority enabled provider with a per-provider timeout (12 seconds via `AbortController`).
3. If a provider fails due to rate limits (HTTP 429), timeouts, or vendor outages:
   - The error is logged on the server.
   - The provider health status is recorded asynchronously.
   - The router immediately fails over to the next priority provider.
4. If all configured providers fail:
   - The client receives a friendly fallback: *"Sorry, I'm having trouble responding right now. You can contact Aayesha directly on WhatsApp for help with your mehndi requirements."*
   - A direct WhatsApp booking CTA button is presented with dynamic pre-filled text.
   - Internal stack traces and vendor error codes are never exposed to visitors.

---

## RAG Architecture (Retrieval-Augmented Generation)

The website integrates a knowledge-aware RAG pipeline powered by **Supabase PostgreSQL** and **pgvector**. Instead of relying solely on general LLM training data, the assistant retrieves verified records from the studio's catalog, services, FAQs, and Bangalore service boundaries before generating answers.

### 1. Architectural Pipeline

```
User Query
    │
    ▼
Next.js AI API (/api/ai/chat)
    │
    ▼
Embedding Router (src/lib/ai/embeddings/router.ts)
    │
    ▼
Embedding Provider (Google Gemini `text-embedding-004`)
    │ (768-dimensional vector)
    ▼
Supabase pgvector (match_knowledge_documents RPC)
    │ (Cosine similarity search >= 0.38)
    ▼
Relevant Knowledge (Designs, Services, FAQs, Policies)
    │
    ▼
AI Provider Router (Gemini / Groq / OpenRouter / Mistral / Cohere)
    │
    ▼
Grounded Response + Matched Sources (Prompt 3 Compatibility)
```

### 2. Separation of Chat Provider vs Embedding Provider
The system decouples the chat generator from the embedding model:
- **Chat**: Handled by any enabled provider (e.g. Groq `llama-3.3-70b-versatile` for high-speed completions).
- **Embeddings**: Handled independently by a dedicated embedding provider (e.g. Google Gemini `text-embedding-004`).
- **Independent Configuration**: In Admin Panel → AI Settings, each can be configured with independent models, credentials, and connection diagnostics.

### 3. Exact Vector Dimensionality & pgvector Storage
- **Selected Model**: Google Gemini `text-embedding-004`.
- **Dimensionality**: **768 dimensions** stored in Supabase table `knowledge_documents` as `embedding vector(768)`.
- **HNSW Index**: `knowledge_documents_embedding_hnsw_idx` using `hnsw (embedding vector_cosine_ops)` for sub-millisecond similarity search.
- **Model Migration Safety**: When the embedding provider or model is modified, the system warns the administrator: *"Changing the embedding model requires re-indexing the knowledge base"*, preventing incompatible vector comparisons.

### 4. Knowledge Sources & Ingestion
- **Mehndi Designs**: Titles, categories, styles, complexity, coverage, duration, and occasion keywords.
- **Services & Packages**: Titles, subtitles, features, travel details, and verified prices.
- **FAQs**: Official answers regarding 100% natural organic Sojat henna, oxidation time (48h), aftercare (cloves, mustard oil, no soap), and Bangalore booking.
- **Business Policies**: Exclusivity to Bangalore / Bengaluru, strictly WhatsApp-driven bookings.

### 5. Cost Control & Free-Tier Suitability
- **Change Detection**: Computes a SHA-256 `content_hash` for each document. If the content has not changed, embedding generation is completely skipped.
- **Batch Embeddings**: Uses Google `batchEmbedContents` (up to 15 items per batch) to minimize HTTP roundtrips and avoid rate limits.
- **Top-K Limitation**: Limits retrieval to the top 4-5 most relevant documents, keeping prompt context compact, fast, and cost-efficient.

---

## Admin Panel AI Management

Administrators can manage AI settings at `/admin/ai-settings` across three dedicated tabs:
1. **Chat Providers**: Configure priority ranks (#1 to #6), models, enable/disable toggles, encrypted API keys, and live connection tests.
2. **Embedding Configuration**: Select embedding provider (Gemini, Cohere, Mistral, OpenRouter), inspect vector dimensions (768d), manage dedicated keys, and test connection.
3. **Knowledge Base**: View total documents, indexed status, pending items, trigger one-click **Sync New Content** or **Re-index Knowledge Base**.

---

## AI Mehndi Design Recommendation Architecture

The AI Design Assistant is equipped with a hybrid recommendation engine that translates natural language inquiries into structured design preferences, queries the Supabase database using hybrid search (metadata filtering + vector similarity), strictly validates candidate designs server-side, and renders rich interactive design recommendation cards directly within the chat interface.

```
Visitor Message (English / Hindi / Hinglish)
                     │
                     ▼
  [1] Preference Extraction & Memory
      • Occasion, Style, Coverage, Complexity, Keywords, Body Part
      • Multi-turn refinement & override detection
                     │
                     ▼
  [2] Hybrid Search Engine (recommendDesigns)
      • Metadata matching on active catalog attributes
      • Semantic vector similarity via Supabase pgvector
      • Transparent multi-factor ranking
                     │
                     ▼
  [3] Server-Side ID Validation
      • Strict check against active Supabase records
      • Complete prevention of hallucinated IDs or fake designs
                     │
                     ▼
  [4] AI Grounding & Conversational Output
      • Warm reply in user's detected language
      • Grounded explanations ("Why this matches")
                     │
                     ▼
  [5] Interactive Chat Cards
      • View Design (`/mehndi-designs/[slug]`)
      • Ask About This Design (WhatsApp)
      • Book This Design (WhatsApp)
```

### 1. Multi-Lingual Preference Extraction (`src/lib/ai/design/preferences.ts`)
- **Languages Supported**: Fluent in English, Hindi (Devanagari), and Hinglish (Romanized Hindi).
  - *English*: "Show me a simple floral design for engagement."
  - *Hindi*: "मुझे एंगेजमेंट के लिए सिंपल फ्लोरल डिजाइन चाहिए।"
  - *Hinglish*: "Mujhe engagement ke liye simple floral front hand design chahiye."
- **Extracted Attributes**:
  - `occasion`: Bridal, Wedding, Engagement, Sangeet, Festival, Party, etc.
  - `style`: Arabic, Traditional/Rajasthani, Floral, Mandala, Minimal, Indo-Western, etc.
  - `coverage`: Front hand, Back hand, Both hands, Full hand, Wrist, Feet, etc.
  - `complexity`: Simple, Minimal, Medium, Heavy, Bridal.
  - `keywords`: Lotus, Peacock, Vines, Negative space, Jaal, Anklet, etc.
  - `bodyPart`: Hands, Palms, Wrist, Feet, Ankles.
  - `language`: `en`, `hi`, `hinglish`.
- **Conversational Memory**: Retains preferences across turns within the same chat session (e.g. asking for "engagement design" followed by "simple one" combines engagement + simple).
- **Modification & Override Handling**: When a visitor changes their requirement (e.g., *"Actually mujhe Arabic nahi, traditional design chahiye"*), the negation detector overrides the earlier style with the updated choice.

### 2. Hybrid Recommendation Strategy (`src/lib/ai/design/recommendation.ts`)
- **Metadata Filtering**: Checks category, occasion, coverage, and complexity against active database records.
- **Semantic Vector Search**: Calls `searchDesigns(query)` to find semantically matching knowledge records via pgvector.
- **Multi-Factor Scoring**:
  $$\text{Score} = \text{Metadata Score} + (\text{Vector Similarity} \times 50) + \text{Keyword Score}$$
- **Relevance Threshold**: Only candidates with positive matching criteria are considered; returns a practical limit (default 3, up to 5).
- **No-Match Safety**: If no candidate matches (e.g. asking for gothic or fictional designs), the system returns 0 fake designs, explains politely in the visitor's language that an exact match was not found in Aayesha's catalog, and provides a WhatsApp CTA for bespoke custom design inquiries.

### 3. Server-Side Design ID Validation (Anti-Hallucination)
- The database (`public.mehndi_designs` with `active = true`) is the **sole source of truth**.
- Every design suggested by the AI model is validated against real active database records before rendering.
- Any fabricated, non-existent, or unpublished design ID is discarded immediately.
- URLs and slugs are derived strictly from database records (`/mehndi-designs/[slug]`), never from AI-generated strings.

### 4. Dynamic WhatsApp Flow
- **Never Hardcoded**: All WhatsApp links use the dynamic number and configuration stored in `site_settings`.
- **Pre-filled Actions**:
  - **Ask About This Design**: Opens WhatsApp with `Hi Aayesha, I found this mehndi design on your website and would like to know more about it.\n\nDesign: [Real DB Title]`.
  - **Book This Design**: Opens WhatsApp with `Hi Aayesha, I would like to book this mehndi design.\n\nDesign: [Real DB Title]\n\nPlease let me know the availability and details.`.
- **Location Guardrails**: Enforces that services are provided strictly in **Bangalore / Bengaluru**. Queries for outside cities (e.g. Mumbai) are politely informed of the Bangalore service boundary.

### 5. Admin Recommendation Settings (`/admin/ai-settings`)
- Dedicated **✨ Recommendations** tab allows administrators to:
  - Toggle AI Design Recommendations on/off.
  - Configure maximum recommendations per inquiry (1 to 5).
  - Adjust minimum cosine similarity threshold (0.20 to 0.70).
  - Enable/disable semantic vector search or metadata filtering independently.

---

## Production Security & Resilience Hardening

The application is hardened against web vulnerabilities, LLM-specific exploits, and denial-of-service risks:

### 1. Route Protection & Proxy (`src/proxy.ts`)
- Utilizes the Next.js 16 **Proxy** architecture to intercept requests before route execution.
- Verifies authenticated Supabase SSR user sessions for all `/admin` routes.
- Unauthenticated requests to `/admin` are immediately redirected to `/admin/login`.
- Unauthenticated API calls to `/api/admin/*` are immediately rejected with HTTP `401 Unauthorized` JSON responses.

### 2. HTTP Security Headers (`next.config.ts`)
Configured enterprise-grade security headers applied across all application responses:
- `Content-Security-Policy`: Strict CSP permitting only essential scripts, fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), Supabase storage media (`*.supabase.co`), and inline styling necessary for modern CSS animations.
- `Strict-Transport-Security`: Enforces HTTPS with `max-age=63072000; includeSubDomains; preload`.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing attacks.
- `X-Frame-Options: DENY`: Prevents clickjacking and framing.
- `X-XSS-Protection: 1; mode=block`: Legacy browser cross-site scripting filter.
- `Referrer-Policy: strict-origin-when-cross-origin`: Restricts sensitive referrer leakage.
- `Permissions-Policy`: Restricts camera, microphone, and geolocation access.

### 3. Server-Only Secrets & Key Encryption
- Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `AI_SETTINGS_ENCRYPTION_KEY`) are protected using the `server-only` package, preventing accidental importation into client-side components.
- Provider API keys stored in Supabase are encrypted at rest with **AES-256-GCM** authenticated encryption (`src/lib/ai/encryption.ts`).
- Public and client bundles contain zero provider API keys or administrative secrets.

### 4. Rate Limiting & Payload Defense (`src/app/api/ai/chat/route.ts`)
- **Sliding Window IP Rate Limiting**: Backed by a process-wide `globalThis` store allowing 20 requests per 10-minute window per IP, returning HTTP `429 Too Many Requests` with dynamic `Retry-After` headers.
- **Payload Size Enforcement**: Enforces a strict 32KB payload cap on chat requests; oversize bodies are immediately rejected with HTTP `413 Payload Too Large`.
- **Input Validation**: Individual user messages are capped at 1,000 characters; conversation history is truncated to the 50 most recent turns to eliminate token consumption abuse.

### 5. Anti-Prompt-Injection Guardrails (`src/lib/ai/prompts.ts`)
- Strict system prompt guardrails instruct the model never to reveal internal instructions, API keys, system tokens, or admin credentials regardless of user phrasing.
- The assistant is forbidden from fabricating prices, quoting unofficial rates, or guaranteeing calendar dates; bookings and bespoke pricing are strictly routed to WhatsApp.
- RAG document contents are treated strictly as untrusted data, preventing indirect injection attacks.

### 6. Resilience & Safe Fallbacks
- **Slug Sanitization (`src/lib/supabase/data.ts`)**: Design slugs are sanitized via alphanumeric regex (`/^[a-z0-9_-]+$/i`). Inactive/unpublished designs trigger standard Next.js 404 responses.
- **Dynamic Contact Fallbacks**: If WhatsApp phone numbers or email addresses are unconfigured in `site_settings`, action buttons and CTAs gracefully hide or link to general contact forms rather than using dummy or broken numbers.
- **Vector Dimension Guard (`src/lib/ai/embeddings/retrieval.ts`)**: Validates vector dimensions before executing pgvector RPCs, preventing runtime database errors if a 1024-dimension provider is queried against the 768-dimension schema.

---

## Database Schema & Supabase Setup

The application uses Supabase PostgreSQL with `pgvector` for semantic document retrieval and relational tables for website content.

### Database Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### Core Database Tables
| Table | Description | RLS Policy |
| :--- | :--- | :--- |
| `site_settings` | Dynamic site configuration, branding, WhatsApp numbers, email | Public Read, Admin Write |
| `services` | Bridal, Sangeet, and Guest mehndi packages and pricing | Public Read, Admin Write |
| `mehndi_designs` | Design catalog with styles, coverage, complexity, and slugs | Public Read (Active only), Admin All |
| `gallery_images` | Portfolio and gallery photos with category tags | Public Read, Admin Write |
| `testimonials` | Client reviews, bride names, and ratings | Public Read, Admin Write |
| `ai_providers` | Multi-provider configurations with encrypted API keys | Admin Only |
| `embedding_settings` | Embedding provider, model name, and dimensions | Admin Only |
| `knowledge_documents` | Chunked documents with 768d vector embeddings & HNSW index | Admin / Server-Side Only |
| `recommendation_settings` | Recommendation thresholds, max cards, and vector search toggles | Admin / Server-Side Only |

### Vector Similarity Search RPC
The similarity search function `match_knowledge_documents` executes sub-millisecond cosine distance search:
```sql
CREATE OR REPLACE FUNCTION match_knowledge_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.content,
    kd.metadata,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM knowledge_documents kd
  WHERE 1 - (kd.embedding <=> query_embedding) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Canonical Database Initialization (`schema.sql`)
The complete database is fully reproducible from scratch using a single file:
- Execute `schema.sql` (located at root or `supabase/schema.sql`) once in the Supabase SQL Editor.
- It automatically configures all 3 extensions (`uuid-ossp`, `pgcrypto`, `vector`), 15 tables, performance & vector indexes, update triggers, RPC functions (`match_knowledge_documents`, `cleanup_old_analytics`), Supabase storage bucket (`henna-images`), Row Level Security (RLS) policies, permissions/grants, and initial seed data for site settings, services, designs, gallery, testimonials, AI providers, and dynamic CMS documents.


---

## Environment Variables Specification

Create `.env.local` for local development or configure these variables in your hosting provider (e.g. Vercel):

| Variable Name | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **PUBLIC** | **Yes** | Full URL of your Supabase project (e.g. `https://xyz.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **PUBLIC** | **Yes** | Supabase anonymous / publishable key for public database reads. |
| `NEXT_PUBLIC_SITE_URL` | **PUBLIC** | **Yes** | Canonical site URL (e.g. `https://hennabyaayesha.com` or Vercel preview URL). |
| `SUPABASE_SERVICE_ROLE_KEY` | **SERVER-ONLY** | **Yes** | Elevated service role key for administrative tasks and server AI routing. |
| `AI_SETTINGS_ENCRYPTION_KEY` | **SERVER-ONLY** | **Yes** | 32+ character random secret for AES-256-GCM encryption of stored API keys. |
| `CLOUDFLARE_ACCOUNT_ID` | **SERVER-ONLY** | *Optional* | Cloudflare Account ID if using Cloudflare Workers AI. |

> [!CAUTION]
> Never prepend `NEXT_PUBLIC_` to `SUPABASE_SERVICE_ROLE_KEY` or `AI_SETTINGS_ENCRYPTION_KEY`. Doing so exposes database superuser access or decryption capabilities to client browsers.

---

## Zero-Cost Production Deployment Guide (Vercel)

This architecture is optimized to run completely within **Vercel's Free Hobby Tier** and **Supabase's Free Tier** with zero monthly infrastructure costs.

### Step 1: Prepare Supabase Project
1. Create a free account and new project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (keep secret)
3. Navigate to the **SQL Editor** in Supabase and run `supabase/schema.sql` followed by the migration scripts.
4. In **Storage**, verify the `mehndi-designs` and `gallery` public buckets are created.

### Step 2: Deploy to Vercel
1. Push your repository to GitHub or GitLab.
2. Sign in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `henna_by_aayesha` repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: Next.js (automatically detected).
   - **Root Directory**: `./`.
   - **Build Command**: `npm run build` (or leave default).
   - **Output Directory**: `.next` (or leave default).
5. Expand the **Environment Variables** section and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (set to your Vercel domain or custom domain)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_SETTINGS_ENCRYPTION_KEY` (generate with `openssl rand -hex 32`)
6. Click **Deploy**.

### Step 3: Post-Deployment Verification
1. Access your deployed Vercel URL.
2. Navigate to `/admin/login` and log in with your Supabase admin account.
3. In **AI Settings → Chat Providers**, enter your free-tier API keys for Google Gemini, Groq, Mistral, or OpenRouter and click **Test Connection**.
4. In **AI Settings → Knowledge Base**, click **Sync New Content** to generate embeddings for all catalog items.
5. Visit `/ai-design-assistant` and verify live chat, hybrid design recommendations, and WhatsApp CTA triggers.

---

## Development & Verification Commands

```bash
# Start local development server (Turbopack)
npm run dev

# Run TypeScript type-checking across all files
npx tsc --noEmit

# Run ESLint validation
npm run lint

# Compile production build
npm run build

# Start local production server
npm run start
```


