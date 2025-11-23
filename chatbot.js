require('dotenv').config();
const express = require('express');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// ===== CONFIGURAÇÃO =====
const PORT = process.env.PORT || 3000;
const OWNER_NUMBER = process.env.OWNER_NUMBER || '5592999130838@c.us';
const SESSION_DIR = path.join(__dirname, '.wwebjs_auth');
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

// Criar diretório de sessão
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// ===== VARIÁVEIS GLOBAIS =====
let currentQRCodeDataUrl = null;
const userStages = {};
const userData = {};

// ===== SERVIDOR EXPRESS =====
const app = express();

app.get('/', (req, res) => {
  const html = `
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
        h1 { color: #333; margin-bottom: 20px; }
        img { max-width: 500px; width: 100%; border: 3px solid #667eea; border-radius: 5px; margin: 20px 0; }
        p { color: #666; font-size: 16px; margin: 10px 0; }
        .warning { color: #ff6b6b; font-weight: bold; }
      </style>
      <meta http-equiv="refresh" content="5">
    </head>
    <body>
      <div class="container">
        <h1>📱 QR Code WhatsApp Bot</h1>
        ${currentQRCodeDataUrl 
          ? `<img src="${currentQRCodeDataUrl}" alt="QR Code">
             <p class="warning">⏰ QR code válido por ~1 minuto</p>
             <p>Escaneie com seu WhatsApp</p>`
          : `<p>⏳ Aguardando QR code...</p>
             <p>⌛ Atualize a página em poucos segundos</p>`
        }
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`\n🌐 Servidor web rodando em: http://localhost:${PORT}`);
  console.log(`📱 Acesse para ver o QR code\n`);
});

// ===== CONFIGURAÇÃO DO BOT =====
const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'polaroid-bot', dataPath: SESSION_DIR }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  },
});

// ===== EVENTOS DO BOT =====
client.on('qr', qr => {
  console.log('\n' + '='.repeat(60));
  console.log('📱 QR CODE GERADO - Escaneie com seu WhatsApp');
  console.log('='.repeat(60) + '\n');
  
  qrcode.generate(qr, { small: false });
  
  // Gerar DataURL para servir via web
  QRCode.toDataURL(qr, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    width: 500,
  }, (err, url) => {
    if (!err) currentQRCodeDataUrl = url;
  });
  
  // Salvar em PNG
  QRCode.toFile('qrcode.png', qr, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    width: 500,
  }, (err) => {
    if (!err) console.log('💾 QR code PNG salvo\n');
  });
});

client.on('ready', () => {
  console.log('✅ Bot WhatsApp conectado e pronto!\n');
});

client.on('disconnected', (reason) => {
  console.log('❌ Bot desconectado:', reason);
  setTimeout(() => {
    try {
      client.initialize();
    } catch (err) {
      console.error('Erro ao reconectar:', err);
    }
  }, 10000);
});

// ===== RESPOSTAS DO BOT =====
const RESPONSES = {
  MENU: 'Olá! Bem-vindo(a) ao espaço polaroid 📸\n\n1️⃣ Ver Catálogo\n2️⃣ Fazer Pedido de Fotos\n3️⃣ Orçamento para Eventos\n4️⃣ Suporte\n5️⃣ Serviços de Drone',
  AGUARDANDO_NOME: 'Qual é o seu nome completo?',
  AGUARDANDO_QTD: (nome) => `Prazer, ${nome}! Quantas fotos polaroid deseja?`,
  AGUARDANDO_ENDERECO: 'Qual o endereço de entrega (ou "Retirada")?',
  PEDIDO_RESUMO: (nome, qtd, endereco) => `✅ *Resumo do Pedido*\n\nNome: ${nome}\nQuantidade: ${qtd}\nLocal: ${endereco}\n\nDigite SIM para confirmar ou NÃO para cancelar`,
  PEDIDO_CONFIRMADO: '✅ Pedido confirmado! Aguarde contato com orçamento.',
  ERRO_VALIDACAO: '⚠️ Entrada inválida. Por favor, tente novamente.',
};

// ===== MANIPULADORES DE MENSAGEM =====
client.on('message', async msg => {
  try {
    const from = msg.from;
    const text = msg.body.toLowerCase().trim();
    
    // Ignorar grupos
    if (msg.isGroupMsg) return;
    
    // Iniciar novo fluxo
    if (['oi', 'olá', 'menu', 'oi!', 'tudo bem'].includes(text)) {
      userStages[from] = 'MENU_PRINCIPAL';
      await msg.reply(RESPONSES.MENU);
      return;
    }
    
    // Processar seleções do menu
    if (userStages[from] === 'MENU_PRINCIPAL') {
      if (text === '1') {
        await msg.reply('📸 Catálogo: https://drive.google.com/...');
        delete userStages[from];
      } else if (text === '2') {
        userStages[from] = 'AGUARDANDO_NOME';
        await msg.reply(RESPONSES.AGUARDANDO_NOME);
      } else if (text === '3') {
        await msg.reply('📅 Envie os detalhes do seu evento');
      } else if (text === '4') {
        await msg.reply('📞 Fale com nosso suporte');
      } else if (text === '5') {
        await msg.reply('🚁 Serviços de Drone disponíveis');
      }
      return;
    }
    
    // Coletar nome
    if (userStages[from] === 'AGUARDANDO_NOME') {
      userData[from] = { nome: msg.body };
      userStages[from] = 'AGUARDANDO_QTD';
      await msg.reply(RESPONSES.AGUARDANDO_QTD(msg.body));
      return;
    }
    
    // Coletar quantidade
    if (userStages[from] === 'AGUARDANDO_QTD') {
      const qtd = parseInt(msg.body);
      if (isNaN(qtd) || qtd <= 0) {
        await msg.reply(RESPONSES.ERRO_VALIDACAO);
        return;
      }
      userData[from].qtd = qtd;
      userStages[from] = 'AGUARDANDO_ENDERECO';
      await msg.reply(RESPONSES.AGUARDANDO_ENDERECO);
      return;
    }
    
    // Coletar endereço
    if (userStages[from] === 'AGUARDANDO_ENDERECO') {
      userData[from].endereco = msg.body;
      userStages[from] = 'PEDIDO_AGUARDANDO_CONFIRMACAO';
      const resumo = RESPONSES.PEDIDO_RESUMO(
        userData[from].nome,
        userData[from].qtd,
        userData[from].endereco
      );
      await msg.reply(resumo);
      return;
    }
    
    // Confirmar pedido
    if (userStages[from] === 'PEDIDO_AGUARDANDO_CONFIRMACAO') {
      if (text === 'sim') {
        await msg.reply(RESPONSES.PEDIDO_CONFIRMADO);
        
        // Enviar notificação ao dono
        const aviso = `🔔 *NOVO PEDIDO*\n\nCliente: ${userData[from].nome}\nQtd: ${userData[from].qtd}\nLocal: ${userData[from].endereco}\n\nResponder: ${msg.from}`;
        await client.sendMessage(OWNER_NUMBER, aviso);
        
        delete userStages[from];
        delete userData[from];
      } else if (text === 'não') {
        await msg.reply('❌ Pedido cancelado. Digite "menu" para voltar');
        delete userStages[from];
        delete userData[from];
      }
      return;
    }
    
  } catch (err) {
    console.error('Erro ao processar mensagem:', err);
    await msg.reply('⚠️ Ocorreu um erro. Por favor, tente novamente');
  }
});

// ===== TRATAMENTO DE ERROS GLOBAL =====
process.on('unhandledRejection', (err) => {
  console.error('❌ Erro não tratado:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Exceção não capturada:', err);
});

// ===== INICIALIZAR =====
client.initialize().catch(err => {
  console.error('❌ Erro ao inicializar:', err);
});
