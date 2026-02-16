# OIDC Mismatch Fix - Quick Reference

## What's the Problem?

When Headlamp is configured for OIDC but the Kubernetes API server isn't:
- ❌ Users see generic "Unauthorized" error
- ❌ Root cause is unclear
- ❌ No guidance on fixing it

## What's the Solution?

- ✅ Backend detects 401/403 with OIDC configured
- ✅ Returns error with `errorType: "oidc-mismatch"`
- ✅ Frontend displays clear, actionable error message
- ✅ User understands the issue and how to fix it

## Files at a Glance

### Backend (Go)
```
backend/pkg/auth/oidcmismatch.go      ← Core logic
backend/pkg/auth/oidcmismatch_test.go ← Tests
```

### Frontend (TypeScript/React)
```
frontend/src/components/OIDCMismatchAlert.tsx                    ← UI component
frontend/src/lib/k8s/apiProxy/detectOIDCMismatch.ts             ← Detection logic
frontend/src/lib/k8s/apiProxy/detectOIDCMismatch.test.ts        ← Tests
```

### Tests (E2E)
```
e2e-tests/tests/oidc-mismatch.spec.ts ← Comprehensive tests
```

### Docs
```
OIDC_MISMATCH_FIX_ANALYSIS.md         ← Design & analysis
OIDC_MISMATCH_FIX_INTEGRATION.md      ← How to integrate
OIDC_MISMATCH_LOCALIZATION.md         ← Translation strings
OIDC_CONFIGURATION_MISMATCH_SUMMARY.md ← This summary
OIDC_MISMATCH_QUICK_REFERENCE.md      ← You are here
```

## Key Functions

### Backend
```go
// Create detector
detector := auth.NewOIDCMismatchDetector(isOIDCConfigured, clusterName)

// Check if mismatch
if detector.DetectMismatch(statusCode, hasToken) {
    // Write wrapped error response
    detector.WriteOIDCMismatchResponse(w, statusCode)
}

// Check for bearer token
if auth.HasBearerToken(authHeader) {
    // ...
}
```

### Frontend
```typescript
// Detect OIDC mismatch from response
const mismatchError = await detectOIDCMismatchError(response, clusterName);
if (mismatchError) {
    // Handle error
}

// Check if error is OIDC mismatch
if (isOIDCMismatchError(error)) {
    // Show alert
}
```

## Integration Checklist

### Backend
- [ ] Copy `oidcmismatch.go` and `oidcmismatch_test.go`
- [ ] Integrate detector in `clusterRequestHandler`
- [ ] Run tests: `go test ./pkg/auth -v`

### Frontend
- [ ] Copy `OIDCMismatchAlert.tsx`
- [ ] Copy `detectOIDCMismatch.ts` and tests
- [ ] Integrate detection in `clusterRequests.ts` error handling
- [ ] Add `OIDCMismatchAlert` to error boundary or auth state
- [ ] Run tests: `npm test detectOIDCMismatch.test.ts`

### Tests
- [ ] Copy E2E test file
- [ ] Run tests: `npm test oidc-mismatch.spec.ts`

### Localization
- [ ] Add strings from `OIDC_MISMATCH_LOCALIZATION.md`
- [ ] Update language JSON files
- [ ] Test in different languages

## Error Response Format

What backend returns:
```json
{
  "kind": "Status",
  "status": "Failure",
  "reason": "OIDCConfigMismatch",
  "details": {
    "errorType": "oidc-mismatch",
    "suggestedAction": "Verify Kubernetes API server OIDC configuration...",
    "originalStatus": 401
  },
  "code": 401
}
```

Frontend detects: `details.errorType === "oidc-mismatch"`

## Test Commands

```bash
# Backend tests
cd backend
go test ./pkg/auth -v -run TestOIDCMismatch

# Frontend tests
cd frontend
npm test -- detectOIDCMismatch.test.ts

# E2E tests
cd e2e-tests
npm test -- oidc-mismatch.spec.ts
```

## When OIDC Mismatch is Detected

✅ Conditions:
1. Cluster configured for OIDC (`context.OidcConf != nil`)
2. Bearer token was sent (`Authorization: Bearer ...`)
3. Kubernetes API returned 401 or 403

❌ Not detected:
- Non-OIDC clusters
- Requests without Bearer token
- Other status codes (200, 500, etc.)
- Other error types

## User Experience Flow

```
1. User logs in via OIDC ✓
2. User tries to access resource
3. API call fails (401)
4. Backend detects mismatch
5. Frontend shows alert:
   "OIDC Configuration Mismatch"
   "API server is not configured for OIDC"
   "Suggested actions: ..."
6. User knows what to do
```

## Localization Languages

Strings provided for:
- English (en)
- Spanish (es)
- German (de)
- French (fr)
- Japanese (ja)
- Simplified Chinese (zh)
- Traditional Chinese (zh-tw)
- Portuguese (pt)
- Korean (ko)

Add to `frontend/src/i18n/locales/*/translation.json`

## Performance Impact

- ⚡ Minimal: Only on 401/403 errors
- ⚡ No extra requests
- ⚡ Simple string/type checking

## Security

✅ No security issues introduced
✅ No sensitive data exposed
✅ OIDC validation unchanged
✅ Follows K8s conventions

## Backward Compatibility

✅ 100% backward compatible
✅ No breaking changes
✅ Only adds new error type
✅ Existing flows unaffected

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Alert not appearing | Check response format, verify cluster has OIDC config |
| Wrong cluster name | Check cluster name passed to detectOIDCMismatchError |
| False positives | Verify isOIDCConfigured flag, check OidcConf != nil |
| Tests failing | Check import paths, verify file locations |

## Documentation Map

```
START HERE
    ↓
OIDC_CONFIGURATION_MISMATCH_SUMMARY.md (this file)
    ↓
OIDC_MISMATCH_FIX_ANALYSIS.md (understand the problem)
    ↓
OIDC_MISMATCH_FIX_INTEGRATION.md (how to integrate)
    ↓
OIDC_MISMATCH_LOCALIZATION.md (translations)
    ↓
Code files (implementation details)
```

## Key Types

### Backend (Go)
```go
type OIDCMismatchDetector struct {
    isOIDCConfigured bool
    clusterName      string
}

type OIDCMismatchErrorResponse struct {
    Kind       string
    Status     string
    Reason     string
    Details    OIDCMismatchDetails
    Code       int
}
```

### Frontend (TypeScript)
```typescript
interface OIDCMismatchError {
    type: 'oidc-mismatch'
    clusterName: string
    message: string
    originalStatus: number
    suggestedAction: string
}

interface OIDCMismatchAlertProps {
    clusterName: string
    isModal?: boolean
    onDismiss?: () => void
}
```

## Testing Scenarios

✅ OIDC mismatch alert displays correctly
✅ Alert shows cluster name
✅ Suggested actions are visible
✅ Modal and inline modes work
✅ Alert doesn't appear for non-OIDC clusters
✅ Alert doesn't appear for other 401 errors
✅ Error response format is correct
✅ Dismissal works properly

## Next Steps

1. Review `OIDC_MISMATCH_FIX_ANALYSIS.md`
2. Read `OIDC_MISMATCH_FIX_INTEGRATION.md`
3. Copy files to your codebase
4. Integrate following the guide
5. Run tests
6. Deploy!

## Questions?

Check the documentation in order:
1. `OIDC_MISMATCH_FIX_ANALYSIS.md` - Why and how
2. `OIDC_MISMATCH_FIX_INTEGRATION.md` - Implementation details
3. Code comments - Specific function details
4. Test files - Usage examples

---

**Status**: Ready to integrate
**Effort**: ~2-4 hours for complete integration
**Risk**: Very low (error path only, backward compatible)
**Value**: High (much better user experience)

