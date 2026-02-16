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
 * Custom error thrown when OIDC configuration mismatch is detected.
 * This occurs when Headlamp is OIDC-enabled but the Kubernetes API server is not.
 */
export class OIDCConfigError extends Error {
  constructor(public clusterName: string) {
    super(`OIDC configuration mismatch on cluster: ${clusterName}`);
    this.name = 'OIDCConfigError';
  }
}
