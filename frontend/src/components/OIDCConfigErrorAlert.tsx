import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function OIDCConfigErrorHandler() {
  const [error, setError] = useState<{ cluster: string } | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleError = (event: Event) => {
      const err = (event as CustomEvent).detail;
      if (err?.name === 'OIDCConfigError') {
        setError({ cluster: err.clusterName });
      }
    };

    window.addEventListener('oidc-config-error', handleError);
    return () => window.removeEventListener('oidc-config-error', handleError);
  }, []);

  if (!error) return null;

  return (
    <Alert severity="error" onClose={() => setError(null)}>
      <AlertTitle>{t('OIDC Configuration Mismatch')}</AlertTitle>
      {t('Cluster API server is not configured for OIDC.')}
    </Alert>
  );
}
