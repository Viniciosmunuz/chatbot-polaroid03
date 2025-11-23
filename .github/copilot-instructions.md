<!-- Copilot instructions for this repository -->
# Instruções rápidas para agentes de código (Copilot / AI)

Estas instruções ajudam um agente a ser produtivo rapidamente neste repositório.

Contexto geral
- **Tipo de projeto:** Bot Node.js para WhatsApp (linha única principal: `chatbot.js`).
- **Bibliotecas principais:** `whatsapp-web.js`, `qrcode-terminal`, `moment-timezone` (ver `package.json`).
- **Como o bot funciona (visão em 1 frase):** escuta mensagens recebidas, aplica uma máquina de estados (`userStages` / `userData`) e encaminha notificações/mídia para `ownerNumber` para intervenção manual quando necessário.

Arquitetura e fluxo de dados
- **Entrada:** mensagens do WhatsApp recebidas pelo evento `client.on('message', ...)` em `chatbot.js`.
- **Estado por usuário:** `userStages[from]` guarda o estado atual; `userData[from]` guarda dados temporários (nome, qtd, endereço, timestamps).
- **Timeout:** inatividade controlada por `INACTIVITY_TIMEOUT` (30 minutos) — implementado ao comparar `userData[from].lastActivity` com `Date.now()`.
- **Notificações / saída:** o bot envia mensagens ao cliente e, para ações que exigem intervenção humana (cálculo de preço, suporte, orçamentos), envia avisos para `ownerNumber` (formato: `55<DDD><numero>@c.us`). Ex.: `client.sendMessage(ownerNumber, avisoDono)`.
- **Mídia:** arquivos são baixados com `msg.downloadMedia()` e reenviados ao dono via `client.sendMessage(ownerNumber, media, { caption })`.

Padrões e convenções do projeto
- **Arquivo principal:** `chatbot.js` contém toda a lógica — procura por estados e respostas centralizadas.
- **Respostas centralizadas:** texto do bot em `RESPONSES` — use/alterar essa constante para atualizar mensagens do fluxo.
- **Gatilhos de menu:** função `isInitialTrigger(text)` detecta palavras como `oi`, `menu`, `olá` para iniciar o fluxo.
- **Estados usados (strings):** exemplos: `MENU_PRINCIPAL`, `AGUARDANDO_NOME`, `AGUARDANDO_QTD`, `AGUARDANDO_ENDERECO`, `PEDIDO_AGUARDANDO_CALCULO`, `SUPORTE`, `AGUARDANDO_TIPO_EVENTO`, `AGUARDANDO_DATA_EVENTO`, `AGUARDANDO_NOME_DRONE`.
- **Bloqueios intencionais:** o bot ignora grupos (`from.endsWith('@g.us')`) e contatos salvos (`contact.isMyContact`) — isso é parte do comportamento desejado.

Dependências e pontos de integração
- **`package.json` indica:** `openai` está instalado mas não é utilizado — há oportunidade futura de integração se necessário.
- **Ponto de integração principal:** `ownerNumber` é a variável que conecta o bot ao operador humano. Alterações nesse valor mudam para quem as notificações/mídias são encaminhadas.

Fluxos de desenvolvedor / execução
- **Instalar dependências:** `npm install` no diretório do projeto.
- **Executar localmente:** `node chatbot.js` — o terminal exibirá um QR code (via `qrcode-terminal`) para escanear com o WhatsApp Web.
- **Debug:** logs aparecem no terminal (`console.log` / `console.error`). Para inspecionar mensagens, olhar o handler `client.on('message', ...)` em `chatbot.js`.
- **Testes:** não há testes automatizados no repositório.

Pontos que o agente deve notar antes de editar
- **Config sensível em código:** `ownerNumber` está hard-coded. Ao alterar, procurar pontos onde é usado (`client.sendMessage(ownerNumber, ...)`).
- **Inconsistência detectada:** `openai` aparece em `package.json` mas não é referenciado no código atual — ao adicionar integração, centralize chamadas no handler de mensagem e respeite os estados existentes.
- **Mensagens e UX:** o projeto prioriza mensagens curtas e confirmações (ex.: `PEDIDO_RESUMO`, `MIDIA_RECEBIDA`). Mantenha esse estilo ao editar textos.

Exemplos rápidos de mudanças comuns
- Adicionar novo menu: atualizar `RESPONSES.MENU` e inserir um novo case no bloco `if (state === 'MENU_PRINCIPAL')`.
- Encaminhar mídia específica: use `if (msg.hasMedia) { const media = await msg.downloadMedia(); client.sendMessage(ownerNumber, media, { caption: '...' }) }` (já presente no código).
- Externalizar `ownerNumber`: substituir instância por `process.env.OWNER_NUMBER || '5592...@c.us'` e documentar `.env` no README.

Onde procurar exemplos no repo
- Lógica principal e exemplos práticos: `chatbot.js` (estados, mensagens, download/forward de mídia).
- Dependências: `package.json` (ver `openai` e `whatsapp-web.js`).

O que eu (agente) devo perguntar ao mantenedor se algo estiver incerto
- Deseja que `ownerNumber` seja movido para variáveis de ambiente? (recomendado para segurança)
- Pretende usar `openai` para respostas automáticas? Se sim, onde no fluxo prefere essa integração (ex.: suporte automático, sumarização de pedidos)?

Se quiser ajustes neste rascunho, diga quais seções expandir ou exemplos incluir.
