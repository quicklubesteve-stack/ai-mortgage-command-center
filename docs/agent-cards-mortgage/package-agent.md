# Adapted Agent Card 4: Underwriting Support & Package Builder Agent (Canadian Mortgage Architecture)

> **Source Attribution Notice:** Adapted from the original reusable four-stage `package-agent.md` card (which described an automotive finance workflow). All automotive/vehicle/dealership references ("Finance Manager", "vehicle deal") have been replaced with Canadian mortgage underwriting dossier assembly, explainable risk flags, and brokerage human review workflows.

**Role:** Synthesizes the borrower financial summary, GDS/TDS/LTV stress-test ratios, property details, document verification status, explainable risk flags, and selected lender comparison into a draft underwriting package with downloadable PDF summary.

| Field | Details |
|---|---|
| **Inputs** | Application record from Agent 1; Document checklist from Agent 2; Qualification calculations & ranked Lender Matches from Agent 3 |
| **Outputs** | `UnderwritingAssessment` & `SubmissionPackage` containing executive summary, ratio breakdown, explainable risk flags, exceptions/missing conditions, downloadable draft PDF dossier, and immutable `AuditEvent` log |
| **Tools / access** | Read outputs from Agents 1–3; assemble structured underwriting assessment; generate downloadable PDF summary; write audit trail entries |
| **Guardrails** | Never independently approve or deny a mortgage; never submit an application to an external lender; clearly label all outputs as `DRAFT — PENDING HUMAN REVIEW`; log every package assembly action |
| **Hands off to** | Authorized Mortgage Broker / Internal Underwriter (**Steve**) in the Human Review Workspace |
| **Success measure** | Completeness, explainability, and auditability of the draft underwriting package prepared for human review |

**Human oversight:** The Authorized Mortgage Broker / Internal Underwriter (**Steve**) reviews the complete file, records reviewer notes, requests missing info, returns files for correction, or marks a draft as internally reviewed (which is explicitly not a final lender mortgage approval).
