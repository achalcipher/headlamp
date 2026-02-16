# OIDC Configuration Mismatch Bug Fix - Analysis & Proposal

## Problem Statement

**Issue**: Headlamp is configured for OIDC incluster authentication, but the Kubernetes API server is not. This causes authentication to fail silently or with cryptic error messages, making it unclear to users what the root cause is.

**Expected Outcome**: A clear, user-friendly error message indicating that the API server's OIDC configuration doesn't match Headlamp's expectations.

---

## Current Architecture Analysis

### Backend Flow

1. **Frontend initiates OIDC flow** → hits `/oidc` endpoint with cluster name
   - Location: [backend/cmd/headlamp.go](backend/cmd/headlamp.go#L655)
   - Creates OAuth2 config and redirects to IdP

2. **User authenticates with IdP** → returns code and state
   - Location: [backend/cmd/headlamp.go](backend/cmd/headlamp.go#L752) (`/oidc-callback`)
   - Exchanges code for token, verifies it
   - Stores token in cookie

3. **Frontend makes cluster API requests** with token
   - Location: [frontend/src/lib/k8s/api/v1/clusterRequests.ts](frontend/src/lib/k8s/api/v1/clusterRequests.ts#L180)
   - Token sent in Authorization header or cookie

4. **Backend proxies request to Kubernetes API**
   - Location: [backend/cmd/headlamp.go](backend/cmd/headlamp.go#L1350) (`clusterRequestHandler`)
   - Extracts token from cookie/header in [backend/pkg/auth/auth.go](backend/pkg/auth/auth.go#L69) (`ParseClusterAndToken`)
   - Sets Authorization header with token
   - Uses [backend/pkg/kubeconfig/kubeconfig.go](backend/pkg/kubeconfig/kubeconfig.go#L373) (`ProxyRequest`) to forward

5. **Kubernetes API validates token**
   - If API server is NOT configured for OIDC:
     - Returns 401/403 (Unauthorized/Forbidden)
     - Generic error message
   - Backend [kubeconfig.go](backend/pkg/kubeconfig/kubeconfig.go#L380) just passes through the response

### Frontend Error Handling

- Location: [frontend/src/lib/k8s/api/v1/clusterRequests.ts](frontend/src/lib/k8s/api/v1/clusterRequests.ts#L195)
- On 401 response:
  - If `autoLogoutOnAuthError=true`, automatically logs out user
  - Shows generic "Unauthorized" message
- **Problem**: No way to distinguish OIDC mismatch from genuine auth failures

---

## Root Cause

The Kubernetes API server's response doesn't indicate **why** it rejected the token:
- It doesn't know the token should have been validated via OIDC
- It just sees a bearer token it can't validate and returns 401

Headlamp can detect this scenario by:
1. Knowing that Headlamp is configured for OIDC
2. Seeing a 401/403 when forwarding an OIDC token to the API
3. Inferring the API server doesn't support OIDC validation

---

## Proposed Solution

### Architecture: Three-Layer Detection

#### Layer 1: Backend Error Interception (New)
**File**: [backend/cmd/headlamp.go](backend/cmd/headlamp.go) - Add middleware to `clusterRequestHandler`

**Goal**: Detect 401/403 responses from Kubernetes API when OIDC is configured

```go
// New middleware: oidcMismatchDetector
// If:
//   - Cluster is configured for OIDC (context.OidcConf != nil)
//   - Response status is 401 or 403
//   - Request had a Bearer token (Authorization header set)
// Then:
//   - Wrap response to include error type "oidc-mismatch"
//   - Log warning with diagnostic info
```

**Implementation Location**: Add after `kContext.ProxyRequest(w, r)` call at [backend/cmd/headlamp.go:1350](backend/cmd/headlamp.go#L1350)

**Response Format**:
```json
{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {},
  "status": "Failure",
  "message": "OIDC token validation failed",
  "reason": "OIDCConfigMismatch",
  "details": {
    "errorType": "oidc-mismatch",
    "clusterOidcConfigured": true,
    "suggestedAction": "Verify that Kubernetes API server is configured with the same OIDC provider settings"
  },
  "code": 401
}
```

#### Layer 2: Frontend Error Detection (New)
**File**: [frontend/src/lib/k8s/api/v1/clusterRequests.ts](frontend/src/lib/k8s/api/v1/clusterRequests.ts#L195)

**Goal**: Parse the error response and detect OIDC mismatch

```typescript
// After response.ok check (line 195)
// If status is 401/403:
//   1. Try to parse JSON response
//   2. Check if response.details.errorType === "oidc-mismatch"
//   3. If true, throw ApiError with specific type
//   4. Frontend components can then display special warning
```

**Implementation Location**: [frontend/src/lib/k8s/api/v1/clusterRequests.ts](frontend/src/lib/k8s/api/v1/clusterRequests.ts#L195)

#### Layer 3: Frontend UI Display (New)
**File**: Add to [frontend/src/components/AuthChecker.tsx](frontend/src/components/) (or create new component)

**Goal**: Show user-friendly warning about OIDC mismatch

**UI Pattern**:
- Modal/Alert component displayed when OIDC mismatch error occurs
- Clear message: "API Server OIDC Configuration Mismatch"
- Explanation: "Headlamp is configured to use OIDC authentication, but the Kubernetes API server is not. Please verify that both systems use the same OIDC provider and configuration."
- Action: Option to retry or navigate to troubleshooting docs

---

## Implementation Details

### Backend Changes

#### 1. Create OIDC Mismatch Detector Middleware
**File**: [backend/pkg/auth/auth.go](backend/pkg/auth/auth.go) (or new file `backend/pkg/auth/oidcmismatch.go`)

```go
package auth

import (
	"io"
	"net/http"
)

// OIDCMismatchDetectorMiddleware detects when Headlamp is configured for OIDC
// but the Kubernetes API server doesn't support it, returning 401/403.
type OIDCMismatchDetectorMiddleware struct {
	isOIDCConfigured bool
	clusterName      string
}

// NewOIDCMismatchDetector creates a new OIDC mismatch detector
func NewOIDCMismatchDetector(isOIDCConfigured bool, clusterName string) *OIDCMismatchDetectorMiddleware {
	return &OIDCMismatchDetectorMiddleware{
		isOIDCConfigured: isOIDCConfigured,
		clusterName:      clusterName,
	}
}

// DetectMismatch checks if the response indicates an OIDC mismatch
func (o *OIDCMismatchDetectorMiddleware) DetectMismatch(
	statusCode int,
	hadBearerToken bool,
) bool {
	return o.isOIDCConfigured &&
		hadBearerToken &&
		(statusCode == http.StatusUnauthorized || statusCode == http.StatusForbidden)
}

// WrapErrorResponse wraps a 401/403 response with OIDC mismatch details
func WrapOIDCMismatchResponse(w http.ResponseWriter, statusCode int, body []byte) error {
	errorResponse := map[string]interface{}{
		"kind":       "Status",
		"apiVersion": "v1",
		"metadata":   map[string]interface{}{},
		"status":     "Failure",
		"message":    "Kubernetes API server may not be configured for OIDC",
		"reason":     "OIDCConfigMismatch",
		"details": map[string]interface{}{
			"errorType":              "oidc-mismatch",
			"suggestedAction":        "Verify Kubernetes API server OIDC configuration matches Headlamp settings",
			"originalStatusCode":     statusCode,
			"originalErrorBodySize": len(body),
		},
		"code": statusCode,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	return json.NewEncoder(w).Encode(errorResponse)
}
```

#### 2. Integrate into Handler
**File**: [backend/cmd/headlamp.go](backend/cmd/headlamp.go#L1350)

Modify `clusterRequestHandler` to:
1. Check if context has OIDC config
2. Check if request had Bearer token
3. Capture response status
4. Wrap 401/403 responses if OIDC mismatch detected

### Frontend Changes

#### 1. Enhanced Error Handling in API Layer
**File**: [frontend/src/lib/k8s/api/v1/clusterRequests.ts](frontend/src/lib/k8s/api/v1/clusterRequests.ts#L195)

```typescript
// Add error detection logic
async function detectOIDCMismatch(response: Response): Promise<boolean> {
  try {
    const json = await response.clone().json();
    return json?.details?.errorType === 'oidc-mismatch';
  } catch {
    return false;
  }
}

// In clusterRequest function, after checking response.ok:
if (!response.ok) {
  const isOIDCMismatch = await detectOIDCMismatch(response);
  // Pass flag to error handler or throw specific error
}
```

#### 2. Create OIDC Error Component
**File**: `frontend/src/components/OIDCMismatchAlert.tsx` (new)

```typescript
import { Alert, AlertTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function OIDCMismatchAlert({ clusterName }: { clusterName: string }) {
  const { t } = useTranslation();
  
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      <AlertTitle>{t('OIDC Configuration Mismatch')}</AlertTitle>
      {t('Headlamp is configured for OIDC authentication, but the Kubernetes API server is not. ' +
        'Please verify both systems use the same OIDC provider and configuration.')}
      <br />
      <small>{t('Cluster')}: {clusterName}</small>
    </Alert>
  );
}
```

#### 3. Display in Error Boundary or Auth Checker
**Location**: Existing error handling components or auth state management

---

## Error Handling Flow Diagram

```
User Authenticates with IdP
    ↓
Headlamp receives OIDC token
    ↓
Frontend sends API request with token
    ↓
Backend extracts token → Sets Authorization header
    ↓
Backend forwards to Kubernetes API
    ↓
API Server cannot validate OIDC token (not configured for it)
    ↓
API returns 401 Unauthorized
    ↓
[NEW] Backend middleware detects:
      - OIDC is configured for cluster
      - Token was sent
      - Got 401/403
      → Wraps response with error type "oidc-mismatch"
    ↓
[NEW] Frontend detects error type "oidc-mismatch"
    ↓
[NEW] UI displays OIDCMismatchAlert component
    ↓
User sees clear message about config mismatch
```

---

## Follow Existing Patterns

### Backend Error Handling
- Similar to existing auth errors in [backend/pkg/auth/auth.go](backend/pkg/auth/auth.go#L319) (`writeMeJSON` pattern)
- Uses Kubernetes Status object format (already established)
- Logs errors like existing middleware

### Frontend Error Handling
- Follows current pattern in [clusterRequests.ts](frontend/src/lib/k8s/api/v1/clusterRequests.ts#L195)
- Uses existing `autoLogoutOnAuthError` pattern (can add similar `autoLogoutOnOIDCMismatch` flag if needed)
- Component pattern matches existing error alerts

### OIDC Flow Compatibility
- Only affects error path, not standard OIDC flow
- Doesn't change token validation logic
- Works with both PKCE and non-PKCE flows

---

## Test Case

### Scenario: OIDC Mismatch Detection

**Setup**:
1. Cluster A: Configured with OIDC in Headlamp
2. Kubernetes API Server: NOT configured for OIDC validation

**Test Steps**:
1. User logs in via OIDC (completes IdP authentication)
2. User makes API request (e.g., fetch pods)
3. Backend receives request with valid OIDC token
4. Backend forwards to Kubernetes API
5. Kubernetes API returns 401 (can't validate token)

**Expected Behavior**:
1. Backend detects OIDC mismatch (has OIDC config + got 401 + had Bearer token)
2. Backend wraps error with `errorType: "oidc-mismatch"`
3. Frontend detects error type in response
4. UI displays `OIDCMismatchAlert` with:
   - Title: "OIDC Configuration Mismatch"
   - Message: Clear explanation and remediation steps
   - Cluster name for context

**Assertions**:
- [ ] Backend returns wrapped error response with `errorType: "oidc-mismatch"`
- [ ] Frontend correctly parses and detects error type
- [ ] Alert component is rendered with correct text
- [ ] Alert displays cluster name
- [ ] User doesn't get auto-logged out (or only after acknowledgment)
- [ ] Standard OIDC flows still work (no regression)

### Test Implementation

**Unit Test** (Backend):
- Location: `backend/pkg/auth/auth_test.go` (or new `oidcmismatch_test.go`)
- Test `DetectMismatch` with various combinations of OIDC config, status codes, Bearer tokens

**Integration Test** (Frontend):
- Location: `frontend/src/lib/k8s/api/v1/clusterRequests.test.ts` or new file
- Mock API response with `errorType: "oidc-mismatch"`
- Test that frontend correctly detects and handles error

**E2E Test**:
- Location: `e2e-tests/tests/oidc-mismatch.spec.ts` (new)
- Set up cluster with OIDC configured in Headlamp but not in Kubernetes
- Verify alert appears in UI with correct message

---

## Benefits

✅ **User-Friendly**: Clear message instead of cryptic "Unauthorized"
✅ **Diagnostic**: Helps users quickly identify root cause
✅ **Non-Breaking**: Only affects error path, standard flows unchanged
✅ **Follows Patterns**: Uses existing error handling conventions
✅ **Testable**: Clear detection logic and UI verification
✅ **Reversible**: Can be disabled/refined based on feedback

---

## Alternative Approaches Considered

### 1. Custom HTTP Header
**Idea**: Backend adds header like `X-OIDC-Mismatch: true`
**Pros**: Simpler, less payload
**Cons**: Headers can be lost in some proxies, less standard

**Decision**: Rejected - Using response body is more reliable and follows Kubernetes conventions

### 2. Query Parameter Check
**Idea**: Frontend queries `/clusters/{clusterName}/oidc-status` before making API calls
**Pros**: Proactive, can warn before user sees error
**Cons**: Extra request overhead, changes UX flow

**Decision**: Rejected - Reactive approach simpler, only shows warning when actually needed

### 3. Separate Auth Endpoint
**Idea**: Use `/me` endpoint to validate OIDC before other requests
**Pros**: Can validate once per session
**Cons**: Already exists, but would require running first

**Decision**: Partially used - `/me` endpoint is already called, can enhance it

---

## Migration Path

1. **Phase 1** (Current): Implement backend detection + basic frontend handling
2. **Phase 2** (Optional): Add proactive validation via enhanced `/me` endpoint
3. **Phase 3** (Optional): Add troubleshooting wizard for admins

---

## Documentation Updates Needed

- Update [docs/installation/](docs/installation/) with OIDC mismatch troubleshooting section
- Update OIDC configuration guide with validation steps
- Add FAQ entry: "What does 'OIDC Configuration Mismatch' mean?"

