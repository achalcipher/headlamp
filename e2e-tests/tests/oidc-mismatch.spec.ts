/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { test, expect } from '@playwright/test';

test.describe('OIDC Configuration Mismatch Detection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Headlamp UI
    // Note: This assumes Headlamp is running locally on port 3000
    // Adjust URL as needed for your environment
    await page.goto('http://localhost:3000');

    // Wait for the UI to load
    await page.waitForLoadState('networkidle');
  });

  test('should display OIDC mismatch alert when API server is not configured for OIDC', async ({
    page,
    context,
  }) => {
    // This test requires:
    // 1. A test cluster configured in Headlamp with OIDC enabled
    // 2. The corresponding Kubernetes API server NOT configured for OIDC
    // 3. A valid OIDC token obtained from the configured IdP

    // Step 1: Complete OIDC authentication
    // Click on the cluster selector
    const clusterButton = page.locator('button:has-text("Select Cluster")');
    await expect(clusterButton).toBeVisible();
    await clusterButton.click();

    // Select the test cluster with OIDC mismatch
    const testCluster = page.locator('text=oidc-mismatch-test-cluster');
    await expect(testCluster).toBeVisible();
    await testCluster.click();

    // If not already authenticated, complete OIDC flow
    const oidcButton = page.locator('button:has-text("Login with OIDC")');
    if (await oidcButton.isVisible()) {
      await oidcButton.click();

      // This would normally redirect to the IdP
      // In a test environment, you'd need to mock or use a test IdP
      // For now, we assume authentication is handled by test setup

      // Wait for potential redirects
      await page.waitForURL(/.*/, { timeout: 5000 }).catch(() => {
        // Redirect might not happen in test environment
      });
    }

    // Step 2: Trigger API request that will fail due to OIDC mismatch
    // Navigate to a resource that requires API call (e.g., pods)
    await page.goto('http://localhost:3000/cluster/oidc-mismatch-test-cluster/pods');

    // Wait for API request to fail
    // The OIDC mismatch alert should appear
    const mismatchAlert = page.locator('text=OIDC Configuration Mismatch');
    await expect(mismatchAlert).toBeVisible({ timeout: 10000 });

    // Step 3: Verify alert content
    const alertBox = page.locator('[role="alert"]');
    await expect(alertBox).toBeVisible();

    // Check for key messages
    await expect(
      page.locator('text=API server is not configured for OIDC')
    ).toBeVisible();

    await expect(
      page.locator('text=Verify that both systems use the same OIDC provider')
    ).toBeVisible();

    // Check that cluster name is displayed
    await expect(page.locator('text=oidc-mismatch-test-cluster')).toBeVisible();

    // Step 4: Verify suggested actions are displayed
    const suggestedActions = [
      'Verify the API server is configured for OIDC authentication',
      'Ensure the OIDC issuer URL matches',
      'Confirm the OIDC client ID is configured',
      'Check the API server logs',
    ];

    for (const action of suggestedActions) {
      await expect(page.locator(`text=${action}`)).toBeVisible();
    }

    // Step 5: Test dismissal of alert
    const dismissButton = page.locator('button:has-text("Dismiss")');
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
      await expect(mismatchAlert).not.toBeVisible();
    }
  });

  test('should not display OIDC mismatch alert for other 401 errors', async ({
    page,
  }) => {
    // This test verifies that the OIDC mismatch detection is specific
    // and doesn't trigger for other types of 401 errors

    // Navigate to a cluster WITHOUT OIDC configured
    const clusterButton = page.locator('button:has-text("Select Cluster")');
    await expect(clusterButton).toBeVisible();
    await clusterButton.click();

    const basicAuthCluster = page.locator('text=basic-auth-test-cluster');
    await expect(basicAuthCluster).toBeVisible();
    await basicAuthCluster.click();

    // Make an API request with expired token
    await page.goto('http://localhost:3000/cluster/basic-auth-test-cluster/pods');

    // Should show generic error, NOT OIDC mismatch alert
    const mismatchAlert = page.locator('text=OIDC Configuration Mismatch');
    await expect(mismatchAlert).not.toBeVisible();

    // Generic error/auth message should be shown instead
    const genericError = page.locator('[role="alert"]');
    await expect(genericError).toBeVisible({ timeout: 5000 });
  });

  test('should not display OIDC mismatch alert when OIDC is not configured', async ({
    page,
  }) => {
    // Navigate to a cluster that doesn't use OIDC
    const clusterButton = page.locator('button:has-text("Select Cluster")');
    await expect(clusterButton).toBeVisible();
    await clusterButton.click();

    const nonOidcCluster = page.locator('text=service-account-cluster');
    await expect(nonOidcCluster).toBeVisible();
    await nonOidcCluster.click();

    // Even if API returns 401, no OIDC mismatch alert should appear
    // (since cluster is not configured for OIDC)
    await page.goto('http://localhost:3000/cluster/service-account-cluster/pods');

    const mismatchAlert = page.locator('text=OIDC Configuration Mismatch');
    await expect(mismatchAlert).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle OIDC mismatch in modal form', async ({ page }) => {
    // Some parts of the UI might prefer to show the alert as a modal
    // This test verifies the modal behavior works correctly

    // Navigate to a cluster with OIDC mismatch
    await page.goto('http://localhost:3000/cluster/oidc-mismatch-test-cluster/dashboard');

    // If alert is shown as modal
    const modalDialog = page.locator('[role="dialog"]');
    if (await modalDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verify modal content
      const modalTitle = page.locator('[role="heading"]:has-text("OIDC Configuration Mismatch")');
      await expect(modalTitle).toBeVisible();

      // Verify dismiss button
      const dismissButton = page.locator('button:has-text("Dismiss")');
      await expect(dismissButton).toBeVisible();

      // Test dismissal
      await dismissButton.click();
      await expect(modalDialog).not.toBeVisible();
    }
  });
});

test.describe('OIDC Mismatch Error Response Format', () => {
  test('should return properly formatted error response from backend', async ({
    request,
  }) => {
    // This test makes direct API requests to verify the error response format
    // Requires a test cluster with OIDC mismatch scenario

    // Make request to Kubernetes API through Headlamp backend
    const response = await request.get(
      'http://localhost:8080/clusters/oidc-mismatch-test/api/v1/pods',
      {
        headers: {
          Authorization: 'Bearer valid-oidc-token-but-api-not-configured',
        },
      }
    );

    // Should get 401 with wrapped error response
    expect(response.status()).toBe(401);

    const responseBody = await response.json();

    // Verify error response structure
    expect(responseBody.kind).toBe('Status');
    expect(responseBody.status).toBe('Failure');
    expect(responseBody.reason).toBe('OIDCConfigMismatch');
    expect(responseBody.details).toBeDefined();
    expect(responseBody.details.errorType).toBe('oidc-mismatch');
    expect(responseBody.details.suggestedAction).toBeDefined();
    expect(responseBody.details.originalStatus).toBe(401);
  });
});
