# lpu-web

Academic Transcript Verification

A Vercel-compatible Next.js application for publishing structured academic result data and verifying it with a
document type, registration number, and document number.

The public transcript is rendered as HTML from administrator-entered fields. No result PDF is uploaded or stored.
When a visitor selects **Download PDF**, the browser converts the displayed HTML transcript into an A4 PDF.

## Features

- Next.js 16 App Router and Vercel Route Handlers
- Aiven MySQL storage
- PIN-protected administration at `/admin`
- Create, search, edit, and delete result records
- Plain-text fields for candidate and document metadata
- Candidate photograph upload stored in MySQL
- Any number of term sections, with TGPA and equivalent percentage
- Plain inputs for every course code, course name, credit, and grade
- Public three-field verification
- A4 transcript-style HTML result
- On-demand browser-side PDF generation with jsPDF and html2canvas
- No uploaded or stored result PDFs
- Signed, 15-minute candidate-photo URLs after successful verification

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
| `SESSION_SECRET` | Yes | At least 32 random characters used to sign sessions and photo links |
| `MYSQL_CA` | Recommended | Aiven CA certificate with `\n` line breaks for full TLS identity verification |

The supplied connection uses `ssl-mode=REQUIRED`, so the connection is encrypted. Adding `MYSQL_CA` also verifies
the database server certificate and is recommended for the Vercel environment.

## Vercel deployment

1. Import the repository into Vercel as a Next.js project.
2. Add `DATABASE_URL`, `ADMIN_PIN`, `SESSION_SECRET`, and preferably `MYSQL_CA` under Project Settings → Environment
   Variables.
3. Run `npm run db:migrate` once with the production environment variables.
4. Deploy.

Candidate photos are limited to 2 MB so the complete multipart request remains below Vercel Functions' request-body
limit. JPG, PNG, and WebP file signatures are validated server-side.

## Verification

```bash
npm test
npm run lint
npm run build
```

The tests cover structured transcript validation, numeric limits, identifier normalization, and candidate-image
signature validation.
