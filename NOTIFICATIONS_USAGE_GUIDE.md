# Guia de Uso - Sistema de Notificações Push

Este documento explica como usar o sistema de notificações push implementado no app Total Doc Saúde.

## 📋 Visão Geral

O sistema de notificações foi completamente implementado e inclui:

✅ Handlers para notificações em foreground, background e quando app está fechado
✅ Listener de atualização de token FCM
✅ Integração com backend para registro/deleção de tokens
✅ Suporte para Android 13+ (permissão POST_NOTIFICATIONS)
✅ Cleanup automático de tokens no logout
✅ Exibição de notificações via Toast quando app está aberto

## 🚀 Fluxo Completo

### 1. Inicialização do App
Quando o app inicia (`app/_layout.tsx`):
- Listeners de notificações são inicializados
- Callbacks configurados para receber notificações
- Token refresh handler configurado para atualizar backend automaticamente

### 2. Login do Usuário
Quando o usuário faz login (`api/auth.tsx`):
- Token FCM é solicitado ao Firebase
- Permissões de notificação são requisitadas
- Token é enviado para o backend via `POST /notifications/register-token`
- Token é salvo no SecureStore local

### 3. Token Refresh (Automático)
Se o token FCM for atualizado pelo Firebase:
- Listener detecta automaticamente
- Novo token é enviado para o backend
- Token antigo é deletado do backend
- Novo token é salvo no SecureStore

### 4. Recebimento de Notificações

#### App em Foreground (aberto):
- Notificação é capturada pelo handler `onMessage`
- Toast é exibido automaticamente com título e mensagem
- Evento é registrado no Firebase Analytics

#### App em Background:
- Notificação é processada pelo `setBackgroundMessageHandler`
- Sistema operacional exibe a notificação
- Evento é logado

#### App Fechado:
- Notificação é entregue pelo sistema operacional
- Ao tocar na notificação, app abre
- Handler `getInitialNotification` captura os dados
- Você pode navegar para tela específica

### 5. Logout do Usuário
Quando o usuário faz logout (`components/header.tsx`):
- Token é deletado do backend via `DELETE /notifications/delete-token`
- Token é deletado do Firebase local
- Token é removido do SecureStore
- Usuário é redirecionado para tela de login

## 📝 Personalização

### 1. Customizar Exibição de Notificação em Foreground

Edite o handler em `app/_layout.tsx`:

```typescript
setNotificationReceivedHandler((notification) => {
  // Customizar o toast
  Toast.show({
    type: "success", // Pode ser: success, error, info
    text1: notification.notification?.title || "Nova notificação",
    text2: notification.notification?.body || "",
    visibilityTime: 6000, // Tempo em ms
    autoHide: true,
    position: "top", // top ou bottom
    onPress: () => {
      // Ação ao tocar no toast
      console.log("Toast pressionado");
    }
  });
});
```

### 2. Navegação ao Tocar na Notificação

Edite o handler em `app/_layout.tsx`:

```typescript
setNotificationTappedHandler((notification) => {
  const data = notification.data;

  // Navegar baseado no tipo de notificação
  if (data?.screen) {
    router.push(data.screen);
  } else if (data?.type === "message") {
    router.push("/(main)/messages");
  } else if (data?.type === "appointment") {
    router.push(`/(main)/appointments/${data.appointmentId}`);
  } else {
    router.push("/(main)");
  }
});
```

### 3. Processar Dados em Background

Edite o handler em `api/firebase.tsx` (linha 138):

```typescript
messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
  console.log("Mensagem recebida em background:", remoteMessage);

  // Processar dados
  const data = remoteMessage.data;

  // Exemplo: salvar dados localmente
  if (data?.type === "new_message") {
    await saveMessageToLocalDB(data);
  }

  // Exemplo: atualizar badge de notificações
  if (data?.unreadCount) {
    await updateUnreadCount(data.unreadCount);
  }
});
```

## 🧪 Como Testar

### 1. Testar Registro de Token

1. Faça login no app
2. Verifique o console para mensagem:
   ```
   Token FCM registrado no backend com sucesso
   ```
3. Verifique no backend se o token foi salvo no banco de dados

### 2. Testar Notificações via Firebase Console

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Vá em **Messaging** > **Nova Campanha** > **Mensagens de notificação**
3. Configure a notificação:
   - **Título:** Teste de notificação
   - **Texto:** Esta é uma notificação de teste
4. Em **Público-alvo**, selecione **Usuário único** e cole o token FCM
5. Envie a notificação

### 3. Testar Diferentes Cenários

**App Aberto (Foreground):**
- Envie notificação pelo Firebase Console
- Deve aparecer um Toast na tela

**App em Background:**
- Minimize o app
- Envie notificação
- Deve aparecer na barra de notificações
- Toque na notificação
- App deve abrir e executar `onNotificationTappedHandler`

**App Fechado:**
- Force close no app
- Envie notificação
- Toque na notificação
- App deve abrir e executar `getInitialNotification`

### 4. Testar Token Refresh

Isso é automático, mas você pode forçar deletando e re-gerando:

```typescript
import { deleteDeviceToken, registerForPushNotificationsAsync } from "@/api/firebase";

// Deletar token atual
await deleteDeviceToken();

// Gerar novo token
const newToken = await registerForPushNotificationsAsync();
```

### 5. Testar Logout

1. Faça login no app
2. Verifique que o token foi registrado
3. Faça logout
4. Verifique no console:
   ```
   Token deletado do backend com sucesso
   Token FCM deletado com sucesso
   ```
5. Verifique no backend que o token foi removido

## 📊 Estrutura de Dados da Notificação

Quando uma notificação é recebida, ela tem o seguinte formato:

```typescript
{
  messageId: "string",
  notification: {
    title: "string",
    body: "string",
    android: {
      channelId: "string",
      priority: "high | normal | low",
      sound: "default | string",
    },
    ios: {
      badge: "number",
      sound: "default | string",
    }
  },
  data: {
    // Dados personalizados que você pode enviar
    screen: "/appointments",
    appointmentId: "123",
    userId: "456",
    type: "appointment_reminder",
    // ... qualquer outro dado
  },
  sentTime: "timestamp",
  from: "string (sender ID)"
}
```

## 🎯 Casos de Uso Comuns

### 1. Notificação de Agendamento

**Backend envia:**
```javascript
await sendNotificationToUser(userId, {
  title: "Consulta Agendada",
  body: "Sua consulta foi agendada para 15/11 às 14:00",
  data: {
    type: "appointment",
    appointmentId: "789",
    screen: "/(main)/appointments/789"
  }
});
```

**App recebe e processa:**
- Em foreground: Exibe toast
- Ao tocar: Navega para detalhes do agendamento

### 2. Notificação de Lembrete

**Backend envia (1 dia antes):**
```javascript
await sendNotificationToUser(userId, {
  title: "Lembrete de Consulta",
  body: "Você tem uma consulta amanhã às 14:00",
  data: {
    type: "reminder",
    appointmentId: "789",
    reminderType: "1day"
  }
});
```

### 3. Notificação de Mensagem

**Backend envia:**
```javascript
await sendNotificationToUser(userId, {
  title: "Nova Mensagem",
  body: "Dr. Silva enviou uma mensagem",
  data: {
    type: "message",
    messageId: "456",
    screen: "/(main)/messages"
  }
});
```

## 🔧 Troubleshooting

### Notificações não aparecem

1. **Verifique permissões:**
   ```typescript
   import { messaging } from "@/api/firebase";
   const status = await messaging().hasPermission();
   console.log("Permission status:", status);
   ```

2. **Verifique token:**
   ```typescript
   const token = await SecureStore.getItemAsync("expo-push-token");
   console.log("Token FCM:", token);
   ```

3. **Verifique se listeners foram inicializados:**
   - Adicione console.log em `initializeNotificationListeners()`

### Token não é enviado ao backend

1. Verifique se o endpoint está correto em `api/config.tsx`
2. Verifique logs do backend
3. Verifique se o token JWT está válido

### Notificações aparecem mas não navegam

1. Verifique se `setNotificationTappedHandler` está configurado
2. Adicione console.logs no handler
3. Verifique se a rota existe no router

## 📚 Referências

- [Firebase Cloud Messaging - React Native](https://rnfirebase.io/messaging/usage)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Toast Message](https://github.com/calintamas/react-native-toast-message)

## 🆘 Suporte

Se tiver problemas, verifique:

1. **Logs do app:** Use `npx react-native log-android` ou `log-ios`
2. **Firebase Console:** Verifique estatísticas de entrega
3. **Backend logs:** Verifique se endpoints estão sendo chamados
4. **Network tab:** Use React Native Debugger para ver requisições

## ✅ Checklist de Implementação Completa

- [x] Handlers de notificações implementados
- [x] Listener de token refresh implementado
- [x] Permissão Android 13+ adicionada
- [x] Integração com backend (client-side)
- [x] Cleanup no logout implementado
- [x] Inicialização duplicada corrigida
- [ ] Endpoints no backend implementados (ver `BACKEND_NOTIFICATIONS_GUIDE.md`)
- [ ] Testes realizados em todos os cenários
- [ ] Navegação customizada configurada
- [ ] Tratamento de erros melhorado
