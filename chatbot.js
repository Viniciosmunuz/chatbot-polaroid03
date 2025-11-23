require('dotenv').config();
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const { Client, MessageMedia, LocalAuth, RemoteAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Criar diretório de sessão se não existir
const SESSION_DIR = path.join(__dirname, '.wwebjs_auth');
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Configurar cliente com tratamento para Railway
const clientConfig = {
  authStrategy: new LocalAuth({ clientId: 'polaroid-bot', dataPath: SESSION_DIR }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process', // Para Railway
    ],
  },
};

// Inicializar client com persistência de sessão
const client = new Client(clientConfig);

client.on('qr', qr => {
    console.log('\n' + '='.repeat(60));
    console.log('📱 QR CODE GERADO - Escaneie com seu WhatsApp');
    console.log('='.repeat(60) + '\n');
    qrcode.generate(qr, {small: false});
    console.log('\n' + '='.repeat(60));
    console.log('⏰ QR code válido por ~1 minuto');
    console.log('='.repeat(60) + '\n');
    
    // Salvar QR code em arquivo PNG
    QRCode.toFile('qrcode.png', qr, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 500,
    }, (err) => {
      if (!err) {
        console.log('💾 QR code PNG salvo');
      }
    });
    
    // Salvar QR code em arquivo HTML com DataURL
    QRCode.toDataURL(qr, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 500,
    }, (err, url) => {
      if (!err) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code - WhatsApp Bot</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: Arial, sans-serif;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      text-align: center;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    img {
      max-width: 400px;
      border: 2px solid #667eea;
      border-radius: 5px;
      margin: 20px 0;
    }
    p {
      color: #666;
      font-size: 16px;
      margin: 10px 0;
    }
    .warning {
      color: #ff6b6b;
      font-weight: bold;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📱 QR Code WhatsApp Bot</h1>
    <p>Escaneie este QR code com seu WhatsApp Web</p>
    <img src="${url}" alt="QR Code">
    <p class="warning">⏰ QR code válido por ~1 minuto</p>
    <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
  </div>
</body>
</html>
        `;
        fs.writeFileSync('qrcode.html', htmlContent);
        console.log('🌐 QR code HTML salvo em: qrcode.html');
      }
    });
    
    // Salvar QR code em arquivo de texto ASCII
    QRCode.toString(qr, {type: 'terminal', width: 30}, (err, string) => {
      if (!err) {
        fs.writeFileSync('qrcode.txt', string);
        console.log('📄 QR code ASCII salvo em: qrcode.txt\n');
      }
    });
});

client.on('ready', () => {
    console.log('✅ Bot WhatsApp conectado e pronto para usar!');
    console.log('⏰ ' + new Date().toLocaleString('pt-BR'));
});

client.on('disconnected', (reason) => {
    console.log('❌ Bot desconectado:', reason);
    console.log('Tentando reconectar em 10 segundos...');
    setTimeout(() => {
        try {
            client.initialize();
        } catch (err) {
            console.error('Erro ao reconectar:', err);
        }
    }, 10000);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Erro não tratado:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Exceção não capturada:', err);
    setTimeout(() => {
        try {
            client.initialize();
        } catch (e) {
            console.error('Erro crítico:', e);
        }
    }, 5000);
});

client.initialize().catch(err => {
    console.error('❌ Erro ao inicializar:', err);
});
const delay = ms => new Promise(res => setTimeout(res, ms));

// --- CONFIGURAÇÕES DE ESTADO E DADOS ---
const userStages = {}; // Rastreia onde o cliente está no funil
const userData = {}; // Guarda as informações temporárias do cliente

// ⏱️ Tempo limite de inatividade em milissegundos (30 minutos)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; 

// ⚠️ IMPORTANTE: Configure a variável de ambiente OWNER_NUMBER
// Formato: 55 + DDD + Numero + @c.us
// Exemplo: OWNER_NUMBER=5592999130838@c.us node chatbot.js
const ownerNumber = process.env.OWNER_NUMBER || '5592999130838@c.us'; 

// --- TEXTOS CENTRALIZADOS PARA FÁCIL MANUTENÇÃO ---
const RESPONSES = {
    // 🎯 MENU ATUALIZADO com a nova opção 5️⃣
    MENU: 'Olá! Bem-vindo(a) ao espaço polaroid 📸\nComo posso te ajudar hoje?\n\n1️⃣ Ver Catálogo e Preços (Fotos Simples e Pacotes de Eventos)\n2️⃣ Fazer Pedido de Fotos Simples\n3️⃣ 📅 Orçamento para Eventos\n4️⃣ Falar com Suporte\n5️⃣ 🚁 Serviços de Drone',
    
    // Antigas
    CATALOGO_LINK: 'https://drive.google.com/file/d/1-3RjbAjgm1t_lpJLwi9wjhS87TJyktj9/view?usp=drive_link',
    CATALOGO_INFO: (link) => `Confira nossos modelos e valores no link abaixo:\n\n👉 ${link} \n\nSe deseja fazer um pedido de fotos simples, digite *2* ou *3* para orçamento de eventos.`,
    AGUARDANDO_NOME: 'Vamos lá! Primeiro, qual é o seu *Nome Completo*?',
    AGUARDANDO_QTD: (nome) => `Prazer, ${nome}! Quantas fotos polaroid você deseja revelar? (Digite a quantidade, pode ser por extenso ou em número)`,
    VALIDACAO_QTD_ERRO: '⚠️ Valor inválido. Por favor, digite a *quantidade* de fotos desejada. Se for um número por extenso (ex: "doze"), não se preocupe, nosso atendente irá conferir.',
    AGUARDANDO_ENDERECO: "Certo. Para finalizar, qual o *Endereço de Entrega* (ou digite 'Retirada' se for buscar)?",
    PEDIDO_CONFIRMACAO: (nome, qtd, endereco) => `✅ *Resumo do Pedido*\n\nNome: ${nome}\nQuantidade: ${qtd} fotos\nLocal: ${endereco}\n\n*Tudo certo?* Digite:\n👉 *SIM* para confirmar e enviar para cálculo\n👉 *NÃO* para cancelar e voltar ao menu`,
    PEDIDO_CONFIRMADO: (nome, qtd, endereco) => `✅ *Pedido Confirmado!*\nNome: ${nome}\nQtd: ${qtd} fotos\nLocal: ${endereco}\n\n📸 *PRÓXIMO PASSO:* Por favor, envie as fotos que você quer revelar aqui no chat.\n\nSeu pedido foi encaminhado para análise de valor. *Aguarde a mensagem de um atendente com o valor total e o QR Code Pix*.`,
    AGUARDANDO_TIPO_EVENTO: 'Ótimo! Para pacotes de eventos, qual é o *Tipo de Evento*? (Ex: Aniversário, Casamento, Corporativo)',
    AGUARDANDO_DATA_EVENTO: (tipo) => `Qual é a *Data* do seu evento "${tipo}"? (Ex: DD/MM/AAAA)`,
    VALIDACAO_DATA_ERRO: '⚠️ Formato inválido. Por favor, digite a data no formato *DD/MM/AAAA* (Ex: 01/12/2024).', 
    PEDIDO_RESUMO: (nome, qtd, endereco) => `✅ *Pedido de ${qtd} fotos Registrado!*
Nome: ${nome}
Local: ${endereco}

📸 *PRÓXIMO PASSO:* Por favor, envie as fotos que você quer revelar aqui no chat.

Seu pedido foi encaminhado para análise de valor final (fotos + frete). *Aguarde a mensagem de um atendente com o valor total e o QR Code Pix*.`,
    PEDIDO_AVISO_DONO: (nome, numeroCliente, qtd, endereco) => `🚨 *NOVO PEDIDO PARA CÁLCULO* 🚨\n\nCliente: ${nome}\nWhatsApp: https://wa.me/${numeroCliente}\nQtd: ${qtd} fotos\nLocal: ${endereco}\n\n👉 *AÇÃO:* Calcule o valor total, envie as instruções Pix e o QR Code/Chave para o cliente.`,
    PEDIDO_AGUARDANDO_CALCULO: 'Seu pedido está em análise de valor. Por favor, aguarde o atendente enviar o valor e o Pix para pagamento. Se precisar de outra coisa, digite *Menu*.',
    MIDIA_RECEBIDA: '📸 Recebi sua foto/vídeo! Continue enviando todas as que deseja revelar. Assim que o atendente enviar o valor e o Pix, seu pedido estará completo.',
    ORCAMENTO_CLIENTE: (tipo, data) => `Seu pedido de orçamento para o evento "${tipo}" na data ${data} foi registrado!\n\nUm de nossos especialistas em eventos entrará em contato com você em breve para apresentar a proposta e o pacote ideal.`,
    ORCAMENTO_AVISO_DONO: (tipo, data, nomeCliente, numeroCliente) => `🚨🚨 *ORÇAMENTO DE EVENTO RECEBIDO!* 🚨🚨\n\nTipo: ${tipo}\nData: ${data}\nCliente: ${nomeCliente}\nWhatsApp: https://wa.me/${numeroCliente}\n\nEntre em contato o mais rápido possível!`,
    SUPORTE_INICIO: 'Ok! Um atendente humano já vai te responder em instantes. Para voltar ao menu, digite *Menu*.',
    SUPORTE_AVISO_DONO: (nomeCliente, numeroCliente) => `👤 *NOVO CLIENTE EM SUPORTE* 👤\n\nCliente: ${nomeCliente}\nWhatsApp: https://wa.me/${numeroCliente}\n\n👉 *AÇÃO:* O cliente está aguardando atendimento humano.`,
    INATIVIDADE: 'Olá! Parece que ficamos inativos por um tempo. Para recomeçar, digite *Menu* ou escolha uma opção:',
    RESPOSTA_PADRAO: 'Desculpe, não consegui entender sua última mensagem. Digite *Menu* para ver as opções ou aguarde nosso suporte.',

    // 🎯 NOVAS RESPOSTAS PARA DRONE
    DRONE_AGUARDANDO_NOME: 'Entendido! Para o serviço de drone, qual é o seu *Nome e Sobrenome*?',
    DRONE_FINALIZADO_CLIENTE: (nome) => `Obrigado(a), ${nome}! 🚁\n\nSeu interesse em *Serviços de Drone* foi registrado com sucesso!\n\nLogo um atendente vai responder com mais informações sobre seu projeto. Até logo!`,
    DRONE_AVISO_DONO: (nome, numeroCliente) => `🚁 *NOVO ORÇAMENTO DE DRONE* 🚁\n\nCliente: ${nome}\nWhatsApp: https://wa.me/${numeroCliente}\n\n👉 *AÇÃO:* Entre em contato para entender a necessidade e enviar um orçamento.`,
};

// Funções Auxiliares
function isInitialTrigger(text) {
  // Verifica se a mensagem de entrada é um gatilho de menu
  return /(oi|ola|olá|menu|boa tarde|boa noite|bom dia)/i.test(text);
}

function getMenuText() {
  return RESPONSES.MENU;
}


client.on('message', async (msg) => {
  try {
    const from = msg.from;
    
    // 1. 🛑 CHECAGEM INICIAL DE CONTATO E GRUPO
    // Ignora mensagens se o 'from' for nulo (raro) ou for de um grupo
    if (!from || from.endsWith('@g.us')) {
      return; // <-- BLOQUEIA GRUPOS
    }
    
    // Verifica se o contato que enviou a mensagem está salvo na lista do WhatsApp
    const contact = await msg.getContact();

    // 🎯 Se o contato ESTIVER salvo (isMyContact === true), o bot IGNORA a mensagem.
    if (contact.isMyContact) {
        return; // <-- BLOQUEIA CONTATOS SALVOS
    }
    // FIM da Checagem: APENAS NÚMEROS NÃO SALVOS CONTINUAM O FLUXO

    const body = (msg.body || '').trim();
    let state = userStages[from] || null;
    
    // 2. ⏱️ CHECAGEM DE INATIVIDADE
    const now = Date.now();
    if (state && userData[from] && userData[from].lastActivity && (now - userData[from].lastActivity > INACTIVITY_TIMEOUT)) {
        await client.sendMessage(from, RESPONSES.INATIVIDADE);
        state = null; // Reinicia o estado
        delete userStages[from];
        delete userData[from];
    }
    // Atualiza a atividade
    if (state !== 'SUPORTE') {
        userData[from] = userData[from] || {};
        userData[from].lastActivity = now;
    }
    
    // Simula Digitação para um UX mais humano
    await msg.getChat().then(chat => chat.sendStateTyping());
    await delay(300);

    // TRATAMENTO DE SUPORTE
    if (state === 'SUPORTE' && isInitialTrigger(body)) {
        // Permite sair do estado de suporte se digitar Menu
        await client.sendMessage(from, getMenuText());
        userStages[from] = 'MENU_PRINCIPAL';
        return;
    }

    // ESTADO 0 (INICIO) - Reseta ou Inicia a Conversa
    if (!state) {
      await client.sendMessage(from, getMenuText());
      userStages[from] = 'MENU_PRINCIPAL';
      return;
    }

    // --- FUNIL PRINCIPAL (MENU_PRINCIPAL) ---
    if (state === 'MENU_PRINCIPAL') {
      
      // Opção 1: Catálogo (Fotos Simples e Eventos)
      if (body === '1') {
        await client.sendMessage(from, RESPONSES.CATALOGO_INFO(RESPONSES.CATALOGO_LINK));
        return;
      }
      
      // Opção 2: Iniciar Pedido Simples
      if (body === '2') {
        await client.sendMessage(from, RESPONSES.AGUARDANDO_NOME);
        userStages[from] = 'AGUARDANDO_NOME';
        userData[from] = userData[from] || {};
        return;
      }
      
      // Opção 3: Iniciar Orçamento de Eventos
      if (body === '3') {
        await client.sendMessage(from, RESPONSES.AGUARDANDO_TIPO_EVENTO);
        userStages[from] = 'AGUARDANDO_TIPO_EVENTO';
        userData[from] = userData[from] || {};
        return;
      }
      
      // Opção 4: Falar com Suporte
      if (body === '4') {
        const nomeCliente = userData[from]?.nome || 'Cliente Novo';
        const numeroCliente = from.replace('@c.us', '');
        
        // 1. Notificação para o Dono
        await client.sendMessage(ownerNumber, RESPONSES.SUPORTE_AVISO_DONO(nomeCliente, numeroCliente));
        
        // 2. Mensagem para o Cliente
        await client.sendMessage(from, RESPONSES.SUPORTE_INICIO);
        userStages[from] = 'SUPORTE';
        return;
      }
      
    // 🎯 Opção 5: Iniciar Serviço de Drone
      if (body === '5') {
        await client.sendMessage(from, RESPONSES.DRONE_AGUARDANDO_NOME);
        userStages[from] = 'AGUARDANDO_NOME_DRONE';
        userData[from] = userData[from] || {};
        return;
      }

      // Resposta padrão se não entender a opção do menu
      await client.sendMessage(from, RESPONSES.RESPOSTA_PADRAO);
      return;
    }

    // --- FUNIL DE PEDIDO DE FOTOS SIMPLES ---

    // AGUARDANDO_NOME
    if (state === 'AGUARDANDO_NOME') {
      userData[from].nome = body;
      const nomeCurto = userData[from].nome.split(" ")[0];
      await client.sendMessage(from, RESPONSES.AGUARDANDO_QTD(nomeCurto));
      userStages[from] = 'AGUARDANDO_QTD';
      return;
    }

    // AGUARDANDO_QTD
    if (state === 'AGUARDANDO_QTD') {
      const isNumber = /^\d+$/.test(body);
      const isPositiveNumber = isNumber && parseInt(body) > 0;
      const isText = body.length > 2; 

      if (isPositiveNumber || isText) {
          userData[from].qtd = body; 
          await client.sendMessage(from, RESPONSES.AGUARDANDO_ENDERECO);
          userStages[from] = 'AGUARDANDO_ENDERECO';
          return;
      }
      
      await client.sendMessage(from, RESPONSES.VALIDACAO_QTD_ERRO);
      return;
    }

    // AGUARDANDO_ENDERECO (PARADA PARA CONFIRMAÇÃO)
    if (state === 'AGUARDANDO_ENDERECO') {
      userData[from].endereco = body;
      const nome = userData[from].nome || '';
      const qtd = userData[from].qtd || '';
      const endereco = userData[from].endereco || '';

      // Mostra resumo e pede confirmação
      await client.sendMessage(from, RESPONSES.PEDIDO_CONFIRMACAO(nome, qtd, endereco));
      userStages[from] = 'PEDIDO_AGUARDANDO_CONFIRMACAO';
      return;
    }

    // PEDIDO_AGUARDANDO_CONFIRMACAO: Aguarda SIM ou NÃO
    if (state === 'PEDIDO_AGUARDANDO_CONFIRMACAO') {
      const confirmacao = body.toUpperCase().trim();

      if (confirmacao === 'SIM' || confirmacao === 'S') {
        const nome = userData[from].nome || '';
        const qtd = userData[from].qtd || '';
        const endereco = userData[from].endereco || '';
        const numeroCliente = from.replace('@c.us', '');

        // 1. Confirmação ao cliente
        await client.sendMessage(from, RESPONSES.PEDIDO_CONFIRMADO(nome, qtd, endereco));
        await delay(1000);
        
        // 2. Notificação para o Dono 
        const avisoDono = RESPONSES.PEDIDO_AVISO_DONO(nome, numeroCliente, qtd, endereco);
        await client.sendMessage(ownerNumber, avisoDono);

        // Mudar para o estado que aguarda INTERVENÇÃO MANUAL
        userStages[from] = 'PEDIDO_AGUARDANDO_CALCULO';
        return;
      }

      if (confirmacao === 'NÃO' || confirmacao === 'NAO' || confirmacao === 'N') {
        // Cancela e volta ao menu
        await client.sendMessage(from, 'Pedido cancelado. Voltando ao menu...\n\n' + getMenuText());
        userStages[from] = 'MENU_PRINCIPAL';
        delete userData[from];
        return;
      }

      // Se não for SIM nem NÃO, pede novamente
      await client.sendMessage(from, '⚠️ Por favor, digite *SIM* para confirmar ou *NÃO* para cancelar.');
      return;
    }
    
    // PEDIDO_AGUARDANDO_CALCULO: Captura e Encaminha Mídia / Aguarda intervenção
    if (state === 'PEDIDO_AGUARDANDO_CALCULO') {
        
        // Se a mensagem contiver mídia (fotos/vídeos)
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            const mediaType = media.mimetype.split('/')[0];

            if (mediaType === 'image' || mediaType === 'video') {
                const clientNumber = from.replace('@c.us', '');
                
                // 1. Confirmação ao Cliente
                await client.sendMessage(from, RESPONSES.MIDIA_RECEBIDA);
                
                // 2. Encaminha a Mídia para o Dono/Atendente
                await client.sendMessage(ownerNumber, media, {
                    caption: `MÍDIA DO PEDIDO PENDENTE\nCliente: ${userData[from]?.nome || 'Desconhecido'}\nNúmero: https://wa.me/${clientNumber}`
                });
                return; // Permanece no estado para receber mais mídias
            }
        }
        
        // Se for um gatilho de início, leva ao menu
        if (isInitialTrigger(body)) {
            await client.sendMessage(from, getMenuText());
            userStages[from] = 'MENU_PRINCIPAL';
            return;
        }

        // Resposta de aguardo (se for texto comum e não mídia):
        if (body.length > 0) {
             await client.sendMessage(from, RESPONSES.PEDIDO_AGUARDANDO_CALCULO);
             return;
        }
    }


    // --- FUNIL DE ORÇAMENTO PARA EVENTOS (FLUXO AUTOMÁTICO DE ORÇAMENTO) ---

    // AGUARDANDO_TIPO_EVENTO
    if (state === 'AGUARDANDO_TIPO_EVENTO') {
        userData[from].tipoEvento = body;
        await client.sendMessage(from, RESPONSES.AGUARDANDO_DATA_EVENTO(body));
        userStages[from] = 'AGUARDANDO_DATA_EVENTO';
        return;
    }

    // AGUARDANDO_DATA_EVENTO (FINALIZAÇÃO DE ORÇAMENTO)
    if (state === 'AGUARDANDO_DATA_EVENTO') {
        userData[from].dataEvento = body;
        const nomeCliente = userData[from].nome || from;
        const numeroCliente = from.replace('@c.us', '');
        const tipoEvento = userData[from].tipoEvento;
        
        // MENSAGEM FINAL PARA O CLIENTE
        await client.sendMessage(from, RESPONSES.ORCAMENTO_CLIENTE(tipoEvento, body));

        // AVISO PARA O DONO (Prioridade Máxima)
        const avisoDono = RESPONSES.ORCAMENTO_AVISO_DONO(tipoEvento, body, nomeCliente, numeroCliente);
        await client.sendMessage(ownerNumber, avisoDono);

        // Reset do fluxo e EXCLUSÃO dos dados
        delete userStages[from];
        delete userData[from]; 
        return;
    }
    
    // --- 🎯 NOVO FUNIL: SERVIÇOS DE DRONE ---

    // AGUARDANDO_NOME_DRONE
    if (state === 'AGUARDANDO_NOME_DRONE') {
        userData[from].nomeDrone = body; // Guarda o nome completo
        
        const nomeCliente = userData[from].nomeDrone;
        const numeroCliente = from.replace('@c.us', '');
        
        // 1. MENSAGEM FINAL para o cliente (usando apenas o primeiro nome)
        await client.sendMessage(from, RESPONSES.DRONE_FINALIZADO_CLIENTE(nomeCliente.split(' ')[0])); 

        // 2. AVISO para o dono
        const avisoDono = RESPONSES.DRONE_AVISO_DONO(nomeCliente, numeroCliente);
        await client.sendMessage(ownerNumber, avisoDono);

        // 3. Reset do fluxo
        delete userStages[from];
        delete userData[from]; 
        return;
    }
    
    // --- RESPOSTA PADRÃO PARA MENSAGENS NÃO MAPEADAS ---
    // Apenas responde se o estado não for 'SUPORTE' nem 'PEDIDO_AGUARDANDO_CALCULO' e não for um gatilho de menu
    if (state !== 'SUPORTE' && state !== 'PEDIDO_AGUARDANDO_CALCULO' && !isInitialTrigger(body)) {
        await client.sendMessage(from, RESPONSES.RESPOSTA_PADRAO);
    }


  } catch (err) {
    console.error('Erro ao processar mensagem:', err);
  }
});