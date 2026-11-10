# 🎓 Academic Project Report: Mortgage Filtration Agent & Human Authorization System

**Course Project Submission** | **Weight:** 30% of Final Mark  
**Lead System Architect & Authorized Underwriter:** Steve  
**Core Directive:** Automated Deal Filtration with Non-Delegable Human Underwriter Authorization  

---

## 1. Executive Summary & Problem Formulation

In modern residential lending, consumer inquiries must navigate an intricate matrix of institutional guidelines: conforming loan limits, credit tiers (FICO), Loan-to-Value (LTV) limits, Private Mortgage Insurance (PMI) triggers, and Debt-to-Income (DTI) thresholds.

While Artificial Intelligence can rapidly parse applicant criteria and calculate underwriting mathematics, **autonomous credit decisions by algorithmic agents introduce severe regulatory, legal, and operational vulnerabilities**. Under statutory consumer finance frameworks, algorithms cannot be granted unilateral approval or denial authority.

This project delivers an **Enterprise-Grade Mortgage Filtration Agent and Human Cockpit**:
1. **Intelligent Conversational Agent:** Natural language profile extraction, financial ratio computation, and multi-lender deal filtration.
2. **Hardcoded Zero-Approval Guardrail:** The AI is strictly and programmatically prohibited from approving, pre-approving, or denying mortgage applications.
3. **Dedicated Underwriter Authorization Desk:** 100% of final credit decisions, adverse action notices, and closing conditions are reserved exclusively for the authorized human loan officer (**Steve**).
4. **Immutable Audit Trail:** Real-time logging of timestamps, officer determinations, and compliance notes.
5. **20-Point Automated Test Suite:** CLI and live in-browser verification verifying zero-defect operations.

---

## 2. Regulatory & Legal AI Guardrail Rationale

### Statutory Frameworks Enforced:
- **Equal Credit Opportunity Act (ECOA / Regulation B):** Prohibits unexplainable algorithmic adverse action. Denials must provide specific, legally compliant adverse action notices compiled by certified personnel.
- **Truth in Lending Act (TILA / Regulation Z):** Mandates precise APR disclosure, closing cost estimates, and escrow payment projections without deceptive guarantees.
- **CFPB Circular 2022-03 (Black-Box Credit Algorithms):** Directs that automated underwriting models must have human explainability and cannot make binding determinations without licensed underwriter oversight.

```
┌────────────────────────────────────────────────────────┐
│                   MORTGAGE AGENT                       │
│    Intake • Underwriting Math • Wholesale Matcher     │
└──────────────────────────┬─────────────────────────────┘
                           │ Candidate Deals Evaluated
                           ▼
          [ Status: PENDING HUMAN AUTHORIZATION ]
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             STEVE'S AUTHORIZATION DESK                 │
│               (Sole Human Authority)                   │
├──────────────────────────┬─────────────────────────────┤
│  [ ✅ Grant Final Auth ] │  [ ❌ Decline / Adverse ]   │
└──────────────────────────┴─────────────────────────────┘
```

---

## 3. Underwriting Mathematical Formulations

### 3.1. Loan-to-Value (LTV) Ratio
$$\text{LTV} = \left(\frac{\text{Loan Amount}}{\text{Purchase Price / Appraised Value}}\right) \times 100\%$$
- **Rule:** If $\text{LTV} > 80.0\%$ on Conventional products, Private Mortgage Insurance (PMI) is automatically computed ($\approx 0.75\%$ annual factor) and added to the monthly escrow breakdown.

### 3.2. Debt-to-Income (DTI) Ratios
- **Front-End Ratio (Housing Ratio):**
  $$\text{Front-End DTI} = \left(\frac{\text{Proposed P\&I} + \text{Taxes} + \text{Insurance} + \text{PMI}}{\text{Gross Monthly Income}}\right) \times 100\%$$
- **Back-End Ratio (Total Obligation Ratio):**
  $$\text{Back-End DTI} = \left(\frac{\text{Total Monthly Housing Expense} + \text{Monthly Recurring Debts}}{\text{Gross Monthly Income}}\right) \times 100\%$$
- **Thresholds:** Capped at $43.0\%$ for conforming conventional; extended to $50.0\%$ for FHA/VA government products.

### 3.3. Monthly Payment Amortization ($M$)
$$M = P \left[ \frac{r(1 + r)^n}{(1 + r)^n - 1} \right]$$
*Where:*
- $P$ = Principal Loan Balance
- $r$ = Monthly Note Rate ($\text{Annual Interest Rate} \div 12 \div 100$)
- $n$ = Total Amortization Payments (e.g., $30 \times 12 = 360$ months)

---

## 4. Institutional Wholesale Lending Catalog

The engine matches applicants against 7 institutional lending matrices:

| Lender | Product Name | Term | Min FICO | Max LTV | Max DTI | Loan Ceilings | Key Purpose |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Apex Home Lending** | Apex Prime 30Y Fixed | 30Y | 680 | 95.0% | 43.0% | $766,550 | Standard conforming purchase |
| **Citadel Capital** | Super-Prime 30Y Fixed | 30Y | 740 | 80.0% | 40.0% | $766,550 | Lowest rate for high equity |
| **Summit Federal** | Rapid-Equity 15Y Fixed | 15Y | 660 | 90.0% | 43.0% | $766,550 | Accelerated equity builder |
| **BluePeak Direct** | Advantage FHA 30Y | 30Y | 580 | 96.5% | 50.0% | $766,550 | Accessible low down payment |
| **Freedom Veterans Trust**| Patriot VA 30Y | 30Y | 580 | 100.0% | 50.0% | $1,500,000 | 0% down for military veterans |
| **Pacific Crest Wealth** | Elite Jumbo 30Y Fixed | 30Y | 720 | 80.0% | 40.0% | $3,500,000 | Luxury non-conforming homes |
| **Horizon Mutual** | 5/1 Hybrid SOFR ARM | 30Y | 660 | 90.0% | 43.0% | $766,550 | Lower initial 5-year rate |

---

## 5. System Verification & Test Methodology

The project incorporates an end-to-end automated testing harness with **20 deterministic test cases**:

1. **Suite 1: Zero-Approval Guardrails (4 Tests)**
   - Test 1.1: Direct approval command refusal.
   - Test 1.2: Direct denial command refusal.
   - Test 1.3: Approval letter generation request refusal.
   - Test 1.4: Guarantee that dossier state defaults to `PENDING_OFFICER_AUTHORIZATION`.
2. **Suite 2: Underwriting Mathematics (4 Tests)**
   - Test 2.1: $80.0\%$ LTV mathematical verification.
   - Test 2.2: PMI surcharge trigger when LTV $> 80\%$.
   - Test 2.3: P&I amortization curve parity with financial standards.
   - Test 2.4: Conforming vs Jumbo boundary enforcement at $\$766,550$.
3. **Suite 3: Wholesale Deal Filtration (4 Tests)**
   - Test 3.1: Credit cutoff (<620 excluded from conventional, accepted by FHA).
   - Test 3.2: High loan amount routing to Jumbo luxury suites.
   - Test 3.3: VA 100% LTV restricted to veterans.
   - Test 3.4: Excessive DTI (>50%) blocked across standard pools.
4. **Suite 4: Conversational NLP Parsing (2 Tests)**
   - Test 4.1: Multi-parameter extraction (credit, income, debt, price, down payment).
   - Test 4.2: Veteran status identification.
5. **Suite 5: REST API & Human Authorization (6 Tests)**
   - Test 5.1: `GET /api/queue` active queue retrieval.
   - Test 5.2: `POST /api/queue` dossier intake.
   - Test 5.3: `POST /api/authorize` execution of Steve's `AUTHORIZED` decision.
   - Test 5.4: `POST /api/authorize` execution of Steve's `DECLINED` adverse action.
   - Test 5.5: Enforcement of valid underwriter decisions (HTTP 400 rejection on invalid states).
   - Test 5.6: 404 response on non-existent dossier ID.

---

## 6. Instructor / Evaluator 2-Minute Grading Walkthrough

To verify all requirements and test every feature in under two minutes:

1. **Launch Application:**
   - Double-click **`start.bat`** (or run `node server.js` in terminal).
   - Web application opens automatically at `http://localhost:3000`.

2. **Verify the Zero-Approval Guardrail (Requirement 1):**
   - Click the red button in the chat scenario bar: **`🛑 Test Approval Guardrail`**.
   - Notice the prompt asks the agent to approve the loan.
   - **Observed Behavior:** The AI immediately halts, displays a red Governance Guardrail alert, and informs the applicant that the AI is **strictly prohibited from approving or denying deals**, and that only **Steve** holds final credit authorization.

3. **Filter Mortgage Deals (Requirement 2):**
   - Click any scenario (e.g., **`🏡 First-Time Buyer (5% Down)`** or **`🎖️ VA Military (0% Down)`**).
   - The chatbot computes LTV %, DTI %, estimated monthly payments (P&I, taxes, insurance, PMI), and filters qualifying wholesale products.
   - All cards display the status: **`⏳ PENDING STEVE'S AUTHORIZATION`**.

4. **Execute Final Human Authorization as Steve (Requirement 3):**
   - On any filtered deal card, click **`📋 Route to Steve's Desk`**.
   - In the right-hand panel (**Steve's Authorization Desk**), review the active borrower dossier.
   - Type in the underwriter notes: *"Approved based on clean credit and verified reserves."*
   - Click **`✅ Grant Final Authorization`**.
   - **Observed Behavior:**
     - The badge updates to **`AUTHORIZED BY STEVE`**.
     - A new immutable audit entry is added to the **Underwriter Decisions Audit Trail** table.
     - A formal notification is broadcast back to the chatbot conversation.

5. **Run the Automated Test Suite (Requirement 4):**
   - Click the **`🧪 Diagnostics & Tests`** tab in the top right.
   - Click **`▶ Run Diagnostics`**.
   - Watch all 20 tests pass with green checkmarks in real-time.
   - Or double click **`test.bat`** from Windows Explorer to view the CLI output.

---

## 7. Conclusion

This project demonstrates a production-grade, compliance-first AI agent architecture. By establishing **Steve** as the sole authorized decision-maker, the system eliminates autonomous AI credit risk while capitalizing on conversational intake and real-time underwriting calculations.
