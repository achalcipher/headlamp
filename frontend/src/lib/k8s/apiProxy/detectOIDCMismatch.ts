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

/**
 * Represents an OIDC mismatch error detected from the backend.
 */
export interface OIDCMismatchError {
  type: 'oidc-mismatch';
  clusterName: string;
  message: string;
  originalStatus: number;
  suggestedAction: string;
}

/**
 * Detects if a response indicates an OIDC configuration mismatch.
 *
 * The backend detects OIDC mismatch when:
 * - Headlamp is configured for OIDC
 * - A Bearer token was sent
 * - The Kubernetes API server returned 401/403
 *
 * If detected, the backend wraps the error response with details indicating
 * the mismatch. This function parses that response.
 *
 * @param response - The HTTP response from the API
 * @returns OIDCMismatchError if mismatch detected, null otherwise
 */
export async function detectOIDCMismatchError(
  response: Response,
  clusterName?: string
): Promise<OIDCMismatchError | null> {
  // Only check 401/403 responses
  if (response.status !== 401 && response.status !== 403) {
    return null;
  }

  try {
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return null;
    }

    const json = await response.clone().json();

    // Check if this is an OIDC mismatch error from the backend
    if (json?.details?.errorType === 'oidc-mismatch') {
      return {
        type: 'oidc-mismatch',
        clusterName: clusterName || 'unknown',
        message: json.message || 'OIDC configuration mismatch detected',
        originalStatus: json.details?.originalStatus || response.status,
        suggestedAction:
          json.details?.suggestedAction ||
          'Verify Kubernetes API server OIDC configuration matches Headlamp settings',
      };
    }

    return null;
  } catch {
    // If response parsing fails, it's not an OIDC mismatch error
    return null;
  }
}

/**
 * Checks if an error object is an OIDC mismatch error.
 *
 * @param error - The error to check
 * @returns true if error is an OIDCMismatchError, false otherwise
 */
export function isOIDCMismatchError(error: unknown): error is OIDCMismatchError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as any).type === 'oidc-mismatch'
  );
}
