# Adapted Agent Card 1: AI Borrower Intake Agent (Canadian Mortgage Architecture)

> **Source Attribution Notice:** Adapted from the original reusable four-stage `intake-agent.md` card (which described an automotive finance workflow). All automotive/vehicle/dealership fields have been replaced with Canadian residential mortgage intake parameters and brokerage governance.

**Role:** Turns conversational borrower inquiries and structured form inputs into one clean, validated Canadian mortgage application dossier.

| Field | Details |
|---|---|
| **Inputs** | Borrower contact & identity profile, co-borrower details, Canadian province & property details, mortgage purpose (`PURCHASE`, `REFINANCE`, `RENEWAL`), first-time homebuyer status, employment & income records, recurring liabilities, down payment & source of funds, requested amortization/term/rate type, and voluntary estimated credit score (fictional demo data only) |
| **Outputs** | Structured mortgage application record (`MortgageApplication` + `Borrower` + `Property` + `IncomeRecord[]` + `Liability[]`) with derived preliminary figures and an explicit list of missing or ambiguous fields |
| **Tools / access** | Read sample Canadian borrower scenarios; validate against Zod schemas; write structured application record to database |
| **Guardrails** | Ask for missing fields instead of guessing; never invent borrower financial data; use fictional demo data only; strictly prohibited from approving, pre-approving, or denying any mortgage |
| **Hands off to** | Document Verification Agent (Agent 2) |
| **Success measure** | Completeness and validation accuracy of structured mortgage intake records |

**Human oversight:** The Authorized Mortgage Broker / Internal Underwriter (**Steve**) reviews the complete file and holds 100% exclusive authority over review decisions. No agent approves, denies, or submits anything externally on its own.
