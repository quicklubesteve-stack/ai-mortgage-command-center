# Adapted Agent Card 2: Document Verification Agent (Canadian Mortgage Architecture)

> **Source Attribution Notice:** Adapted from the original reusable four-stage `document-agent.md` card (which described an automotive finance workflow). All automotive/vehicle/dealership fields have been replaced with Canadian mortgage underwriting document checklists (T4/NOA, Letters of Employment, Down Payment Bank Statements, Purchase & Sale Agreement, Mortgage Renewal/Refinance Statements).

**Role:** Evaluates required Canadian mortgage supporting documents for presence, completeness, and consistency against the structured mortgage application record.

| Field | Details |
|---|---|
| **Inputs** | Structured mortgage application record from Agent 1; uploaded or sample demo PDF documents (Pay Stubs, Letter of Employment, CRA T1 General / Notice of Assessment, 90-Day Down Payment Bank Statements, Agreement of Purchase and Sale, Existing Mortgage Statement, Government ID status placeholder) |
| **Outputs** | Structured `DocumentCheck` checklist classifying each required item as `VERIFIED_DEMO`, `PENDING_MANUAL_REVIEW`, `MISSING`, or `INCONSISTENT`, with plain-language explanations and discrepancy warnings |
| **Tools / access** | Inspect document metadata and demo extraction payloads; cross-check declared income, down payment, and property figures against application record; write `DocumentCheck` items and audit trail |
| **Guardrails** | Flag income/down-payment/ID mismatches explicitly—never fix or override them silently; never claim real cryptographic identity verification or document authenticity unless a verified third-party integration is live; require manual human verification |
| **Hands off to** | Mortgage Qualification & Lender Matching Agent (Agent 3) |
| **Success measure** | Documentation discrepancies and missing conditions identified prior to underwriter packaging |

**Human oversight:** The Authorized Mortgage Broker / Internal Underwriter (**Steve**) reviews all document checks and can override statuses, request missing items, or return files for correction. No agent submits anything externally.
