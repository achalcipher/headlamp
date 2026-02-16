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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OIDCMismatchError {
  clusterName: string;
  message: string;
  originalStatus: number;
  suggestedAction: string;
}

interface OIDCMismatchState {
  errors: Record<string, OIDCMismatchError>;
}

const initialState: OIDCMismatchState = {
  errors: {},
};

export const oidcMismatchSlice = createSlice({
  name: 'oidcMismatch',
  initialState,
  reducers: {
    setOIDCMismatchError: (state, action: PayloadAction<OIDCMismatchError>) => {
      state.errors[action.payload.clusterName] = action.payload;
    },
    clearOIDCMismatchError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    clearAllOIDCMismatchErrors: state => {
      state.errors = {};
    },
  },
});

export const { setOIDCMismatchError, clearOIDCMismatchError, clearAllOIDCMismatchErrors } =
  oidcMismatchSlice.actions;

export default oidcMismatchSlice.reducer;
