/**
 * Custom error thrown when OIDC configuration mismatch is detected.
 * This occurs when Headlamp is OIDC-enabled but the Kubernetes API server is not.
 */
export class OIDCConfigError extends Error {
  constructor(public clusterName: string) {
    super(`OIDC configuration mismatch on cluster: ${clusterName}`);
    this.name = 'OIDCConfigError';
  }
}
