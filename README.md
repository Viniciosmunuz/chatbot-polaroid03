# Bot WhatsApp - Espaço Polaroid

Bot de atendimento automático para WhatsApp que gerencia pedidos de fotos Polaroid e orçamentos de eventos.

## Instalação

```bash
npm install
```

## Configuração

1. Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

2. Edite `.env` e configure o número do gerenciador:

```env
OWNER_NUMBER=5592999130838@c.us
```

O formato deve ser: `55` + `DDD` + `Número` + `@c.us` (sem espaços).

## Execução

```bash
node chatbot.js
```

Na primeira execução, um **QR code** será exibido no terminal. Escaneie-o com a câmera do seu WhatsApp para autenticar.

## Funcionalidades

- **Menu Principal:** Catálogo, pedidos simples, orçamentos de eventos, suporte e serviços de drone.
- **Gerenciamento de Estado:** Rastreia o cliente no funil de vendas usando máquina de estados.
- **Timeout de Inatividade:** Reseta conversa após 30 minutos de inatividade.
- **Encaminhamento de Mídia:** Fotos/vídeos são capturadas e encaminhadas ao gerenciador para análise.
- **Bloqueios:** O bot ignora grupos e contatos salvos automaticamente.

## Arquitetura

- **`chatbot.js`:** Lógica principal com estados e handlers.
- **`RESPONSES`:** Mensagens centralizadas para fácil manutenção.
- **`userStages`:** Dicionário rastreando o estado de cada cliente.
- **`userData`:** Dados temporários (nome, quantidade, endereço) por cliente.

## Fluxos Principais

1. **Pedidos Simples:** Nome → Quantidade → Endereço → Aguarda cálculo manual.
2. **Orçamentos de Eventos:** Tipo → Data → Notificação ao gerenciador.
3. **Serviços de Drone:** Nome → Notificação ao gerenciador.
4. **Suporte:** Cria canal direto com gerenciador.

## Notas para Desenvolvimento

- Para adicionar novos menus, edite `RESPONSES.MENU` e adicione um case em `if (state === 'MENU_PRINCIPAL')`.
- Mensagens com `ownerNumber` já implementam o padrão de notificação.
- Se integrar OpenAI (já em `package.json`), mantenha o fluxo de estados e envie apenas respostas de baixa complexidade (evite decisões críticas).

## Debug

Ative logs no terminal para inspecionar mensagens:

```bash
node chatbot.js 2>&1 | tee bot.log
```

Erros aparecem via `console.error()` na linha do handler de mensagem.
