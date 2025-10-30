# Guia de Implementação - Endpoints de Notificações (Backend)

Este documento descreve os endpoints que precisam ser implementados no backend para suportar o sistema de notificações push com Firebase Cloud Messaging.

## Endpoints Necessários

### 1. POST `/notifications/register-token`

Registra ou atualiza o token FCM de um dispositivo.

**Headers:**
- `Authorization: Bearer <user-token>` (obrigatório)

**Body:**
```json
{
  "token": "string (FCM token)",
  "platform": "android | ios | web",
  "deviceId": "string (identificador único do dispositivo)",
  "userId": "number (opcional - pode vir do JWT)"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Token registrado com sucesso",
  "data": {
    "id": 123,
    "token": "...",
    "userId": 456,
    "platform": "android",
    "createdAt": "2025-10-29T12:00:00Z",
    "updatedAt": "2025-10-29T12:00:00Z"
  }
}
```

**Resposta de Erro (400/401/500):**
```json
{
  "success": false,
  "message": "Mensagem de erro"
}
```

**Lógica do Endpoint:**
1. Validar token JWT do usuário
2. Verificar se já existe um registro com o mesmo token
3. Se existir, atualizar o `updatedAt` e associar ao usuário correto
4. Se não existir, criar novo registro
5. Permitir múltiplos tokens por usuário (para múltiplos dispositivos)
6. Retornar sucesso

**Exemplo de Schema de Banco de Dados:**
```sql
CREATE TABLE device_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  platform VARCHAR(20) NOT NULL,
  device_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token)
);
```

---

### 2. DELETE `/notifications/delete-token`

Remove o token FCM de um dispositivo (usado no logout).

**Headers:**
- `Authorization: Bearer <user-token>` (obrigatório)

**Body:**
```json
{
  "token": "string (FCM token a ser removido)"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Token deletado com sucesso"
}
```

**Resposta de Erro (400/401/404/500):**
```json
{
  "success": false,
  "message": "Mensagem de erro"
}
```

**Lógica do Endpoint:**
1. Validar token JWT do usuário
2. Buscar o token no banco de dados
3. Verificar se o token pertence ao usuário (segurança)
4. Deletar o registro ou marcar como inativo (`is_active = false`)
5. Retornar sucesso

---

## Exemplo de Implementação (Node.js + Express)

```javascript
// routes/notifications.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database');

// POST /notifications/register-token
router.post('/register-token', authenticateToken, async (req, res) => {
  try {
    const { token, platform, deviceId, userId } = req.body;
    const userIdFromToken = req.user.id; // Do JWT

    // Usar userId do JWT por padrão
    const finalUserId = userId || userIdFromToken;

    // Validações
    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Token e platform são obrigatórios'
      });
    }

    // Verificar se token já existe
    const existingToken = await db.query(
      'SELECT * FROM device_tokens WHERE token = $1',
      [token]
    );

    if (existingToken.rows.length > 0) {
      // Atualizar token existente
      const updated = await db.query(
        `UPDATE device_tokens
         SET user_id = $1, platform = $2, device_id = $3,
             is_active = true, updated_at = NOW()
         WHERE token = $4
         RETURNING *`,
        [finalUserId, platform, deviceId, token]
      );

      return res.json({
        success: true,
        message: 'Token atualizado com sucesso',
        data: updated.rows[0]
      });
    } else {
      // Criar novo token
      const created = await db.query(
        `INSERT INTO device_tokens (user_id, token, platform, device_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [finalUserId, token, platform, deviceId]
      );

      return res.status(201).json({
        success: true,
        message: 'Token registrado com sucesso',
        data: created.rows[0]
      });
    }
  } catch (error) {
    console.error('Erro ao registrar token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /notifications/delete-token
router.delete('/delete-token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token é obrigatório'
      });
    }

    // Verificar se token existe e pertence ao usuário
    const existingToken = await db.query(
      'SELECT * FROM device_tokens WHERE token = $1 AND user_id = $2',
      [token, userId]
    );

    if (existingToken.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Token não encontrado'
      });
    }

    // Deletar token (ou marcar como inativo)
    await db.query(
      'DELETE FROM device_tokens WHERE token = $1 AND user_id = $2',
      [token, userId]
    );

    // Alternativa: marcar como inativo
    // await db.query(
    //   'UPDATE device_tokens SET is_active = false WHERE token = $1 AND user_id = $2',
    //   [token, userId]
    // );

    return res.json({
      success: true,
      message: 'Token deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
```

---

## Como Enviar Notificações Push

Depois de implementar os endpoints acima, você pode enviar notificações para usuários usando o Firebase Admin SDK:

```javascript
// services/notifications.js
const admin = require('firebase-admin');
const db = require('../database');

// Inicializar Firebase Admin (fazer uma vez no app)
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

/**
 * Envia notificação para um usuário específico
 */
async function sendNotificationToUser(userId, notification) {
  try {
    // Buscar todos os tokens ativos do usuário
    const result = await db.query(
      'SELECT token FROM device_tokens WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const tokens = result.rows.map(row => row.token);

    if (tokens.length === 0) {
      console.log(`Usuário ${userId} não tem tokens registrados`);
      return { success: false, message: 'Nenhum token encontrado' };
    }

    // Criar mensagem FCM
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: tokens, // Enviar para todos os dispositivos do usuário
    };

    // Enviar notificação
    const response = await admin.messaging().sendMulticast(message);

    console.log(`Notificação enviada: ${response.successCount} sucesso, ${response.failureCount} falhas`);

    // Remover tokens inválidos
    if (response.failureCount > 0) {
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          tokensToRemove.push(tokens[idx]);
        }
      });

      // Deletar tokens inválidos do banco
      if (tokensToRemove.length > 0) {
        await db.query(
          'DELETE FROM device_tokens WHERE token = ANY($1)',
          [tokensToRemove]
        );
      }
    }

    return { success: true, response };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return { success: false, error };
  }
}

module.exports = { sendNotificationToUser };
```

**Exemplo de uso:**
```javascript
const { sendNotificationToUser } = require('./services/notifications');

// Enviar notificação
await sendNotificationToUser(userId, {
  title: 'Bem-vindo!',
  body: 'Obrigado por se cadastrar',
  data: {
    screen: '/home',
    type: 'welcome'
  }
});
```

---

## Checklist de Implementação

- [ ] Criar tabela `device_tokens` no banco de dados
- [ ] Implementar endpoint `POST /notifications/register-token`
- [ ] Implementar endpoint `DELETE /notifications/delete-token`
- [ ] Testar registro de token via app mobile
- [ ] Testar deleção de token no logout
- [ ] Configurar Firebase Admin SDK no backend
- [ ] Implementar função de envio de notificações
- [ ] Testar envio de notificações
- [ ] Implementar limpeza de tokens inválidos
- [ ] Adicionar logs e monitoramento

---

## Segurança

1. **Autenticação:** Sempre validar o JWT antes de processar requisições
2. **Autorização:** Verificar se o token pertence ao usuário antes de deletar
3. **Rate Limiting:** Implementar limite de requisições para evitar abuso
4. **Validação:** Validar todos os inputs antes de salvar no banco
5. **Sanitização:** Limpar dados antes de inserir no banco (SQL injection)

---

## Monitoramento

Recomendações para monitorar o sistema de notificações:

1. Log de todos os registros e deleções de tokens
2. Métricas de sucesso/falha no envio de notificações
3. Alertas para taxa alta de falhas
4. Dashboard com estatísticas de tokens ativos por usuário
5. Limpeza periódica de tokens antigos (>90 dias sem atualização)
