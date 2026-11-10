# 🍁 AI Mortgage Command Center

**Tagline:** *Smarter Mortgage Workflows. Human-Controlled Decisions.*

A modern, full-stack Canadian mortgage intake, document verification, qualification, fictional lender comparison, and underwriting-support SaaS web application built with **Next.js 14 (App Router), TypeScript, Tailwind CSS, React Hook Form, Zod, Prisma (SQLite), Recharts, Vitest, and Playwright**.

---

## 🏛️ Architectural Overview & Source Project Alignment

This application preserves the core requirements of your existing mortgage project (`Project1/AGENTS.md`, `deals-data.js`, `mortgage-agent.js`) while adapting the reusable four-stage agent card architecture (`intake-agent.md`, `document-agent.md`, `lender-match-agent.md`, `package-agent.md`) to **100% Canadian residential mortgage workflows**:

1. **Source Attribution & Domain Separation:**
   - The original four agent cards in `files.zip` described a four-stage automotive finance pipeline. We adapted their modular four-stage handoff pattern into [`docs/agent-cards-mortgage/`](file:///c:/Users/steve/OneDrive/Desktop/New%20folder/docs/agent-cards-mortgage/intake-agent.md) using strictly Canadian mortgage terminology (GDS, TDS, LTV, semi-annual compounding, CMHC/Sagen/Canada Guaranty default insurance, OSFI Guideline B-20 stress test, CRA T1/NOA tax verification, and brokerage underwriting review).
   - Zero vehicles, auto financing, or car dealership terminology appear anywhere in this platform.
2. **Non-Delegable Human-in-the-Loop Guardrail:**
   - Every AI agent is governed by a hardcoded **Zero-Approval Guardrail**. No agent can approve, pre-approve, guarantee, or deny a mortgage or submit an application externally.
   - 100% of human review actions rest with an authorized mortgage broker or internal underwriter (**Steve**). Internal review completion is explicitly labeled as **not a final lender mortgage approval**.

---

## 💻 Exact PowerShell Installation & Startup Commands (Acer Windows Laptop)

Open **Windows PowerShell** on your Acer Windows laptop and run the following commands:

```powershell
# 1. Navigate to the project folder
cd "c:\Users\steve\OneDrive\Desktop\New folder"

# 2. Allow PowerShell to run npm scripts in the current terminal session
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 3. Install dependencies
npm.cmd install

# 4. Copy .env.example to .env (if not already present)
if (!(Test-Path .env)) { Copy-Item .env.example .env }

# 5. Generate Prisma Client, push SQLite schema, and seed the 5 fictional Canadian applications
npm.cmd run db:setup

# 6. Run the Vitest unit test suite (18 deterministic tests across Phases 1–4)
npm.cmd test

# 7. Start the local Next.js development server
npm.cmd run dev
```

Then open your browser to:
- **Public Marketing Website:** `http://localhost:3000`
- **Private Command Dashboard:** `http://localhost:3000/dashboard`
- **Interactive 6-Step Guided Demo:** `http://localhost:3000/guided-demo`
- **Agent 1 (AI Borrower Intake):** `http://localhost:3000/intake`
- **Agent 2 (Document Verification):** `http://localhost:3000/documents`
- **Agent 3 (Qualification & 5 Fictional Lenders):** `http://localhost:3000/qualification`
- **Agent 4 (Underwriting Support & PDF Package):** `http://localhost:3000/underwriting`
- **Human Review Workspace (Steve):** `http://localhost:3000/review`
- **7 Canadian Mortgage Calculators:** `http://localhost:3000/calculators`

---

## 🔍 Clear Distinction: Implemented Features vs. Simulations vs. Future Integrations

| Category | Status in Local Prototype | Details |
| :--- | :--- | :--- |
| **Canadian Mortgage Calculators (7)** | ✅ **Fully Implemented** | Semi-annual compounding (`Interest Act (Canada)`), OSFI B-20 Stress Test (`max(Contract + 2.00%, 5.25%)`), GDS/TDS (with 50% condo fee rule), tiered minimum down payments, default insurance, refinance 80% LTV cap, and amortization schedules. |
| **SQLite Persistence (16 Prisma Models)** | ✅ **Fully Implemented** | Persistent records for `Brokerage`, `User`, `Borrower`, `MortgageApplication`, `Property`, `IncomeRecord`, `Liability`, `Document`, `DocumentCheck`, `LenderProduct`, `LenderMatch`, `UnderwritingAssessment`, `ReviewDecision`, `SubmissionPackage`, `AuditEvent`, and `DemoRequest`. |
| **Downloadable Draft PDF Export** | ✅ **Fully Implemented** | Server-side PDF generator (`/api/applications/[id]/pdf`) exporting formatted underwriting summaries with compliance disclaimers. |
| **4-Stage Workflow Agents** | 🧪 **Deterministic Demo Services** | Deterministic NLP entity extraction, document discrepancy rules, configurable dated policy calculations (`2026-01-01` baseline), and 5 editable fictional Canadian lenders. |
| **Document Upload & ID Check** | 🧪 **Demo Simulation** | Supports sample PDF uploads and manual review state transitions (`VERIFIED_DEMO`, `PENDING_MANUAL_REVIEW`, `INCONSISTENT`, `MISSING`). Does **not** perform live cryptographic ID verification or claim document authenticity. |
| **Role-Based Access Control (RBAC)** | 🧪 **Demo Role Switcher + Server Check** | Local header role switcher (`INTERNAL_UNDERWRITER`, `MORTGAGE_BROKER`, `BORROWER`, `BROKERAGE_ADMIN`, `PLATFORM_ADMIN`) paired with server-side HTTP 403 enforcement on reviewer endpoints. |
| **Credit Bureaus, LOS & Live Rates** | 🔮 **Future Production Integration** | No connection to Equifax/TransUnion Canada, Finmo, Filogix, Velocity, or live lender pricing engines in Demo Mode. |

---

## 🔐 Instructions for Eventual Secure Public Deployment & Compliance Checklist

Before deploying this platform to a public cloud environment with real borrower Personal Information (PI), complete the following production engineering and legal review steps:

1. **Database Migration (SQLite → Managed PostgreSQL with Encryption):**
   - Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma` and point `DATABASE_URL` to a managed PostgreSQL instance (e.g., Google Cloud SQL, AWS RDS, or Supabase) with **AES-256 encryption at rest** and **TLS 1.3 in transit**.
   - Implement application-layer field-level encryption (KMS envelope encryption) for sensitive borrower identifiers and financial records.
2. **Production Authentication & Tenant Isolation:**
   - Replace the clearly labeled Demo Role Switcher with enterprise OAuth2 / OIDC authentication (e.g., Auth0, Clerk, Microsoft Entra ID, or NextAuth) enforcing **Multi-Factor Authentication (MFA)** for all broker and underwriter accounts.
   - Enforce strict row-level `brokerageId` tenant isolation on every database query.
3. **Canadian Privacy & Provincial Mortgage Regulatory Review:**
   - Obtain independent legal and compliance review under **PIPEDA** (Personal Information Protection and Electronic Documents Act), provincial privacy statutes (Quebec Law 25, BC PIPA, Alberta PIPA), and provincial mortgage brokerage regulators (**FSRA** in Ontario, **BCFSA** in British Columbia, **RECA** in Alberta, **AMF** in Quebec).
   - *Note: This software does not claim regulatory compliance without independent legal validation.*
4. **Data Retention & Deletion Policy:**
   - Implement automated retention schedules aligned with provincial brokerage record-keeping rules (typically 6–7 years for completed mortgage files) and right-to-erasure / anonymization workflows for withdrawn inquiries.
   - Store all secrets exclusively in cloud secret managers (never in source code).
