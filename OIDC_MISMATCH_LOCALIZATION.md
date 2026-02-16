# OIDC Mismatch - Localization Strings

This document contains the localization strings needed for the OIDC mismatch feature.

## English (en)

Add these entries to `frontend/src/i18n/locales/en/translation.json`:

```json
{
  "OIDC Configuration Mismatch": "OIDC Configuration Mismatch",
  "oidc_mismatch_message": "Headlamp is configured to use OIDC authentication, but the Kubernetes API server is not. Please verify that both systems are configured with the same OIDC provider and settings.",
  "oidc_mismatch_help": "See troubleshooting guide for more information.",
  "oidc_mismatch_suggested_actions": "Suggested Actions:",
  "oidc_verify_api_configured": "Verify the API server is configured for OIDC authentication",
  "oidc_verify_issuer_url": "Ensure the OIDC issuer URL matches between Headlamp and the API server",
  "oidc_verify_client_id": "Confirm the OIDC client ID is configured in the API server",
  "oidc_check_api_logs": "Check the API server logs for more detailed error information",
  "oidc_mismatch_cluster_label": "Cluster"
}
```

## Spanish (es)

Add to `frontend/src/i18n/locales/es/translation.json`:

```json
{
  "OIDC Configuration Mismatch": "Falta de coincidencia en la configuración de OIDC",
  "oidc_mismatch_message": "Headlamp está configurado para usar autenticación OIDC, pero el servidor de API de Kubernetes no. Verifique que ambos sistemas estén configurados con el mismo proveedor OIDC y configuración.",
  "oidc_mismatch_help": "Consulte la guía de solución de problemas para obtener más información.",
  "oidc_mismatch_suggested_actions": "Acciones sugeridas:",
  "oidc_verify_api_configured": "Verifique que el servidor API esté configurado para autenticación OIDC",
  "oidc_verify_issuer_url": "Asegúrese de que la URL del emisor de OIDC coincida entre Headlamp y el servidor API",
  "oidc_verify_client_id": "Confirme que el ID del cliente OIDC esté configurado en el servidor API",
  "oidc_check_api_logs": "Verifique los registros del servidor API para obtener información de error más detallada",
  "oidc_mismatch_cluster_label": "Clúster"
}
```

## German (de)

Add to `frontend/src/i18n/locales/de/translation.json`:

```json
{
  "OIDC Configuration Mismatch": "OIDC-Konfigurationskonflikt",
  "oidc_mismatch_message": "Headlamp ist für die OIDC-Authentifizierung konfiguriert, der Kubernetes-API-Server jedoch nicht. Bitte überprüfen Sie, dass beide Systeme mit demselben OIDC-Provider und denselben Einstellungen konfiguriert sind.",
  "oidc_mismatch_help": "Weitere Informationen finden Sie in der Troubleshooting-Anleitung.",
  "oidc_mismatch_suggested_actions": "Empfohlene Aktionen:",
  "oidc_verify_api_configured": "Überprüfen Sie, dass der API-Server für die OIDC-Authentifizierung konfiguriert ist",
  "oidc_verify_issuer_url": "Stellen Sie sicher, dass die OIDC-Aussteller-URL zwischen Headlamp und dem API-Server übereinstimmt",
  "oidc_verify_client_id": "Bestätigen Sie, dass die OIDC-Client-ID im API-Server konfiguriert ist",
  "oidc_check_api_logs": "Überprüfen Sie die API-Server-Protokolle für detailliertere Fehlerinformationen",
  "oidc_mismatch_cluster_label": "Cluster"
}
```

## French (fr)

Add to `frontend/src/i18n/locales/fr/translation.json`:

```json
{
  "OIDC Configuration Mismatch": "Discordance de configuration OIDC",
  "oidc_mismatch_message": "Headlamp est configuré pour utiliser l'authentification OIDC, mais le serveur API Kubernetes ne l'est pas. Veuillez vérifier que les deux systèmes sont configurés avec le même fournisseur OIDC et les mêmes paramètres.",
  "oidc_mismatch_help": "Consultez le guide de dépannage pour plus d'informations.",
  "oidc_mismatch_suggested_actions": "Actions suggérées:",
  "oidc_verify_api_configured": "Vérifiez que le serveur API est configuré pour l'authentification OIDC",
  "oidc_verify_issuer_url": "Assurez-vous que l'URL du fournisseur OIDC correspond entre Headlamp et le serveur API",
  "oidc_verify_client_id": "Confirmez que l'ID client OIDC est configuré dans le serveur API",
  "oidc_check_api_logs": "Vérifiez les journaux du serveur API pour des informations d'erreur plus détaillées",
  "oidc_mismatch_cluster_label": "Cluster"
}
```

## Japanese (ja)

Add to `frontend/src/i18n/locales/ja/translation.json`:

```json
{
  "OIDC Configuration Mismatch": "OIDC設定の不一致",
  "oidc_mismatch_message": "Headlampはoidc認証用に設定されていますが、Kubernetes APIサーバーはそうではありません。両方のシステムが同じOIDCプロバイダーと設定で設定されていることを確認してください。",
  "oidc_mismatch_help": "詳細については、トラブルシューティングガイドを参照してください。",
  "oidc_mismatch_suggested_actions": "推奨アクション:",
  "oidc_verify_api_configured": "APIサーバーがOIDC認証用に設定されていることを確認します",
  "oidc_verify_issuer_url": "OIDCの発行者URLがHeadlampとAPIサーバー間で一致していることを確認してください",
  "oidc_verify_client_id": "OIDCクライアントIDがAPIサーバーで設定されていることを確認してください",
  "oidc_check_api_logs": "APIサーバーログで詳細なエラー情報を確認してください",
  "oidc_mismatch_cluster_label": "クラスター"
}
```

## Simplified Chinese (zh)

Add to `frontend/src/i18n/locales/zh/translation.json`:

```json
{
  "OIDC Configuration Mismatch": "OIDC配置不匹配",
  "oidc_mismatch_message": "Headlamp配置为使用OIDC身份验证，但Kubernetes API服务器不是。请验证两个系统都配置了相同的OIDC提供商和设置。",
  "oidc_mismatch_help": "有关更多信息，请参阅故障排除指南。",
  "oidc_mismatch_suggested_actions": "建议的操作：",
  "oidc_verify_api_configured": "验证API服务器已配置为OIDC身份验证",
  "oidc_verify_issuer_url": "确保OIDC发行者URL在Headlamp和API服务器之间匹配",
  "oidc_verify_client_id": "确认OIDC客户端ID已在API服务器中配置",
  "oidc_check_api_logs": "检查API服务器日志以获取更详细的错误信息",
  "oidc_mismatch_cluster_label": "集群"
}
```

## Traditional Chinese (zh-tw)

Add to `frontend/src/i18n/locales/zh-tw/translation.json`:

```json
{
  "OIDC Configuration Mismatch": "OIDC設定不匹配",
  "oidc_mismatch_message": "Headlamp已配置為使用OIDC身份驗證，但Kubernetes API伺服器並未配置。請驗證兩個系統都使用相同的OIDC提供商和設定。",
  "oidc_mismatch_help": "有關詳細信息，請參閱故障排除指南。",
  "oidc_mismatch_suggested_actions": "建議的動作：",
  "oidc_verify_api_configured": "驗證API伺服器已配置為OIDC身份驗證",
  "oidc_verify_issuer_url": "確保OIDC簽發者URL在Headlamp和API伺服器之間相符",
  "oidc_verify_client_id": "確認OIDC用戶端ID已在API伺服器中設定",
  "oidc_check_api_logs": "檢查API伺服器日誌以取得更詳細的錯誤信息",
  "oidc_mismatch_cluster_label": "叢集"
}
```

## Portuguese (pt)

Add to `frontend/src/i18n/locales/pt/translation.json`:

```json
{
  "OIDC Configuration Mismatch": "Incompatibilidade de configuração OIDC",
  "oidc_mismatch_message": "O Headlamp está configurado para usar autenticação OIDC, mas o servidor da API Kubernetes não está. Verifique se ambos os sistemas estão configurados com o mesmo provedor OIDC e as mesmas configurações.",
  "oidc_mismatch_help": "Consulte o guia de solução de problemas para mais informações.",
  "oidc_mismatch_suggested_actions": "Ações Sugeridas:",
  "oidc_verify_api_configured": "Verifique se o servidor API está configurado para autenticação OIDC",
  "oidc_verify_issuer_url": "Certifique-se de que a URL do provedor OIDC corresponde entre Headlamp e o servidor API",
  "oidc_verify_client_id": "Confirme que a ID do cliente OIDC está configurada no servidor API",
  "oidc_check_api_logs": "Verifique os registros do servidor API para informações de erro mais detalhadas",
  "oidc_mismatch_cluster_label": "Cluster"
}
```

## Korean (ko)

Add to `frontend/src/i18n/locales/ko/translation.json`:

```json
{
  "OIDC Configuration Mismatch": "OIDC 구성 불일치",
  "oidc_mismatch_message": "Headlamp은 OIDC 인증을 사용하도록 구성되어 있지만 Kubernetes API 서버는 그렇지 않습니다. 두 시스템이 동일한 OIDC 공급자 및 설정으로 구성되어 있는지 확인하세요.",
  "oidc_mismatch_help": "자세한 내용은 문제 해결 가이드를 참조하세요.",
  "oidc_mismatch_suggested_actions": "권장 조치:",
  "oidc_verify_api_configured": "API 서버가 OIDC 인증을 위해 구성되었는지 확인하세요",
  "oidc_verify_issuer_url": "OIDC 발급자 URL이 Headlamp과 API 서버 간에 일치하는지 확인하세요",
  "oidc_verify_client_id": "OIDC 클라이언트 ID가 API 서버에 구성되었는지 확인하세요",
  "oidc_check_api_logs": "API 서버 로그에서 더 자세한 오류 정보를 확인하세요",
  "oidc_mismatch_cluster_label": "클러스터"
}
```

## Integration Instructions

1. Add the appropriate translations to each language file in `frontend/src/i18n/locales/*/translation.json`
2. Update the `OIDCMismatchAlert.tsx` component to use these keys
3. Update frontend API error handling to properly pass the cluster name for localization

### Example Implementation in OIDCMismatchAlert.tsx

```typescript
import { useTranslation } from 'react-i18next';

export function OIDCMismatchAlert({ clusterName, isModal = false, onDismiss }: OIDCMismatchAlertProps) {
  const { t } = useTranslation();

  const title = t('OIDC Configuration Mismatch');
  const message = t('oidc_mismatch_message');
  const suggestedActionsTitle = t('oidc_mismatch_suggested_actions');
  
  const actions = [
    t('oidc_verify_api_configured'),
    t('oidc_verify_issuer_url'),
    t('oidc_verify_client_id'),
    t('oidc_check_api_logs'),
  ];

  // ... rest of component implementation
}
```

## Testing Localization

To test the localization:

1. Change your browser language in language settings
2. Trigger an OIDC mismatch error
3. Verify that the alert displays in the correct language
4. Check that all strings are properly translated and don't overflow the component

