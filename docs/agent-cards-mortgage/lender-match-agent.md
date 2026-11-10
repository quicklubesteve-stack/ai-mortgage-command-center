# Adapted Agent Card 3: Mortgage Qualification & Lender Matching Agent (Canadian Mortgage Architecture)

> **Source Attribution Notice:** Adapted from the original reusable four-stage `lender-match-agent.md` card (which described an automotive finance workflow). All automotive/vehicle/dealership criteria have been replaced with Canadian mortgage mathematics (semi-annual compounding, GDS/TDS ratios, LTV, CMHC/Sagen/Canada Guaranty default insurance, OSFI Guideline B-20 stress test) and Canadian lender product matrices.

**Role:** Computes transparent Canadian mortgage qualification metrics under configurable dated policy assumptions and matches the file against five fictional Canadian lender profiles with plain-language explanations.

| Field | Details |
|---|---|
| **Inputs** | Structured mortgage application record; document verification checklist; configurable Canadian mortgage policy parameters (dated reference assumptions); five fictional Canadian lender product criteria profiles |
| **Outputs** | Deterministic calculation breakdown (GDS, TDS, LTV, semi-annually compounded payment, stress-test qualifying payment, default insurance premium) + ranked `LenderMatch` options detailing fit rationale, illustrative rates/payments, missing conditions, policy vs. lender rule distinctions, and limitations |
| **Tools / access** | Execute deterministic Canadian mortgage calculator service; read configurable lender product rules; write `LenderMatch` records |
| **Guardrails** | Recommend and illustrate only—never make binding eligibility decisions or guarantee financing; distinguish regulatory guidelines (OSFI B-20 / insured rules) from individual lender overlays; never claim live market rates |
| **Hands off to** | Underwriting Support & Package Builder Agent (Agent 4) |
| **Success measure** | Transparency and mathematical accuracy of GDS/TDS/LTV/stress-test calculations and lender fit explanations for the human reviewer |

**Human oversight:** The Authorized Mortgage Broker / Internal Underwriter (**Steve**) evaluates the candidate lender options and selects or modifies the target program. No agent approves, denies, or commits to any lender product.
