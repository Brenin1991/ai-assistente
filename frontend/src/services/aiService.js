import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

class AIService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para tratamento de erros
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Erro na API:', error);
        throw error;
      }
    );
  }

  /**
   * Processa um comando de voz ou texto usando GROQ
   * @param {string} message - Mensagem do usuário
   * @param {string} context - Contexto adicional
   * @returns {Promise<Object>} Resposta do assistente
   */
  async processCommand(message, context = '') {
    try {
      const response = await this.api.post('/ai/process', {
        message,
        context
      });

      return {
        success: true,
        response: response.data.response,
        action: response.data.action,
        parameters: response.data.parameters,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('Erro ao processar comando:', error);
      throw new Error('Falha ao processar comando com IA');
    }
  }

  /**
   * Realiza uma pesquisa na internet usando GROQ
   * @param {string} query - Query de pesquisa
   * @returns {Promise<Object>} Resultados da pesquisa
   */
  async search(query) {
    try {
      const response = await this.api.post('/ai/search', {
        query
      });

      return {
        success: true,
        data: response.data.data,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('Erro na pesquisa:', error);
      throw new Error('Falha ao realizar pesquisa');
    }
  }

  /**
   * Analisa texto para sentimentos e contexto
   * @param {string} text - Texto para análise
   * @returns {Promise<Object>} Análise do texto
   */
  async analyzeText(text) {
    try {
      const response = await this.api.post('/ai/analyze', {
        text
      });

      return {
        success: true,
        analysis: response.data.analysis,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('Erro na análise:', error);
      throw new Error('Falha ao analisar texto');
    }
  }

  /**
   * Extrai ação da resposta do GROQ
   * @param {string} response - Resposta do GROQ
   * @returns {string} Tipo de ação
   */
  extractAction(response) {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return jsonData.action || 'general_response';
      }
    } catch (error) {
      console.warn('Erro ao extrair ação da resposta:', error);
    }

    // Análise baseada em palavras-chave
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('abrir') || lowerResponse.includes('abrir programa')) {
      return 'open_app';
    }
    if (lowerResponse.includes('tocar') || lowerResponse.includes('música')) {
      return 'play_music';
    }
    if (lowerResponse.includes('volume') || lowerResponse.includes('som')) {
      return 'volume_control';
    }
    if (lowerResponse.includes('screenshot') || lowerResponse.includes('capturar tela')) {
      return 'screenshot';
    }
    if (lowerResponse.includes('listar janelas') || lowerResponse.includes('janelas abertas')) {
      return 'list_windows';
    }
    if (lowerResponse.includes('fechar janela') || lowerResponse.includes('minimizar janela')) {
      return 'close_window';
    }
    if (lowerResponse.includes('executar comando') || lowerResponse.includes('rodar comando')) {
      return 'run_command';
    }
    
    return 'general_response';
  }

  /**
   * Extrai parâmetros da resposta do GROQ
   * @param {string} response - Resposta do GROQ
   * @returns {Object} Parâmetros extraídos
   */
  extractParameters(response) {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return jsonData.parameters || {};
      }
    } catch (error) {
      console.warn('Erro ao extrair parâmetros da resposta:', error);
    }

    // Extração baseada em análise de texto
    const lowerResponse = response.toLowerCase();
    const parameters = {};

    // Extrair nome do aplicativo usando configuração expandida
    const appKeywords = [
      // Navegadores
      { keyword: 'navegador', appName: 'chrome' },
      { keyword: 'browser', appName: 'chrome' },
      { keyword: 'chrome', appName: 'chrome' },
      { keyword: 'firefox', appName: 'firefox' },
      { keyword: 'edge', appName: 'edge' },
      
      // Aplicativos do Windows
      { keyword: 'calculadora', appName: 'calculator' },
      { keyword: 'notepad', appName: 'notepad' },
      { keyword: 'bloco de notas', appName: 'notepad' },
      { keyword: 'paint', appName: 'paint' },
      { keyword: 'wordpad', appName: 'wordpad' },
      { keyword: 'explorador', appName: 'explorer' },
      { keyword: 'arquivos', appName: 'explorer' },
      { keyword: 'terminal', appName: 'cmd' },
      { keyword: 'cmd', appName: 'cmd' },
      { keyword: 'powershell', appName: 'powershell' },
      { keyword: 'gerenciador', appName: 'taskmgr' },
      { keyword: 'tarefas', appName: 'taskmgr' },
      { keyword: 'controle', appName: 'control' },
      { keyword: 'configurações', appName: 'settings' },
      { keyword: 'settings', appName: 'settings' },
      
      // Aplicativos de desenvolvimento
      { keyword: 'vscode', appName: 'vscode' },
      { keyword: 'code', appName: 'vscode' },
      { keyword: 'visual studio', appName: 'vscode' },
      { keyword: 'editor', appName: 'vscode' },
      
      // Aplicativos de mídia
      { keyword: 'spotify', appName: 'spotify' },
      { keyword: 'música', appName: 'spotify' },
      { keyword: 'vlc', appName: 'vlc' },
      { keyword: 'player', appName: 'vlc' },
      
      // Aplicativos de comunicação
      { keyword: 'discord', appName: 'discord' },
      { keyword: 'slack', appName: 'slack' },
      { keyword: 'chat', appName: 'slack' },
      { keyword: 'equipe', appName: 'slack' },
      { keyword: 'trabalho', appName: 'slack' },
      { keyword: 'whatsapp', appName: 'whatsapp' },
      { keyword: 'zap', appName: 'whatsapp' },
      { keyword: 'telegram', appName: 'telegram' },
      { keyword: 'zoom', appName: 'zoom' },
      { keyword: 'reunião', appName: 'zoom' },
      { keyword: 'teams', appName: 'teams' },
      
      // Aplicativos de produtividade
      { keyword: 'notion', appName: 'notion' },
      { keyword: 'notas', appName: 'notion' },
      { keyword: 'obsidian', appName: 'obsidian' },
      { keyword: 'wiki', appName: 'obsidian' },
      
      // Aplicativos de jogos
      { keyword: 'steam', appName: 'steam' },
      { keyword: 'jogo', appName: 'steam' },
      { keyword: 'games', appName: 'steam' },
      
      // Aplicativos de design
      { keyword: 'photoshop', appName: 'photoshop' },
      { keyword: 'adobe', appName: 'photoshop' },
      { keyword: 'edição', appName: 'photoshop' },
      { keyword: 'figma', appName: 'figma' },
      { keyword: 'design', appName: 'figma' },
      { keyword: 'obs', appName: 'obs' },
      { keyword: 'streaming', appName: 'obs' },
      { keyword: 'gravação', appName: 'obs' },
      
      // Microsoft Office
      { keyword: 'word', appName: 'word' },
      { keyword: 'documento', appName: 'word' },
      { keyword: 'excel', appName: 'excel' },
      { keyword: 'planilha', appName: 'excel' },
      { keyword: 'powerpoint', appName: 'powerpoint' },
      { keyword: 'apresentação', appName: 'powerpoint' }
    ];
    
    for (const { keyword, appName } of appKeywords) {
      if (lowerResponse.includes(keyword)) {
        parameters.appName = appName;
        break;
      }
    }

    // Extrair query de pesquisa
    if (lowerResponse.includes('pesquisar') || lowerResponse.includes('buscar') || lowerResponse.includes('google')) {
      // Se a resposta contém muito texto explicativo, extrair apenas palavras-chave
      if (response.length > 100) {
        // Procurar por padrões específicos de tópicos
        const topicPatterns = [
          /(?:sobre|da|do|de)\s+([^.!?]+)/gi,
          /(?:situação|cenário|atual)\s+([^.!?]+)/gi,
          /(?:informações|dados)\s+([^.!?]+)/gi
        ];
        
        let searchQuery = '';
        for (const pattern of topicPatterns) {
          const match = response.match(pattern);
          if (match && match[1]) {
            searchQuery = match[1].trim();
            break;
          }
        }
        
        // Se não encontrou padrão específico, pegar as primeiras palavras relevantes
        if (!searchQuery) {
          const words = response.split(' ').filter(word => 
            word.length > 3 && 
            !['sobre', 'sobre', 'atual', 'situação', 'cenário', 'informações', 'dados', 'posso', 'ajudar', 'pesquisar'].includes(word.toLowerCase())
          );
          searchQuery = words.slice(0, 3).join(' ');
        }
      } else {
        // Resposta curta, usar diretamente
        searchQuery = response
          .replace(/pesquisar|buscar|google|sobre|sobre o que|o que é/gi, '')
          .trim();
      }
      
      parameters.query = searchQuery;
      parameters.searchQuery = searchQuery;
    }

    // Extrair controle de volume
    if (lowerResponse.includes('volume') || lowerResponse.includes('som')) {
      if (lowerResponse.includes('aumentar') || lowerResponse.includes('subir') || lowerResponse.includes('mais alto')) {
        parameters.action = 'up';
      } else if (lowerResponse.includes('diminuir') || lowerResponse.includes('descer') || lowerResponse.includes('mais baixo')) {
        parameters.action = 'down';
      } else if (lowerResponse.includes('mutar') || lowerResponse.includes('silenciar') || lowerResponse.includes('mute')) {
        parameters.action = 'mute';
      } else if (lowerResponse.includes('desmutar') || lowerResponse.includes('unmute')) {
        parameters.action = 'unmute';
      } else {
        // Tentar extrair valor numérico
        const volumeMatch = response.match(/(\d+)/);
        if (volumeMatch) {
          parameters.action = 'set';
          parameters.value = parseInt(volumeMatch[1]);
        } else {
          parameters.action = 'get';
        }
      }
    }

    // Extrair título da janela
    if (lowerResponse.includes('fechar janela') || lowerResponse.includes('minimizar janela')) {
      const windowTitle = response
        .replace(/fechar|minimizar|janela/gi, '')
        .trim();
      parameters.windowTitle = windowTitle;
      parameters.title = windowTitle;
    }

    // Extrair comando do sistema
    if (lowerResponse.includes('executar comando') || lowerResponse.includes('rodar comando')) {
      const command = response
        .replace(/executar|rodar|comando/gi, '')
        .trim();
      parameters.command = command;
    }

    return parameters;
  }

  /**
   * Verifica se o serviço está disponível
   * @returns {Promise<boolean>} Status do serviço
   */
  async checkHealth() {
    try {
      const response = await this.api.get('/health');
      return response.data.status === 'OK';
    } catch (error) {
      console.error('Serviço não disponível:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de uso
   * @returns {Promise<Object>} Estatísticas
   */
  async getStats() {
    try {
      const response = await this.api.get('/ai/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

// Instância singleton
export const aiService = new AIService();
export default aiService;
