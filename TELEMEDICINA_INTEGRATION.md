# Integração Telemedicina - TotalDoc Mobile

## Resumo da Implementação

A integração do módulo de Telemedicina foi implementada com sucesso no aplicativo mobile TotalDoc. O botão "Pronto Atendimento" agora está funcional e conectado à API de telemedicina.

## Arquivos Criados

### 1. Serviço de Telemedicina
**Arquivo:** `api/telemedicina.tsx`

Serviço completo que gerencia toda a comunicação com a API de telemedicina:
- ✅ Registro de usuário
- ✅ Validação de acesso
- ✅ Criação de consulta imediata
- ✅ Buscar slots disponíveis
- ✅ Agendar consulta
- ✅ Obter token de vídeo
- ✅ Verificar status
- ✅ Histórico de consultas
- ✅ Cancelar consulta
- ✅ Chat (buscar e enviar mensagens)

### 2. Telas

#### Menu Principal
**Arquivo:** `app/(stack)/telemedicina/index.tsx`

Tela principal com 3 opções:
- **Consultar Agora**: Atendimento imediato (✅ implementado)
- **Agendar Consulta**: Escolher data/hora (⏳ pendente)
- **Histórico**: Ver consultas anteriores (⏳ pendente)

#### Consulta Imediata
**Arquivo:** `app/(stack)/telemedicina/consulta-imediata.tsx`

Tela de espera para consulta imediata com:
- Loading durante criação
- Animação de aguardando médico
- Informações sobre o processo
- Botão de cancelar consulta

#### Layout de Navegação
**Arquivo:** `app/(stack)/telemedicina/_layout.tsx`

Configuração da navegação das telas de telemedicina.

### 3. Atualização do Menu
**Arquivo:** `controllers/utils.tsx`

O botão "Pronto Atendimento" agora aponta para `/(stack)/telemedicina` em vez de `/(stack)/example`.

## Fluxo Implementado

### Consulta Imediata (Funcional)

```
1. Usuário clica em "Pronto Atendimento" no menu principal
   ↓
2. App navega para tela de Telemedicina
   ↓
3. Verifica se usuário está registrado
   - Se não → Registra automaticamente
   - Se sim → Pula para próximo passo
   ↓
4. Valida acesso e obtém token
   ↓
5. Exibe menu com opções
   ↓
6. Usuário clica em "Consultar Agora"
   ↓
7. Cria consulta imediata via API
   ↓
8. Exibe tela de aguardando médico
   ↓
9. [PRÓXIMO PASSO] Conectar Pusher para notificações em tempo real
   ↓
10. [PRÓXIMO PASSO] Iniciar videochamada quando médico aceitar
```

## Próximos Passos Necessários

### 1. Notificações em Tempo Real (Pusher)

Para que o app saiba quando um médico aceitou a consulta, é necessário:

**Instalar dependência:**
```bash
npm install pusher-js
```

**Implementar no arquivo `consulta-imediata.tsx`:**

```typescript
import Pusher from 'pusher-js/react-native';

const setupPusher = (pusherConfig: any) => {
  const pusher = new Pusher('YOUR_PUSHER_APP_KEY', {
    cluster: 'us2',
  });

  const channel = pusher.subscribe(pusherConfig.channel);

  channel.bind(pusherConfig.event, (data: any) => {
    if (data.status === 'doctor_assigned') {
      setStatus('assigned');
      startVideoCall();
    }
  });
};
```

**Obter credenciais:**
- Contatar a Teladoc para obter a `PUSHER_APP_KEY`
- Ou verificar a documentação da API

### 2. Videochamada (Vonage/OpenTok)

Para iniciar a videochamada quando o médico aceitar:

**Instalar dependência:**
```bash
npm install @opentok/client
```

**Permissões necessárias:**

iOS - `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Precisamos acessar sua câmera para a videochamada</string>
<key>NSMicrophoneUsageDescription</key>
<string>Precisamos acessar seu microfone para a videochamada</string>
```

Android - `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

**Criar tela de vídeo:**
```bash
# Arquivo: app/(stack)/telemedicina/video-call.tsx
```

### 3. Funcionalidades Pendentes

- [ ] Agendar Consulta (interface de calendário + seleção de horário)
- [ ] Histórico de Consultas (lista de consultas anteriores)
- [ ] Chat durante a consulta
- [ ] Feedback pós-consulta

## API Endpoints Disponíveis

Todas as rotas abaixo já estão implementadas no backend:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/telemedicina/register` | POST | Registrar assinante |
| `/telemedicina/validate` | POST | Validar acesso |
| `/telemedicina/appointment/immediate` | POST | Criar consulta imediata |
| `/telemedicina/appointment/slots` | GET | Buscar horários disponíveis |
| `/telemedicina/appointment/schedule` | POST | Agendar consulta |
| `/telemedicina/appointment/:id/video-token` | GET | Obter token de vídeo |
| `/telemedicina/appointment/:id/status` | GET | Ver status da consulta |
| `/telemedicina/appointments/history` | GET | Histórico de consultas |
| `/telemedicina/appointment/:id/cancel` | POST | Cancelar consulta |
| `/telemedicina/appointment/:id/chat` | GET | Buscar mensagens do chat |
| `/telemedicina/appointment/:id/chat` | POST | Enviar mensagem no chat |

## Testando a Integração

### 1. Testar Registro e Validação

```bash
# Fazer login no app
# Clicar em "Pronto Atendimento"
# Deve exibir tela de loading e depois menu de opções
```

### 2. Testar Consulta Imediata

```bash
# No menu da telemedicina, clicar em "Consultar Agora"
# Deve criar a consulta e exibir tela de aguardando médico
# Verificar logs no console para confirmar criação
```

### 3. Verificar no Backend

Você pode verificar no banco de dados se a consulta foi criada:

```sql
SELECT * FROM telemedicina_appointments ORDER BY created_at DESC LIMIT 5;
```

## Logs para Debug

Todos os logs da telemedicina começam com `[TELEMEDICINA]` para facilitar o debug:

- `[TELEMEDICINA]` - Serviço geral
- `[TELEMEDICINA_SCREEN]` - Tela do menu
- `[CONSULTA_IMEDIATA]` - Tela de consulta imediata
- `[API]` - Requisições da API

## Documentação de Referência

- API Backend: `Api/MOBILE_TELEMEDICINA_INTEGRATION.md`
- Testing: `Api/TELEMEDICINA_TESTING.md`
- Postman Collection: `Api/postman/TotalDoc_Telemedicina.postman_collection.json`

## Suporte

Para dúvidas ou problemas:
1. Verificar logs do console
2. Verificar se a API está rodando
3. Verificar credenciais da Teladoc
4. Consultar documentação da API no backend
