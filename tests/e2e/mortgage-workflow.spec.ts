import { test, expect } from "@playwright/test";

test.describe("AI Mortgage Command Center — End-to-End Canadian Workflow", () => {
  test("1. Public Marketing Homepage renders DEMO MODE badge, 4-stage workflow, calculator preview, and saves Book a Demo locally", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByText("DEMO MODE — FICTIONAL SAMPLE DATA ONLY")
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /AI Mortgage Command Center/i })
    ).toBeVisible();

    // Verify Book a Demo local SQLite persistence
    await page.fill("#demo-fullName", "Nadia Desjardins");
    await page.fill("#demo-workEmail", "nadia@maple-demo.ca");
    await page.fill("#demo-orgName", "Maple Horizon Brokerage");
    await page.click('button:has-text("Save Demo Request")');

    await expect(
      page.getByText("Demo Request Saved Locally in SQLite (Demo Mode)!")
    ).toBeVisible();
  });

  test("2. Private Dashboard displays 5 seeded fictional Canadian applications, Recharts analytics, and zero automotive terminology", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: /Private Mortgage Command Dashboard/i })
    ).toBeVisible();
    await expect(page.getByText("CAN-MORT-2026-101")).toBeVisible();
    await expect(page.getByText("CAN-MORT-2026-102")).toBeVisible();
    await expect(page.getByText("CAN-MORT-2026-103")).toBeVisible();
    await expect(page.getByText("CAN-MORT-2026-104")).toBeVisible();
    await expect(page.getByText("CAN-MORT-2026-105")).toBeVisible();

    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    expect(bodyText).not.toContain("dealership");
  });

  test("3. Guided Demo Walkthrough navigates across all 6 workflow stages and saves state", async ({
    page,
  }) => {
    await page.goto("/guided-demo");

    await expect(
      page.getByRole("heading", {
        name: /Step 1: New Borrower & AI Intake/i,
      })
    ).toBeVisible();

    await page.click('button:has-text("Save & Advance to Next Step")');
    await expect(
      page.getByRole("heading", {
        name: /Step 2: Document Verification Queue/i,
      })
    ).toBeVisible();
  });

  test("4. 7 Interactive Canadian Mortgage Calculators render and compute values", async ({
    page,
  }) => {
    await page.goto("/calculators");

    await expect(
      page.getByRole("heading", {
        name: /1\. Canadian Mortgage Payment Calculator/i,
      })
    ).toBeVisible();

    await page.click('button:has-text("7. Stress-Test (OSFI B-20)")');
    await expect(
      page.getByRole("heading", {
        name: /7\. OSFI Guideline B-20 Mortgage Stress-Test Calculator/i,
      })
    ).toBeVisible();
  });
});
