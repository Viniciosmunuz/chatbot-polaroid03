// Script de teste interativo para simular o bot
const readline = require('readline');

// Simular estado do usuário
const userStages = {};
const userData = {};
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

const RESPONSES = {
    MENU: 'Olá! Bem-vindo(a) ao espaço polaroid 📸\nComo posso te ajudar hoje?\n\n1️⃣ Ver Catálogo e Preços (Fotos Simples e Pacotes de Eventos)\n2️⃣ Fazer Pedido de Fotos Simples\n3️⃣ 📅 Orçamento para Eventos\n4️⃣ Falar com Suporte\n5️⃣ 🚁 Serviços de Drone',
    CATALOGO_LINK: 'https://drive.google.com/file/d/1-3RjbAjgm1t_lpJLwi9wjhS87TJyktj9/view?usp=drive_link',
    CATALOGO_INFO: (link) => `Confira nossos modelos e valores no link abaixo:\n\n👉 ${link} \n\nSe deseja fazer um pedido de fotos simples, digite *2* ou *3* para orçamento de eventos.`,
    AGUARDANDO_NOME: 'Vamos lá! Primeiro, qual é o seu *Nome Completo*?',
    AGUARDANDO_QTD: (nome) => `Prazer, ${nome}! Quantas fotos polaroid você deseja revelar? (Digite a quantidade, pode ser por extenso ou em número)`,
    VALIDACAO_QTD_ERRO: '⚠️ Valor inválido. Por favor, digite a *quantidade* de fotos desejada.',
    AGUARDANDO_ENDERECO: "Certo. Para finalizar, qual o *Endereço de Entrega* (ou digite 'Retirada' se for buscar)?",
    PEDIDO_CONFIRMACAO: (nome, qtd, endereco) => `✅ *Resumo do Pedido*\n\nNome: ${nome}\nQuantidade: ${qtd} fotos\nLocal: ${endereco}\n\n*Tudo certo?* Digite:\n👉 *SIM* para confirmar e enviar para cálculo\n👉 *NÃO* para cancelar e voltar ao menu`,
    PEDIDO_CONFIRMADO: (nome, qtd, endereco) => `✅ *Pedido Confirmado!*\nNome: ${nome}\nQtd: ${qtd} fotos\nLocal: ${endereco}\n\n📸 *PRÓXIMO PASSO:* Por favor, envie as fotos que você quer revelar aqui no chat.\n\nSeu pedido foi encaminhado para análise de valor. *Aguarde a mensagem de um atendente com o valor total e o QR Code Pix*.`,
    AGUARDANDO_TIPO_EVENTO: 'Ótimo! Para pacotes de eventos, qual é o *Tipo de Evento*? (Ex: Aniversário, Casamento, Corporativo)',
    AGUARDANDO_DATA_EVENTO: (tipo) => `Qual é a *Data* do seu evento "${tipo}"? (Ex: DD/MM/AAAA)`,
    VALIDACAO_DATA_ERRO: '⚠️ Formato inválido. Por favor, digite a data no formato *DD/MM/AAAA*.',
    PEDIDO_RESUMO: (nome, qtd, endereco) => `✅ *Pedido de ${qtd} fotos Registrado!*
Nome: ${nome}
Local: ${endereco}

📸 *PRÓXIMO PASSO:* Por favor, envie as fotos que você quer revelar aqui no chat.`,
    PEDIDO_AGUARDANDO_CALCULO: 'Seu pedido está em análise de valor. Aguarde o atendente enviar o valor e o Pix.',
    MIDIA_RECEBIDA: '📸 Recebi sua foto/vídeo! Continue enviando todas as que deseja revelar.',
    ORCAMENTO_CLIENTE: (tipo, data) => `Seu pedido de orçamento para o evento "${tipo}" na data ${data} foi registrado!\n\nUm de nossos especialistas em eventos entrará em contato com você em breve.`,
    SUPORTE_INICIO: 'Ok! Um atendente humano já vai te responder em instantes. Para voltar ao menu, digite *Menu*.',
    DRONE_AGUARDANDO_NOME: 'Entendido! Para o serviço de drone, qual é o seu *Nome e Sobrenome*?',
    DRONE_FINALIZADO_CLIENTE: (nome) => `Obrigado(a), ${nome}! 🚁\n\nSeu interesse em *Serviços de Drone* foi registrado com sucesso!\n\nLogo um atendente vai responder com mais informações sobre seu projeto. Até logo!`,
    INATIVIDADE: 'Olá! Parece que ficamos inativos por um tempo. Para recomeçar, digite *Menu*.',
    RESPOSTA_PADRAO: 'Desculpe, não consegui entender sua última mensagem. Digite *Menu* para ver as opções.',
};

function isInitialTrigger(text) {
  return /(oi|ola|olá|menu|boa tarde|boa noite|bom dia)/i.test(text);
}

async function processMessage(from, body) {
  try {
    body = (body || '').trim();
    let state = userStages[from] || null;

    // Se estiver em inatividade, reinicia
    if (state && userData[from] && userData[from].lastActivity && (Date.now() - userData[from].lastActivity > INACTIVITY_TIMEOUT)) {
        console.log('\n⏱️ Sessão expirada por inatividade.');
        state = null;
        delete userStages[from];
        delete userData[from];
    }

    // Atualiza atividade
    if (state !== 'SUPORTE') {
        userData[from] = userData[from] || {};
        userData[from].lastActivity = Date.now();
    }

    // TRATAMENTO DE SUPORTE
    if (state === 'SUPORTE' && isInitialTrigger(body)) {
        console.log(`\n🤖 Bot: ${RESPONSES.MENU}`);
        userStages[from] = 'MENU_PRINCIPAL';
        return;
    }

    // ESTADO 0 (INICIO)
    if (!state && isInitialTrigger(body)) {
      console.log(`\n🤖 Bot: ${RESPONSES.MENU}`);
      userStages[from] = 'MENU_PRINCIPAL';
      return;
    }

    // MENU PRINCIPAL
    if (state === 'MENU_PRINCIPAL') {
      if (body === '1') {
        console.log(`\n🤖 Bot: ${RESPONSES.CATALOGO_INFO(RESPONSES.CATALOGO_LINK)}`);
        return;
      }
      
      if (body === '2') {
        console.log(`\n🤖 Bot: ${RESPONSES.AGUARDANDO_NOME}`);
        userStages[from] = 'AGUARDANDO_NOME';
        userData[from] = userData[from] || {};
        return;
      }
      
      if (body === '3') {
        console.log(`\n🤖 Bot: ${RESPONSES.AGUARDANDO_TIPO_EVENTO}`);
        userStages[from] = 'AGUARDANDO_TIPO_EVENTO';
        userData[from] = userData[from] || {};
        return;
      }
      
      if (body === '4') {
        console.log(`\n🤖 Bot: ${RESPONSES.SUPORTE_INICIO}`);
        console.log(`\n📞 [NOTIFICAÇÃO ENVIADA AO DONO]`);
        userStages[from] = 'SUPORTE';
        return;
      }
      
      if (body === '5') {
        console.log(`\n🤖 Bot: ${RESPONSES.DRONE_AGUARDANDO_NOME}`);
        userStages[from] = 'AGUARDANDO_NOME_DRONE';
        userData[from] = userData[from] || {};
        return;
      }

      console.log(`\n🤖 Bot: ${RESPONSES.RESPOSTA_PADRAO}`);
      return;
    }

    // FUNIL DE PEDIDO SIMPLES
    if (state === 'AGUARDANDO_NOME') {
      userData[from].nome = body;
      const nomeCurto = userData[from].nome.split(" ")[0];
      console.log(`\n🤖 Bot: ${RESPONSES.AGUARDANDO_QTD(nomeCurto)}`);
      userStages[from] = 'AGUARDANDO_QTD';
      return;
    }

    if (state === 'AGUARDANDO_QTD') {
      const isNumber = /^\d+$/.test(body);
      const isPositiveNumber = isNumber && parseInt(body) > 0;
      const isText = body.length > 2;

      if (isPositiveNumber || isText) {
          userData[from].qtd = body;
          console.log(`\n🤖 Bot: ${RESPONSES.AGUARDANDO_ENDERECO}`);
          userStages[from] = 'AGUARDANDO_ENDERECO';
          return;
      }
      
      console.log(`\n🤖 Bot: ${RESPONSES.VALIDACAO_QTD_ERRO}`);
      return;
    }

    // AGUARDANDO_ENDERECO (PARADA PARA CONFIRMAÇÃO)
    if (state === 'AGUARDANDO_ENDERECO') {
      userData[from].endereco = body;
      const nome = userData[from].nome || '';
      const qtd = userData[from].qtd || '';
      const endereco = userData[from].endereco || '';

      // Mostra resumo e pede confirmação
      console.log(`\n🤖 Bot: ${RESPONSES.PEDIDO_CONFIRMACAO(nome, qtd, endereco)}`);
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

        // 1. Confirmação ao cliente
        console.log(`\n🤖 Bot: ${RESPONSES.PEDIDO_CONFIRMADO(nome, qtd, endereco)}`);
        
        // 2. Notificação para o Dono 
        console.log(`\n📞 [NOTIFICAÇÃO ENVIADA AO DONO COM DADOS DO PEDIDO]`);

        // Mudar para o estado que aguarda INTERVENÇÃO MANUAL
        userStages[from] = 'PEDIDO_AGUARDANDO_CALCULO';
        return;
      }

      if (confirmacao === 'NÃO' || confirmacao === 'NAO' || confirmacao === 'N') {
        // Cancela e volta ao menu
        console.log(`\n🤖 Bot: Pedido cancelado. Voltando ao menu...\n\n${RESPONSES.MENU}`);
        userStages[from] = 'MENU_PRINCIPAL';
        delete userData[from];
        return;
      }

      // Se não for SIM nem NÃO, pede novamente
      console.log(`\n🤖 Bot: ⚠️ Por favor, digite *SIM* para confirmar ou *NÃO* para cancelar.`);
      return;
    }

    if (state === 'PEDIDO_AGUARDANDO_CALCULO') {
        if (isInitialTrigger(body)) {
            console.log(`\n🤖 Bot: ${RESPONSES.MENU}`);
            userStages[from] = 'MENU_PRINCIPAL';
            return;
        }

        if (body.length > 0) {
             console.log(`\n🤖 Bot: ${RESPONSES.PEDIDO_AGUARDANDO_CALCULO}`);
             return;
        }
    }

    // FUNIL DE EVENTOS
    if (state === 'AGUARDANDO_TIPO_EVENTO') {
        userData[from].tipoEvento = body;
        console.log(`\n🤖 Bot: ${RESPONSES.AGUARDANDO_DATA_EVENTO(body)}`);
        userStages[from] = 'AGUARDANDO_DATA_EVENTO';
        return;
    }

    if (state === 'AGUARDANDO_DATA_EVENTO') {
        userData[from].dataEvento = body;
        const tipoEvento = userData[from].tipoEvento;
        
        console.log(`\n🤖 Bot: ${RESPONSES.ORCAMENTO_CLIENTE(tipoEvento, body)}`);
        console.log(`\n📞 [NOTIFICAÇÃO ENVIADA AO DONO - ORÇAMENTO DE EVENTO]`);
        delete userStages[from];
        delete userData[from];
        return;
    }

    // DRONE
    if (state === 'AGUARDANDO_NOME_DRONE') {
        userData[from].nomeDrone = body;
        const nomeCliente = userData[from].nomeDrone;
        
        console.log(`\n🤖 Bot: ${RESPONSES.DRONE_FINALIZADO_CLIENTE(nomeCliente.split(' ')[0])}`);
        console.log(`\n📞 [NOTIFICAÇÃO ENVIADA AO DONO - ORÇAMENTO DE DRONE]`);
        delete userStages[from];
        delete userData[from];
        return;
    }

    // RESPOSTA PADRÃO
    if (state !== 'SUPORTE' && !isInitialTrigger(body)) {
        console.log(`\n🤖 Bot: ${RESPONSES.RESPOSTA_PADRAO}`);
    }

  } catch (err) {
    console.error('❌ Erro ao processar mensagem:', err);
  }
}

// Interface interativa
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🧪 TESTE INTERATIVO DO BOT WHATSAPP');
console.log('====================================');
console.log('Digite suas mensagens abaixo. Digite "sair" para encerrar.\n');

const from = 'teste_usuario'; // Simular um usuário

function promptUser() {
  rl.question('\n👤 Você: ', async (input) => {
    if (input.toLowerCase() === 'sair') {
      console.log('\n👋 Até logo!');
      rl.close();
      return;
    }

    await processMessage(from, input);
    promptUser();
  });
}

promptUser();
