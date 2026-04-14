import { test, expect } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost:8080";
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "TestPassword123";

test.describe("Authentication Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("League Press Poll")).toBeVisible();
    await expect(page.getByPlaceholder("voter@lpp.com")).toBeVisible();
  });

  test("should display registration page", async ({ page }) => {
    await page.goto("/apply");
    await expect(page.getByText("Apply to Vote")).toBeVisible();
    await expect(page.getByText("Join the LPP panel")).toBeVisible();
  });

  test("should reject invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("voter@lpp.com").fill("wrong@example.com");
    await page.getByPlaceholder("Enter password").fill("wrongpassword");
    
    const turnstile = page.locator("#turnstile-container iframe");
    if (await turnstile.isVisible()) {
      await page.waitForTimeout(2000);
    }
    
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Email and password required")).toBeVisible();
  });

  test("should navigate back to rankings from login", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Back to Rankings" }).click();
    await expect(page).toHaveURL("/");
  });

  test("should navigate back to rankings from apply", async ({ page }) => {
    await page.goto("/apply");
    await page.getByRole("link", { name: "Back to Rankings" }).click();
    await expect(page).toHaveURL("/");
  });

  test("should show error for invalid email format", async ({ page }) => {
    await page.goto("/apply");
    await page.getByLabel("Name *").fill("Test User");
    await page.getByLabel("Email *").fill("not-an-email");
    await page.getByLabel("Outlet / Organization").fill("Test Outlet");
    await page.getByRole("button", { name: "Submit Application" }).click();
    await expect(page.getByText(/email/i)).toBeVisible();
  });

  test("should show error for short password", async ({ page }) => {
    await page.goto("/apply");
    await page.getByLabel("Name *").fill("Test User");
    await page.getByLabel("Email *").fill("test2@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Submit Application" }).click();
    await expect(page.getByText(/password/i)).toBeVisible();
  });
});

test.describe("Token Management", () => {
  test("should store access token in localStorage after login", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("voter@lpp.com").fill(TEST_EMAIL);
    await page.getByPlaceholder("Enter password").fill(TEST_PASSWORD);
    
    const turnstile = page.locator("#turnstile-container iframe");
    if (await turnstile.isVisible()) {
      await page.waitForTimeout(2000);
    }
    
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("/admin");
    
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
  });
});