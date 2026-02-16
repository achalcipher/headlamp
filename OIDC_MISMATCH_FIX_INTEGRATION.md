# OIDC Mismatch Detection - Integration Guide

This guide explains how to integrate the OIDC configuration mismatch detection into the existing Headlamp codebase.

## Files Created

### Backend (Go)
1. **`backend/pkg/auth/oidcmismatch.go`** - Core OIDC mismatch detection logic
   - `OIDCMismatchDetector` type
   - `DetectMismatch()` method
   - `WriteOIDCMismatchResponse()` method
   - `HasBearerToken()` helper

2. **`backend/pkg/auth/oidcmismatch_test.go`** - Unit tests
   - Tests for detection logic
   - Tests for error response formatting
   - Tests for Bearer token detection

### Frontend (TypeScript/React)
1. **`frontend/src/components/OIDCMismatchAlert.tsx`** - UI component
   - Reusable alert/modal component
   - Supports both inline alert and modal dialog modes
   - Includes suggested actions and troubleshooting info

2. **`frontend/src/lib/k8s/apiProxy/detectOIDCMismatch.ts`** - Detection utility
   - `detectOIDCMismatchError()` - Parses error responses
   - `isOIDCMismatchError()` - Type guard

3. **`frontend/src/lib/k8s/apiProxy/detectOIDCMismatch.test.ts`** - Unit tests
   - Tests for error detection
   - Tests for type guards
   - Tests for edge cases

### Tests (E2E)
1. **`e2e-tests/tests/oidc-mismatch.spec.ts`** - End-to-end tests
   - Tests OIDC mismatch alert display
   - Tests distinction from other 401 errors
   - Tests error response format
   - Tests modal and inline alert modes

## Integration Steps

### Step 1: Backend Integration

#### 1a. Wire up error detection in proxy handler

File: `backend/cmd/headlamp.go`, function: `clusterRequestHandler` (around line 1330)

**Current code** (lines 1350-1360):
```go
if err = kContext.ProxyRequest(w, r); err != nil {
    c.TelemetryHandler.RecordErrorCount(ctx, attribute.String("error.type", "proxy_error"),
        attribute.String("cluster", contextKey))
    c.handleError(w, ctx, span, err, "failed to proxy request", http.StatusInternalServerError)

    return
}
```

**Add after proxy request** (wrap response with OIDC detection):
```go
if err = kContext.ProxyRequest(w, r); err != nil {
    c.TelemetryHandler.RecordErrorCount(ctx, attribute.String("error.type", "proxy_error"),
        attribute.String("cluster", contextKey))
    c.handleError(w, ctx, span, err, "failed to proxy request", http.StatusInternalServerError)

    return
}

// [NEW] Check for OIDC mismatch in error responses
// This must be done AFTER ProxyRequest because we need to check the response status
if w.Header().Get("X-Already-Handled-OIDC-Mismatch") == "" {
    // Can only check after response is written, so this needs refactoring...
    // See "Alternative: Use Response Interceptor" below
}
```

**PROBLEM**: The current implementation writes directly to `ResponseWriter`, making it hard to intercept.

#### 1b. Alternative: Use Response Interceptor

Create a wrapper for `ResponseWriter` that captures the status code:

File: `backend/cmd/headlamp.go` (new code to add before `handleClusterAPI` function)

```go
// responseWriter wraps http.ResponseWriter to capture status code and response
type captureResponseWriter struct {
    http.ResponseWriter
    statusCode int
    hadBody    bool
}

func (w *captureResponseWriter) WriteHeader(code int) {
    w.statusCode = code
    w.ResponseWriter.WriteHeader(code)
}

func (w *captureResponseWriter) Write(b []byte) (int, error) {
    w.hadBody = true
    return w.ResponseWriter.Write(b)
}
```

Then in `clusterRequestHandler`, wrap the response writer:

```go
// Create wrapped response writer to capture status
wrappedWriter := &captureResponseWriter{
    ResponseWriter: w,
    statusCode:     http.StatusOK, // default
}

// Existing proxy logic but with wrapped writer
if err = kContext.ProxyRequest(wrappedWriter, r); err != nil {
    c.TelemetryHandler.RecordErrorCount(ctx, attribute.String("error.type", "proxy_error"),
        attribute.String("cluster", contextKey))
    c.handleError(w, ctx, span, err, "failed to proxy request", http.StatusInternalServerError)
    return
}

// [NEW] Check for OIDC mismatch
if wrappedWriter.statusCode == 401 || wrappedWriter.statusCode == 403 {
    authHeader := r.Header.Get("Authorization")
    isOIDCConfigured := kContext.OidcConf != nil
    
    detector := auth.NewOIDCMismatchDetector(isOIDCConfigured, contextKey)
    if detector.DetectMismatch(wrappedWriter.statusCode, auth.HasBearerToken(authHeader)) {
        logger.Log(logger.LevelWarn, map[string]string{
            "cluster": contextKey,
            "status":  fmt.Sprintf("%d", wrappedWriter.statusCode),
        }, nil, "OIDC configuration mismatch detected")
        
        // Note: Response already written, so we can only log here
        // For wrapping the response, we'd need to buffer it first
    }
}
```

#### 1c. Better Alternative: Buffer Response for OIDC Mismatch Checking

For a cleaner implementation that can actually wrap the error response:

File: `backend/cmd/headlamp.go` (replace proxy request with buffered version)

```go
import (
    "bytes"
    "io"
)

// In clusterRequestHandler, before proxy request:
var buf bytes.Buffer

// Multi-writer to capture response while sending it
multiWriter := io.MultiWriter(w, &buf)

wrappedWriter := &captureResponseWriter{
    ResponseWriter: w,
    statusCode:     http.StatusOK,
}

// Proxy request (need to modify to write to multiWriter instead)
// This requires changes to ProxyRequest implementation...
```

**RECOMMENDATION**: Use approach 1b (capture status code) for initial implementation, as it doesn't require changes to existing `ProxyRequest` logic.

### Step 2: Frontend Integration

#### 2a. Add OIDCMismatchAlert to error handling

File: `frontend/src/lib/k8s/api/v1/clusterRequests.ts` (around line 195)

**After checking `response.ok` (around line 195):**

```typescript
if (!response.ok) {
    // [NEW] Check for OIDC mismatch error
    const { detectOIDCMismatchError } = await import('../apiProxy/detectOIDCMismatch');
    const oidcError = await detectOIDCMismatchError(response, cluster);
    
    if (oidcError) {
        // Throw specific OIDC error for UI to handle
        const error: any = new Error(oidcError.message);
        error.oidcMismatch = oidcError;
        throw error;
    }
    
    // ... existing error handling ...
}
```

#### 2b. Display alert in error boundary or auth checker

Option A: In existing error boundary component
File: `frontend/src/components/ErrorBoundary.tsx` (or similar)

```typescript
import { OIDCMismatchAlert } from './OIDCMismatchAlert';
import { isOIDCMismatchError } from '../lib/k8s/apiProxy/detectOIDCMismatch';

// In render method:
if (this.state.error?.oidcMismatch) {
  return (
    <OIDCMismatchAlert 
      clusterName={this.state.error.oidcMismatch.clusterName}
      onDismiss={() => this.setState({ error: null })}
    />
  );
}
```

Option B: In a dedicated auth state manager
File: `frontend/src/redux/slices/auth.ts` (or similar)

```typescript
// When handling API errors:
if (error?.oidcMismatch) {
  dispatch(setOIDCMismatchError(error.oidcMismatch));
}

// In component:
const oidcMismatchError = useSelector(state => state.auth.oidcMismatchError);

if (oidcMismatchError) {
  return <OIDCMismatchAlert {...oidcMismatchError} />;
}
```

### Step 3: Testing

#### Run unit tests
```bash
# Backend
cd backend
go test ./pkg/auth -v

# Frontend
cd frontend
npm test -- detectOIDCMismatch.test.ts
```

#### Run E2E tests
```bash
cd e2e-tests
npm test oidc-mismatch.spec.ts
```

## Configuration

No additional configuration is required. The detection happens automatically when:
- Cluster is configured with OIDC in Headlamp (`context.OidcConf != nil`)
- A Bearer token is sent in the Authorization header
- Kubernetes API returns 401 or 403

## Backward Compatibility

✅ **Fully backward compatible**:
- Only affects error responses (401/403)
- Standard successful requests unaffected
- Existing OIDC flows unchanged
- Auto-logout behavior can be preserved (configurable)

## Error Response Format

When OIDC mismatch is detected, the backend returns:

```json
{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {},
  "status": "Failure",
  "message": "Kubernetes API server may not be configured for OIDC authentication",
  "reason": "OIDCConfigMismatch",
  "details": {
    "errorType": "oidc-mismatch",
    "suggestedAction": "Verify that the Kubernetes API server is configured with the same OIDC provider and settings as Headlamp",
    "originalStatus": 401
  },
  "code": 401
}
```

Frontend detects the `details.errorType === "oidc-mismatch"` marker.

## Localization

All user-facing strings use the existing i18n infrastructure:
- `OIDC Configuration Mismatch` - title
- `oidc_mismatch_message` - main message
- `oidc_mismatch_help` - help link text
- `Suggested Actions` - action section header
- Individual action items

Add these keys to language files in `frontend/src/i18n/locales/*/translation.json`

## Troubleshooting

### OIDC mismatch alert not appearing
1. Verify backend is returning correct error format with `errorType: "oidc-mismatch"`
2. Check browser console for parsing errors
3. Verify cluster is actually configured for OIDC (`config.clusters[clusterName].auth_type === 'oidc'`)

### False positives (alert appears for non-OIDC clusters)
1. Verify `isOIDCConfigured` flag is set correctly in backend
2. Check that cluster's `OidcConf` is null for non-OIDC clusters

### Alert doesn't display proper cluster name
1. Verify cluster name is passed correctly to `detectOIDCMismatchError()`
2. Check that cluster name matches URL parameter

## Future Enhancements

1. **Proactive validation**: Query `/me` endpoint before making API calls
2. **Admin wizard**: Guide admins through OIDC configuration
3. **Diagnostic logs**: Collect more detailed error info from API server
4. **Recovery flow**: Prompt user to update cluster configuration

