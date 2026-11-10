# 🏡 Mortgage Deal Filtration Agent Chatbot

An enterprise-grade, conversational Mortgage Filtration Agent and Underwriting Cockpit. This system collects borrower financial profiles, performs real-time financial mathematics (LTV, front-end and back-end DTI, P&I amortization, PMI requirements), and matches applicants against wholesale lending matrices.

---

## 🔒 Crucial Architectural Guardrail: Zero-Approval Policy

> **MANDATORY POLICY ENFORCEMENT:**  
> **The AI Agent is strictly prohibited from approving, committing to, or denying any mortgage deal or application.**
> 
> - **Human-in-the-Loop:** Final decision authority rests **100% with the authorized human officer (Steve)**.
> - **Status Badges:** All deals evaluated by the agent are placed in a `PENDING HUMAN AUTHORIZATION` state.
> - **Authorization Desk:** A dedicated underwriter command console allows Steve to review the dossier, inspect the LTV/DTI calculations, verify risk flags, and click **Authorize Deal**, **Decline Deal**, or **Request Documentation**.
> - **Compliance Disclosures:** Every deal summary and chat interaction carries an explicit regulatory and compliance notice detailing this boundary.

---

## 🚀 Features

1. **Conversational Intake Chatbot**:
   - Natural language interaction with borrower profile gathering.
   - Quick-start scenario buttons (First-time Homebuyer, Jumbo Loan, 15-Year Fast Equity, Military VA 0% Down, Rate-and-Term Refinance).
   - Real-time input validation (Credit score ranges, LTV thresholds, DTI ratios).

2. **Wholesale Lending Deal Matcher**:
   - Real-time catalog of products from competitive lenders (Apex Home Lending, Citadel Capital, Freedom Veterans Trust, Summit Federal, BluePeak Direct).
   - Products include **30-Yr Fixed**, **15-Yr Fixed**, **FHA Government**, **VA Military**, **Jumbo Non-Conforming**, and **5/1 Hybrid ARM**.
   - Conforming loan limit awareness ($766,550 standard baseline).

3. **Financial Math & Underwriting Engine**:
   - **Loan-to-Value (LTV)**: Automated down payment & loan amount validation, flagging PMI if LTV > 80%.
   - **Debt-to-Income (DTI)**: Front-end (housing ratio) and back-end (total obligation ratio) calculation.
   - **Monthly Payment Breakdown**: Principal & Interest, estimated Property Tax (1.2%), Homeowners Insurance ($110/mo baseline), and calculated PMI.

4. **Human Underwriter Authorization Desk**:
   - Live queue of pending borrower dossiers awaiting Steve's review.
   - Action buttons: `[ ✅ Grant Final Authorization ]`, `[ ❌ Decline Deal ]`, `[ 📝 Request Additional Docs ]`.
   - Immutable audit trail recording timestamps, notes, and approval status.
   - Real-time synchronization between the chatbot conversation and the underwriter desk.

5. **Aesthetics & UX**:
   - Modern fintech dark-mode interface with emerald accents and glassmorphism.
   - Mobile-responsive layout with split-screen Chatbot and Underwriter Review Drawer.
   - Zero external framework dependencies — runs cleanly with vanilla HTML5, CSS3, and modern ES6+ JavaScript.

---

## 📂 Project Structure

```
.
├── AGENTS.md             # Detailed agent instructions, prompt constraints, and compliance rules
├── agents.md             # Case-insensitive alias
├── README.md             # Complete project guide and architecture overview
├── read.me               # Alias for README.md
├── .gitignore            # Git exclusion rules
├── .gitattributes        # Git line ending normalization
├── package.json          # Node.js project manifest & scripts
├── server.js             # Lightweight zero-dependency Node HTTP server & API
└── public/
    ├── index.html        # Main interactive web application UI
    ├── css/
    │   └── style.css     # Bespoke fintech styling, glassmorphism & responsive layout
    └── js/
        ├── app.js            # App initialization, tab controls & UI event wiring
        ├── mortgage-agent.js # Core AI chatbot engine, math calculations & compliance guardrails
        └── deals-data.js     # Institutional mortgage product catalog & filtering logic
```

---

## 🛠️ Quick Start & Running Locally

### Option A: Using Node.js (Recommended)
You have Node.js installed (`node -v`). Start the server directly:

```powershell
node server.js
```
Then open your browser at:
👉 **`http://localhost:3000`**

### Option B: Direct Browser Launch
Since the frontend uses clean vanilla web standards, you can also directly open `public/index.html` in any modern web browser (Chrome, Edge, Firefox, Safari) without any server needed!

---

## 🧪 Automated Testing & Verification Suite

A comprehensive 20-point test suite is included to guarantee mathematical accuracy, product matrix filtration, and regulatory zero-approval guardrail enforcement.

### 1. Run via CLI:
```powershell
node test/run-tests.js
```
*(Or via `npm test`)*

### 2. Run via Browser Cockpit:
1. Open `http://localhost:3000` (or `public/index.html`).
2. Click the **`🧪 Diagnostics & Tests`** tab in the right-hand panel.
3. Click **`▶ Run Diagnostics`** to watch all checks execute with real-time pass badges.

### Test Coverage Highlights:
- **Suite 1: Zero-Approval Guardrails**: Confirms AI agent refuses all approval and denial requests, citing Steve's exclusive authority.
- **Suite 2: Underwriting Math**: LTV calculations, PMI trigger (>80% LTV), front/back-end DTI computation, and P&I amortization curve.
- **Suite 3: Wholesale Product Filtration**: FHA down to 580 FICO, Conventional prime cutoff (<620), VA 100% LTV veteran requirement, Jumbo limits ($766,550+).
- **Suite 4: Conversational NLP Parsing**: Accurate parameter extraction from natural sentences.
- **Suite 5: REST API & Authorization Workflow**: Live tests against `/api/queue` and `/api/authorize` for Steve's decision execution and audit trail logging.

---

## 📋 REST API Endpoints (Built into `server.js`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/deals` | Retrieve all wholesale mortgage products |
| `POST` | `/api/filter` | Filter deals based on borrower metrics (credit, LTV, DTI, loan amount) |
| `GET` | `/api/queue` | Get the queue of dossiers awaiting human authorization |
| `POST` | `/api/authorize` | Human underwriter authorization endpoint (Authorize / Reject / Add Notes) |

---

## ⚖️ Compliance & Governance Standard
In accordance with Consumer Financial Protection Bureau (CFPB) guidelines, Truth in Lending Act (TILA), and Equal Credit Opportunity Act (ECOA), algorithmic chatbots are restricted to informational data-gathering and product sorting. All credit extensions and adverse actions are reserved for licensed human underwriters.
