# lpu-web

Academic Transcript Verification

A Vercel-compatible Next.js application for publishing academic result **PDFs** and verifying them with a document
type, registration number, and document number.

An administrator enters the three identifiers used on the landing page and uploads the result PDF. The PDF is stored
in Supabase storage; MySQL holds only the identifiers and a reference to the stored object. When a visitor's three
values match a record, the portal streams that PDF back and renders it in the page.

## How it works

1. The administrator signs in at `/admin` and adds a record: document type, registration number, document number,
   plus the result PDF.
2. The PDF is uploaded to the Supabase `objects` bucket under `lpu-results/<registration>/<uuid>.pdf`.
3. The row in `academic_result_documents` stores the identifiers and `pdf_object_key`.
4. A visitor enters the three identifiers on the landing page. On an exact match the API returns a signed,
   one-hour link to `/api/results/<id>/document`.
5. That route re-checks the signature, fetches the object from Supabase with the service-role key, and streams it
   as `application/pdf` — inline for the viewer, or as an attachment for the download button.

The bucket stays private. Supabase URLs and keys are never exposed to the browser; every read passes through the
app's own signed-link route.

## Features

- Next.js 16 App Router and Vercel Route Handlers
- Aiven MySQL for identifiers and object references
- Supabase storage for the result PDFs
- PIN-protected administration at `/admin`
- Create, search, edit, and delete result records
- PDF replacement on edit, with the superseded object removed after the row is updated
- Deleting a record also deletes its stored PDF
- Public three-field verification
- In-page PDF viewer plus a direct download
- Signed, one-hour result-document URLs issued only after a successful match

## Run locally

```bash
npm install
npm run db:migrate
npm run dev
```

Open:

- Public verifier: `http://localhost:3000`
- Administration: `http://localhost:3000/admin`

The requested initial PIN is `1280`. Change it before exposing the application publicly.

## Environment variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MySQL connection string |
| `ADMIN_PIN` | Yes | Administration PIN |
| `SESSION_SECRET` | Yes | At least 32 random characters used to sign sessions and document links |
| `SUPABASE_URL` | Yes | Supabase project URL (the `/rest/v1` suffix is accepted and trimmed) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side key used to read and write bucket objects |
| `SUPABASE_BUCKET` | No | Storage bucket name, `objects` by default |
| `SUPABASE_ANON_KEY` | No | Kept for reference; the server paths use the service-role key |
| `MYSQL_CA` | Recommended | Aiven CA certificate with `\n` line breaks for full TLS identity verification |

`npm run db:migrate` creates the MySQL tables and the storage bucket if either is missing, so a fresh project needs
no manual setup.

## Vercel deployment

1. Import the repository into Vercel as a Next.js project.
2. Add `DATABASE_URL`, `ADMIN_PIN`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and preferably
   `MYSQL_CA` under Project Settings → Environment Variables.
3. Run `npm run db:migrate` once with the production environment variables.
4. Deploy.

Uploads are capped at 20 MB and the `%PDF-` signature is checked server-side before anything reaches storage. Note
that Vercel Functions impose their own request-body limit, which is lower than 20 MB on some plans.

## Verification

```bash
npm test
npm run lint
npm run build
```

The tests cover identifier normalization shared by the admin and public paths, required-field and character
validation, and PDF signature checking on upload.
