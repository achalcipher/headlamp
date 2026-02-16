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

import { createContext, useCallback, useContext, useState } from 'react';

export interface OIDCMismatchErrorInfo {
  clusterName: string;
  message: string;
  originalStatus: number;
  suggestedAction: string;
}

interface OIDCMismatchContextType {
  error: OIDCMismatchErrorInfo | null;
  setError: (error: OIDCMismatchErrorInfo | null) => void;
  clearError: () => void;
}

const OIDCMismatchContext = createContext<OIDCMismatchContextType | undefined>(undefined);

export const OIDCMismatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<OIDCMismatchErrorInfo | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <OIDCMismatchContext.Provider value={{ error, setError, clearError }}>
      {children}
    </OIDCMismatchContext.Provider>
  );
};

export const useOIDCMismatch = () => {
  const context = useContext(OIDCMismatchContext);
  if (!context) {
    throw new Error('useOIDCMismatch must be used within OIDCMismatchProvider');
  }
  return context;
};
