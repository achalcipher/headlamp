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

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface OIDCMismatchAlertProps {
  /** Name of the cluster experiencing the mismatch */
  clusterName: string;
  /** Whether to show as a modal dialog instead of inline alert */
  isModal?: boolean;
  /** Callback when user dismisses the alert */
  onDismiss?: () => void;
}

/**
 * OIDCMismatchAlert displays a user-friendly error message when Headlamp is
 * configured for OIDC authentication but the Kubernetes API server is not.
 *
 * This helps users quickly identify and resolve OIDC configuration mismatches
 * instead of seeing cryptic "Unauthorized" errors.
 */
export function OIDCMismatchAlert({
  clusterName,
  isModal = false,
  onDismiss,
}: OIDCMismatchAlertProps) {
  const { t } = useTranslation();

  const title = t('OIDC Configuration Mismatch');
  const message = t(
    'oidc_mismatch_message',
    'Headlamp is configured to use OIDC authentication, but the Kubernetes API server is not. Please verify that both systems are configured with the same OIDC provider and settings.'
  );
  const troubleshootingLink = t(
    'oidc_mismatch_help',
    'See troubleshooting guide for more information.'
  );

  if (isModal) {
    return (
      <Dialog open onClose={onDismiss} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2 }}>{message}</Box>
            <Box sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 1 }}>
              <strong>{t('Cluster')}:</strong> {clusterName}
            </Box>
            <Box sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{troubleshootingLink}</Box>
            <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
              <strong>{t('Suggested Actions')}:</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
                <li>{t('Verify the API server is configured for OIDC authentication')}</li>
                <li>
                  {t('Ensure the OIDC issuer URL matches between Headlamp and the API server')}
                </li>
                <li>{t('Confirm the OIDC client ID is configured in the API server')}</li>
                <li>{t('Check the API server logs for more detailed error information')}</li>
              </ul>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onDismiss} variant="contained">
            {t('Dismiss')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Alert severity="error" sx={{ mb: 2 }} onClose={onDismiss}>
      <AlertTitle>{title}</AlertTitle>
      <Box sx={{ mb: 1 }}>{message}</Box>
      <Box sx={{ fontSize: '0.9rem', mb: 1 }}>
        <strong>{t('Cluster')}:</strong> {clusterName}
      </Box>
      <Box sx={{ fontSize: '0.85rem', color: 'error.dark' }}>{troubleshootingLink}</Box>
      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
        <strong>{t('Suggested Actions')}:</strong>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
          <li>{t('Verify the API server is configured for OIDC authentication')}</li>
          <li>{t('Ensure the OIDC issuer URL matches between Headlamp and the API server')}</li>
          <li>{t('Confirm the OIDC client ID is configured in the API server')}</li>
          <li>{t('Check the API server logs for more detailed error information')}</li>
        </ul>
      </Box>
    </Alert>
  );
}
