const express = require('express');
const { Groq } = require('groq-sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Inicializar GROQ
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Carregar configuração de aplicativos
let appsConfig = null;
const loadAppsConfig = () => {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'apps.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    appsConfig = JSON.parse(configData);
  } catch (error) {
    console.error('Erro ao carregar configuração de aplicativos:', error);
    appsConfig = null;
  }
};

// Carregar configuração na inicialização
loadAppsConfig();

// Função para encontrar aplicativo por palavra-chave
const findAppByKeyword = (message) => {
  if (!appsConfig || !appsConfig.apps) return null;
  
  const lowerMessage = message.toLowerCase();
  
  for (const [appId, appInfo] of Object.entries(appsConfig.apps)) {
    // Verificar se a mensagem contém o ID do app
    if (lowerMessage.includes(appId.toLowerCase())) {
      return { appId, appInfo };
    }
    
    // Verificar se a mensagem contém o nome do app
    if (lowerMessage.includes(appInfo.name.toLowerCase())) {
      return { appId, appInfo };
    }
    
    // Verificar se a mensagem contém alguma palavra-chave
    for (const keyword of appInfo.keywords || []) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return { appId, appInfo };
      }
    }
  }
  
  return null;
};

// Rota para análise de imagens
router.post('/analyze-image', async (req, res) => {
  try {
    const { imagePath, prompt = "Descreva o que você vê nesta imagem" } = req.body;
    
    console.log('Análise de imagem - Parâmetros recebidos:', { imagePath, prompt });
    
    if (!imagePath) {
      return res.status(400).json({ error: 'Caminho da imagem é obrigatório' });
    }

    // Verificar se o arquivo existe
    const fs = require('fs');
    console.log('Verificando se arquivo existe:', imagePath);
    console.log('Arquivo existe:', fs.existsSync(imagePath));
    
    if (!fs.existsSync(imagePath)) {
      console.log('Arquivo não encontrado:', imagePath);
      return res.status(400).json({ error: 'Arquivo de imagem não encontrado' });
    }

    // Ler a imagem como base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeType(imagePath);
    
    console.log('Imagem processada:', {
      tamanhoBuffer: imageBuffer.length,
      tamanhoBase64: base64Image.length,
      mimeType: mimeType
    });

    console.log('Enviando para GROQ...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.7,
      max_completion_tokens: 1000,
    });

    console.log('Resposta do GROQ:', completion.choices[0].message.content);

    res.json({
      success: true,
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao analisar imagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao analisar imagem com IA'
    });
  }
});

// Rota para upload de imagens
router.post('/analyze-image-upload', async (req, res) => {
  try {
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    
    // Configurar multer para upload
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `upload_${timestamp}_${file.originalname}`;
        cb(null, filename);
      }
    });

    const upload = multer({ 
      storage: storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos de imagem são permitidos'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      }
    });

    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Erro no upload:', err);
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo foi enviado'
        });
      }

      const imagePath = req.file.path;
      console.log('Imagem enviada:', imagePath);

      res.json({
        success: true,
        imagePath: imagePath,
        message: 'Imagem enviada com sucesso'
      });
    });

  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Função para determinar o tipo MIME da imagem
function getMimeType(filePath) {
  const ext = filePath.toLowerCase().split('.').pop();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// Rota para processar comandos de voz/texto
router.post('/process', async (req, res) => {
  try {
    const { message, context = '' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Prompt para o GROQ entender o contexto do assistente
    const systemPrompt = `Você é um assistente pessoal inteligente para PC. Responda de forma natural e útil.

    INSTRUÇÕES CRÍTICAS:
    1. SEMPRE leia o contexto da conversa anterior antes de responder
    2. Se o usuário fizer perguntas sobre análises anteriores (como "qual é a cidade?", "sabe qual cidade?", "ele é famoso?"), use as informações das análises anteriores para responder
    3. NUNCA diga que não analisou algo se no contexto há uma análise anterior
    4. Use as informações que estão no contexto da conversa para responder perguntas
    5. Se não conseguir identificar algo específico nas análises anteriores, seja honesto mas use o que você tem

    EXEMPLO:
    - Se no contexto há "A imagem mostra um edifício de vidro e metal com cúpulas"
    - E o usuário pergunta "sabe qual cidade?"
    - Responda: "Baseado na análise anterior, vejo que é um edifício com estrutura de vidro e metal com cúpulas, mas não consigo identificar a cidade específica apenas pela imagem. Seria necessário mais informações ou contexto para determinar a localização exata."
    
    EXEMPLO DE PERGUNTAS SOBRE MÚSICA:
    - Se o usuário pergunta "gosta de nirvana?" ou "qual a melhor musica deles?"
    - Responda normalmente sobre a banda, sem executar ações
    
    EXEMPLO DE PERGUNTAS SOBRE IMAGENS ANALISADAS:
    - Se no contexto há "A imagem mostra uma cena de jogo com carro em chamas"
    - E o usuário pergunta "pelos graficos, qual console?"
    - Responda: "Baseado na análise anterior, vejo que é uma cena de jogo com gráficos de alta qualidade. Pela resolução de 1920x1080 e 60 FPS mostrados, pode ser um jogo para console moderno como PlayStation 5 ou Xbox Series X, mas seria necessário mais informações para determinar com certeza."
    
    EXEMPLO DE PERGUNTAS SOBRE SIGNIFICADO:
    - Se no contexto há "A imagem mostra uma caixa de texto sobre a caverna de Altamira"
    - E o usuário pergunta "oq significa?"
    - Responda: "Baseado na análise anterior, a imagem é uma caixa de texto que convida o leitor a visitar a caverna de Altamira, na Espanha, e menciona as pinturas rupestres encontradas lá. É uma mensagem sobre arte pré-histórica e patrimônio cultural."

    Quando o usuário pedir para:
    - Abrir programas: responda normalmente e mencione que vai abrir o programa
    - Tocar música: responda normalmente e mencione que vai tocar música
    - Pesquisar algo: responda normalmente e mencione que vai pesquisar
    - Controlar volume: responda normalmente e mencione que vai ajustar o volume
    - Analisar tela: responda brevemente que vai analisar a tela
    
    IMPORTANTE: Para análise de tela, responda apenas "Vou analisar sua tela agora" ou similar. Não dê explicações longas.
    
    Seja sempre útil, amigável e direto. Não use formato JSON, apenas responda como um assistente real.`;

    // Função para buscar URL inteligentemente usando GROQ
    const findUrlIntelligently = async (message) => {
      try {
        const searchPrompt = `O usuário quer acessar um site. Baseado na mensagem "${message}" e no contexto da conversa, encontre a URL correta do site.

        CONTEXTO DA CONVERSA: ${context || 'Nenhum contexto disponível'}

        Responda APENAS com a URL completa no formato: https://exemplo.com
        Se não conseguir encontrar, responda: NOT_FOUND

        Exemplos:
        "abrir youtube" → https://www.youtube.com
        "acessar steam" → https://store.steampowered.com
        "ir para itch.io" → https://itch.io
        "abrir facebook" → https://www.facebook.com
        "acessar github" → https://github.com
        "ir para netflix" → https://www.netflix.com
        "abrir discord" → https://discord.com
        "acessar twitch" → https://www.twitch.tv
        "ir para reddit" → https://www.reddit.com
        "abrir linkedin" → https://www.linkedin.com
        "acessar pinterest" → https://www.pinterest.com
        "ir para tiktok" → https://www.tiktok.com
        "abrir whatsapp" → https://web.whatsapp.com
        "acessar spotify" → https://www.spotify.com
        "ir para gmail" → https://www.gmail.com
        "abrir instagram" → https://www.instagram.com
        "acessar twitter" → https://www.twitter.com
        "ir para google" → https://www.google.com
        
        Para pesquisas no YouTube, use: https://www.youtube.com/results?search_query=TERMO_DE_PESQUISA
        Para pesquisas no Google, use: https://www.google.com/search?q=TERMO_DE_PESQUISA
        
        IMPORTANTE: Se o usuário mencionar "pesquisar", "buscar", "procurar" ou "search", construa a URL de pesquisa!
        Exemplo: "youtube e pesquisar sobre xbox" → https://www.youtube.com/results?search_query=xbox
        Exemplo: "abra helter skelter" → https://www.youtube.com/results?search_query=helter+skelter
        Exemplo: "abra no youtube" → https://www.youtube.com/results?search_query=helter+skelter
        
        CONTEXTO: Se o usuário estava falando sobre um assunto específico, use esse contexto para entender o que ele quer pesquisar!`;

        const searchResponse = await groq.chat.completions.create({
          messages: [{ role: "user", content: searchPrompt }],
          model: "llama-3.1-8b-instant",
          max_completion_tokens: 200,
          temperature: 0.1
        });

        const urlText = searchResponse.choices[0].message.content.trim();
        
        if (urlText === 'NOT_FOUND') {
          return null;
        }
        
        // Validar se é uma URL válida
        try {
          new URL(urlText);
          return { url: urlText, type: 'found', siteName: new URL(urlText).hostname };
        } catch (e) {
          return null;
        }
        
      } catch (error) {
        console.error('Erro ao buscar URL:', error);
        return null;
      }
    };

    // Construir histórico de mensagens para contexto
    let conversationHistory = [];
    
    if (context && context.trim()) {
      console.log('Contexto recebido:', context);
      // Parse do contexto enviado pelo frontend
      const contextLines = context.split('\n').filter(line => line.trim());
      console.log('Linhas do contexto:', contextLines);
      for (const line of contextLines) {
        if (line.startsWith('Usuário:')) {
          conversationHistory.push({
            role: "user",
            content: line.replace('Usuário:', '').trim()
          });
        } else if (line.startsWith('Assistente:')) {
          conversationHistory.push({
            role: "assistant", 
            content: line.replace('Assistente:', '').trim()
          });
        }
      }
      console.log('Histórico de conversa construído:', conversationHistory);
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...conversationHistory,
        {
          role: "user",
          content: message
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';
    
    // Detectar ação baseada no conteúdo da resposta
    let action = 'general_response';
    let parameters = {};
    let finalResponse = response;
    
    const lowerResponse = response.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    // Detectar ações baseadas nas palavras-chave
    console.log('lowerMessage:', lowerMessage);
    console.log('lowerResponse:', lowerResponse);
    
    // Detectar análise de tela primeiro
    if (lowerMessage.includes('analise minha tela') || lowerMessage.includes('analisar tela') ||
        lowerMessage.includes('analise a tela') || lowerMessage.includes('descrever tela') ||
        lowerMessage.includes('o que tem na tela') || lowerMessage.includes('identificar tela') ||
        lowerMessage.includes('explicar tela') || lowerMessage.includes('ver tela') ||
        lowerMessage.includes('analise print') || lowerMessage.includes('descrever print') ||
        lowerMessage.includes('consegue analisar') || lowerMessage.includes('veja oq tem') ||
        lowerMessage.includes('veja o que tem') || lowerMessage.includes('mostrar tela') ||
        lowerMessage.includes('capturar e analisar') || lowerMessage.includes('tirar print e analisar')) {
      console.log('Detectou análise de tela!');
      action = 'analyze_screen';
      
      // Extrair prompt personalizado se fornecido
      const promptMatch = message.match(/(?:descrever|explicar|analisar|identificar)\s+(.+?)(?:\s+(?:tela|print))?/i);
      if (promptMatch) {
        parameters.prompt = promptMatch[1].trim();
      }
    }
    // Detectar análise de imagem
    else if (lowerMessage.includes('analise') && lowerMessage.includes('imagem') ||
        lowerMessage.includes('analisar imagem') || lowerMessage.includes('descrever imagem') ||
        lowerMessage.includes('o que tem na imagem') || lowerMessage.includes('identificar imagem') ||
        lowerMessage.includes('explicar imagem') || lowerMessage.includes('ver imagem')) {
      console.log('Detectou análise de imagem!');
      action = 'analyze_image';
      
      // Extrair caminho da imagem - busca por padrões de caminho
      console.log('Mensagem original:', message);
      console.log('Tentando regex principal...');
      
      const imagePathMatch = message.match(/(?:imagem|arquivo|foto)\s*:?\s*([A-Za-z]:\\[^\s]+\.(png|jpg|jpeg|gif|bmp|webp))/i);
      console.log('Resultado regex principal:', imagePathMatch);
      
      if (imagePathMatch) {
        parameters.imagePath = imagePathMatch[1].trim();
        console.log('Caminho da imagem extraído:', parameters.imagePath);
      } else {
        console.log('Tentando regex fallback...');
        // Tentar capturar qualquer caminho que termine com extensão de imagem
        const anyPathMatch = message.match(/([A-Za-z]:\\[^\s]+\.(png|jpg|jpeg|gif|bmp|webp))/i);
        console.log('Resultado regex fallback:', anyPathMatch);
        
        if (anyPathMatch) {
          parameters.imagePath = anyPathMatch[1].trim();
          console.log('Caminho da imagem extraído (fallback):', parameters.imagePath);
        } else {
          console.log('Nenhuma regex funcionou, tentando captura simples...');
          // Captura mais simples - qualquer coisa após "imagem:"
          const simpleMatch = message.match(/imagem:\s*(.+)/i);
          if (simpleMatch) {
            parameters.imagePath = simpleMatch[1].trim();
            console.log('Caminho da imagem extraído (simples):', parameters.imagePath);
          }
        }
      }
      
      // Extrair prompt personalizado se fornecido
      const promptMatch = message.match(/(?:descrever|explicar|analisar|identificar)\s+(.+?)(?:\s+(?:imagem|arquivo|foto))?/i);
      if (promptMatch) {
        parameters.prompt = promptMatch[1].trim();
      }
    }
    // Detectar screenshot
    else if (lowerMessage.includes('screenshot') || lowerMessage.includes('capturar tela') || 
        lowerMessage.includes('tirar print') || lowerMessage.includes('print screen') ||
        lowerMessage.includes('captura') || lowerMessage.includes('print')) {
      console.log('Detectou screenshot!');
      console.log('Mensagem:', message);
      console.log('lowerMessage:', lowerMessage);
      action = 'screenshot';
      
      // Detectar tipo de screenshot
      if (lowerMessage.includes('tela inteira') || lowerMessage.includes('tela completa')) {
        parameters.screenshotType = 'full';
      } else if (lowerMessage.includes('janela ativa') || lowerMessage.includes('janela em foco')) {
        parameters.screenshotType = 'active';
      } else if (lowerMessage.includes('janela') && !lowerMessage.includes('ativa')) {
        // Extrair nome da janela
        const windowMatch = lowerMessage.match(/janela\s+(.+?)(?:\s|$)/);
        if (windowMatch) {
          parameters.screenshotType = 'window';
          parameters.windowTitle = windowMatch[1].trim();
        } else {
          parameters.screenshotType = 'full'; // fallback
        }
      } else {
        // Detectar se há nome de aplicativo após "screenshot" usando apps.json
        if (appsConfig && appsConfig.apps) {
          for (const [appId, appInfo] of Object.entries(appsConfig.apps)) {
            // Verificar se a mensagem contém o ID do app
            if (lowerMessage.includes(appId.toLowerCase())) {
              parameters.screenshotType = 'window';
              parameters.windowTitle = appId;
              break;
            }
            
            // Verificar se a mensagem contém o nome do app
            if (lowerMessage.includes(appInfo.name.toLowerCase())) {
              parameters.screenshotType = 'window';
              parameters.windowTitle = appInfo.name;
              break;
            }
            
            // Verificar se a mensagem contém alguma palavra-chave
            for (const keyword of appInfo.keywords || []) {
              if (lowerMessage.includes(keyword.toLowerCase())) {
                parameters.screenshotType = 'window';
                parameters.windowTitle = keyword;
                break;
              }
            }
            
            if (parameters.screenshotType === 'window') break;
          }
        }
        
        // Se não encontrou app específico, usar full
        if (!parameters.screenshotType) {
          parameters.screenshotType = 'full';
        }
      }
      
      console.log('Parâmetros screenshot finais:', {
        screenshotType: parameters.screenshotType,
        windowTitle: parameters.windowTitle
      });
      
    } else if (lowerMessage.includes('focar') || lowerMessage.includes('focar em') || 
        lowerMessage.includes('ir para') || lowerMessage.includes('mudar para')) {
      action = 'focus_window';
      
      // Detectar nome da janela usando apps.json
      if (appsConfig && appsConfig.apps) {
        for (const [appId, appInfo] of Object.entries(appsConfig.apps)) {
          // Verificar se a mensagem contém o ID do app
          if (lowerMessage.includes(appId.toLowerCase())) {
            parameters.windowTitle = appId;
            break;
          }
          
          // Verificar se a mensagem contém o nome do app
          if (lowerMessage.includes(appInfo.name.toLowerCase())) {
            parameters.windowTitle = appInfo.name;
            break;
          }
          
          // Verificar se a mensagem contém alguma palavra-chave
          for (const keyword of appInfo.keywords || []) {
            if (lowerMessage.includes(keyword.toLowerCase())) {
              parameters.windowTitle = keyword;
              break;
            }
          }
          
          if (parameters.windowTitle) break;
        }
      }
      
      // Se não encontrou app específico, tentar extrair da mensagem
      if (!parameters.windowTitle) {
        const focusMatch = message.match(/(?:focar|focar em|ir para|mudar para)\s+(.+?)(?:\s|$)/i);
        if (focusMatch) {
          parameters.windowTitle = focusMatch[1].trim();
        }
      }
      
    } else {
      // Usar IA para determinar o que o usuário quer
      const actionPrompt = `O usuário disse: "${message}"
      
      CONTEXTO DA CONVERSA: ${context || 'Nenhum contexto disponível'}
      
      Você é um assistente que precisa distinguir entre CONVERSA NORMAL e COMANDOS ESPECÍFICOS.
      
      ⚠️ IMPORTANTE: SE FOR CONVERSA NORMAL, SEMPRE RESPONDA NONE ⚠️
      
      CONVERSA NORMAL = NONE (sempre):
      - Cumprimentos: "olá", "bom dia", "oi", "boa tarde", "boa noite"
      - Perguntas sobre análises anteriores: "oq significa?", "qual console?", "ele é famoso?", "sabe qual cidade?"
      - Perguntas sobre música: "gosta de nirvana?", "qual a melhor musica deles?"
      - Perguntas sobre imagens analisadas: "pelos graficos, qual console?", "que console é esse?"
      - Perguntas sobre significado: "o que significa?", "oq significa?"
      - Frustrações: "eu fiz uma pergunta", "fiz uma pergunta", "cara, para com isso me responda porra"
      - Xingamentos: "vai se foder", "vai tomar no seu cu"
      - Qualquer pergunta que não seja um comando específico
      - Qualquer conversa normal
      
      COMANDOS ESPECÍFICOS (responda a ação correspondente):
      - "abrir calculadora" → APP
      - "abrir paint" → APP
      - "abrir notepad" → APP
      - "abrir youtube" → SITE
      - "pesquisar no youtube" → SITE
      - "coloque nirvana no youtube" → SITE
      - "analisar tela" → ANALYZE_SCREEN
      - "analise minha tela" → ANALYZE_SCREEN
      - "tirar screenshot" → SCREENSHOT
      - "tocar música" → MUSIC
      - "aumentar volume" → VOLUME
      - "diminuir volume" → VOLUME
      - "listar janelas" → LIST_WINDOWS
      - "fechar janela" → CLOSE_WINDOW
      - "focar janela" → FOCUS
      - "analise a imagem: [caminho]" → ANALYZE_IMAGE
      
      REGRA DE OURO: 
      - SE FOR CONVERSA NORMAL = NONE (sempre)
      - SE NÃO FOR UM COMANDO ESPECÍFICO E CLARO = NONE
      - EM DÚVIDA = NONE
      
      Responda APENAS com uma das opções abaixo (sem explicações):
      SITE
      APP
      SCREENSHOT
      MUSIC
      LIST_WINDOWS
      CLOSE_WINDOW
      RUN_COMMAND
      VOLUME
      FOCUS
      ANALYZE_IMAGE
      ANALYZE_SCREEN
      NONE`;

      try {
        const actionResponse = await groq.chat.completions.create({
          messages: [{ role: "user", content: actionPrompt }],
          model: "llama-3.1-8b-instant",
          max_completion_tokens: 10,
          temperature: 0.1
        });

        const detectedAction = actionResponse.choices[0].message.content.trim();
        console.log('Ação detectada pela IA:', detectedAction);
        console.log('Mensagem do usuário:', message);
        console.log('Contexto disponível:', context);
        
        if (detectedAction === 'SITE') {
          console.log('Detectou open_website!');
          action = 'open_website';
          
          // Usar IA para buscar URL inteligentemente
          const urlResult = await findUrlIntelligently(message);
          if (urlResult) {
            parameters.url = urlResult.url;
            parameters.siteName = urlResult.siteName;
            console.log('URL encontrada pela IA:', urlResult);
          } else {
            // Fallback para detecção manual
            const urlMatch = message.match(/(https?:\/\/[^\s]+)/i);
            if (urlMatch) {
              parameters.url = urlMatch[1];
              parameters.siteName = new URL(urlMatch[1]).hostname;
            } else {
              // Fallback para Google
              parameters.url = 'https://www.google.com';
              parameters.siteName = 'google';
            }
          }
          console.log('Ação definida como:', action);
          console.log('Parâmetros:', parameters);
        } else if (detectedAction === 'APP') {
          console.log('Detectou open_app!');
          action = 'open_app';
          
          // Usar função dinâmica para encontrar aplicativo
          const appMatch = findAppByKeyword(message);
          console.log('App encontrado:', appMatch);
          if (appMatch) {
            parameters.appName = appMatch.appId;
            parameters.appInfo = appMatch.appInfo;
            console.log('Parâmetros definidos:', { appName: parameters.appName, appInfo: parameters.appInfo });
          } else {
            console.log('Nenhum app encontrado, tentando extrair da mensagem...');
            // Se não encontrou um aplicativo específico, tentar extrair da mensagem
            const words = lowerMessage.split(' ');
            for (const word of words) {
              if (word.length > 2 && !['abrir', 'abrir', 'programa', 'aplicativo', 'app'].includes(word)) {
                parameters.appName = word;
                console.log('App extraído da mensagem:', word);
                break;
              }
            }
          }
        } else if (detectedAction === 'SCREENSHOT') {
          console.log('Detectou screenshot!');
          action = 'screenshot';
          parameters.screenshotType = 'full';
        } else if (detectedAction === 'MUSIC') {
          console.log('Detectou play_music!');
      action = 'play_music';
        } else if (detectedAction === 'LIST_WINDOWS') {
          console.log('Detectou list_windows!');
          action = 'list_windows';
        } else if (detectedAction === 'CLOSE_WINDOW') {
          console.log('Detectou close_window!');
          action = 'close_window';
          // Extrair título da janela se especificado
          const windowTitleMatch = message.match(/fechar (?:a )?janela(?:s)? (?:de )?["']?([^"']+)["']?/i);
          if (windowTitleMatch) {
            parameters.windowTitle = windowTitleMatch[1];
          }
        } else if (detectedAction === 'RUN_COMMAND') {
          console.log('Detectou run_command!');
          action = 'run_command';
          // Extrair comando se especificado
          const commandMatch = message.match(/executar comando ["']?([^"']+)["']?/i);
          if (commandMatch) {
            parameters.command = commandMatch[1];
          }
        } else if (detectedAction === 'VOLUME') {
          console.log('Detectou system_control!');
      action = 'system_control';
      if (lowerMessage.includes('aumentar') || lowerMessage.includes('subir')) {
        parameters.command = 'volume_up';
      } else if (lowerMessage.includes('diminuir') || lowerMessage.includes('descer')) {
        parameters.command = 'volume_down';
      } else if (lowerMessage.includes('mutar') || lowerMessage.includes('silenciar')) {
        parameters.command = 'volume_mute';
          }
        } else if (detectedAction === 'FOCUS') {
          console.log('Detectou focus_window!');
          action = 'focus_window';
          // Extrair título da janela
          const focusMatch = message.match(/(?:focar|focar em|ir para|mudar para)\s+(.+?)(?:\s|$)/i);
          if (focusMatch) {
            parameters.windowTitle = focusMatch[1].trim();
          }
        } else if (detectedAction === 'ANALYZE_IMAGE') {
          console.log('Detectou analyze_image!');
          action = 'analyze_image';
          // Extrair caminho da imagem se especificado
          const imagePathMatch = message.match(/(?:imagem|foto|print)[\s\S]*?([A-Za-z]:\\[^\\s]+(?:\\[^\\s]+)*)/i);
          if (imagePathMatch) {
            parameters.imagePath = imagePathMatch[1];
          }
        } else if (detectedAction === 'ANALYZE_SCREEN') {
          console.log('Detectou analyze_screen!');
          action = 'analyze_screen';
          parameters.prompt = 'Descreva o que você vê nesta tela';
        }
        // Se NONE, não define ação (fica como general_response)
        
      } catch (error) {
        console.error('Erro ao determinar ação:', error);
      }
    }
    
    // Se há uma ação específica, usar resposta mais concisa
    // EXCEÇÃO: Para análises de imagem e tela, manter a resposta da IA para contexto
    if (action !== 'general_response' && action !== 'analyze_image' && action !== 'analyze_screen') {
      finalResponse = ''; // Não mostrar mensagem da IA quando há ação específica
    } else if (action === 'analyze_image') {
      finalResponse = 'Vou analisar a imagem para você.';
    } else if (action === 'analyze_screen') {
      finalResponse = 'Vou analisar sua tela agora.';
    }
    
    res.json({
      success: true,
      response: finalResponse,
      action: action,
      parameters: parameters,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao processar comando:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Rota para pesquisas na internet
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' });
    }

    // Usar GROQ para melhorar a query de pesquisa
    const searchPrompt = `Melhore esta query de pesquisa para obter melhores resultados: "${query}". 
    Retorne apenas a query melhorada, sem explicações.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: searchPrompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 100,
    });

    const improvedQuery = completion.choices[0]?.message?.content || query;
    
    // Aqui você pode integrar com APIs de pesquisa como Google, Bing, etc.
    // Por enquanto, vamos simular uma resposta
    const searchResults = {
      query: improvedQuery,
      results: [
        {
          title: `Resultado para: ${improvedQuery}`,
          url: "https://example.com",
          snippet: "Resultado da pesquisa baseado na sua query..."
        }
      ],
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    console.error('Erro na pesquisa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao realizar pesquisa',
      details: error.message
    });
  }
});

// Rota para análise de sentimentos e contexto
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    const analysisPrompt = `Analise o seguinte texto e forneça:
    1. Sentimento (positivo, negativo, neutro)
    2. Intenção principal
    3. Ações sugeridas
    4. Nível de urgência (baixo, médio, alto)
    
    Texto: "${text}"`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 500,
    });

    const analysis = completion.choices[0]?.message?.content || 'Análise não disponível';
    
    res.json({
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na análise:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao analisar texto',
      details: error.message
    });
  }
});

module.exports = router;
