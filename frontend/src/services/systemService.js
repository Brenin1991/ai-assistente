import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

class SystemService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Abre um aplicativo
   * @param {string} appName - Nome do aplicativo
   * @param {string} path - Caminho do aplicativo (opcional)
   * @returns {Promise<Object>} Resultado da operação
   */
  async openApp(appName, path = null) {
    try {
      const response = await this.api.post('/system/open-app', {
        appName,
        path
      });

      return {
        success: true,
        message: response.data.message,
        command: response.data.command
      };
    } catch (error) {
      console.error('Erro ao abrir aplicativo:', error);
      throw new Error(`Falha ao abrir ${appName}`);
    }
  }

  /**
   * Controla o volume do sistema
   * @param {string} action - Ação (set, mute, unmute, up, down)
   * @param {number} level - Nível do volume (0-100)
   * @returns {Promise<Object>} Resultado da operação
   */
  async controlVolume(action, level = null) {
    try {
      const response = await this.api.post('/system/volume', {
        action,
        level
      });

      return {
        success: true,
        message: response.data.message,
        action: response.data.action
      };
    } catch (error) {
      console.error('Erro ao controlar volume:', error);
      throw new Error('Falha ao controlar volume do sistema');
    }
  }

  /**
   * Obtém informações do sistema
   * @returns {Promise<Object>} Informações do sistema
   */
  async getSystemInfo() {
    try {
      const response = await this.api.get('/system/info');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao obter informações do sistema:', error);
      throw new Error('Falha ao obter informações do sistema');
    }
  }

  /**
   * Executa um comando do sistema
   * @param {string} command - Comando a executar
   * @param {boolean} safe - Se deve usar apenas comandos seguros
   * @returns {Promise<Object>} Resultado do comando
   */
  async executeCommand(command, safe = true) {
    try {
      const response = await this.api.post('/system/execute', {
        command,
        safe
      });

      return {
        success: true,
        output: response.data.output,
        command: response.data.command
      };
    } catch (error) {
      console.error('Erro ao executar comando:', error);
      throw new Error(`Falha ao executar comando: ${command}`);
    }
  }

  /**
   * Lista aplicativos instalados
   * @returns {Promise<Array>} Lista de aplicativos
   */
  async getInstalledApps() {
    try {
      // Implementar lógica para listar aplicativos instalados
      // Por enquanto, retorna uma lista básica
      return [
        { name: 'Navegador', command: 'browser', icon: '🌐' },
        { name: 'Calculadora', command: 'calculator', icon: '🧮' },
        { name: 'Editor de Texto', command: 'notepad', icon: '📝' },
        { name: 'Terminal', command: 'terminal', icon: '💻' },
        { name: 'Explorador', command: 'explorer', icon: '📁' },
        { name: 'Spotify', command: 'spotify', icon: '🎵' },
        { name: 'Discord', command: 'discord', icon: '💬' },
        { name: 'Steam', command: 'steam', icon: '🎮' }
      ];
    } catch (error) {
      console.error('Erro ao listar aplicativos:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas de performance
   * @returns {Promise<Object>} Estatísticas de performance
   */
  async getPerformanceStats() {
    try {
      const systemInfo = await this.getSystemInfo();
      
      return {
        cpu: {
          cores: systemInfo.cpus,
          usage: 0 // Implementar monitoramento real de CPU
        },
        memory: {
          total: systemInfo.totalMemory,
          free: systemInfo.freeMemory,
          used: systemInfo.totalMemory - systemInfo.freeMemory,
          usage: ((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory) * 100
        },
        uptime: systemInfo.uptime,
        platform: systemInfo.platform
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de performance:', error);
      throw new Error('Falha ao obter estatísticas de performance');
    }
  }

  /**
   * Reinicia o sistema
   * @returns {Promise<Object>} Resultado da operação
   */
  async restartSystem() {
    try {
      const response = await this.executeCommand('shutdown /r /t 0', false);
      return {
        success: true,
        message: 'Sistema será reiniciado em breve'
      };
    } catch (error) {
      console.error('Erro ao reiniciar sistema:', error);
      throw new Error('Falha ao reiniciar sistema');
    }
  }

  /**
   * Desliga o sistema
   * @returns {Promise<Object>} Resultado da operação
   */
  async shutdownSystem() {
    try {
      const response = await this.executeCommand('shutdown /s /t 0', false);
      return {
        success: true,
        message: 'Sistema será desligado em breve'
      };
    } catch (error) {
      console.error('Erro ao desligar sistema:', error);
      throw new Error('Falha ao desligar sistema');
    }
  }

  /**
   * Hiberna o sistema
   * @returns {Promise<Object>} Resultado da operação
   */
  async hibernateSystem() {
    try {
      const response = await this.executeCommand('shutdown /h', false);
      return {
        success: true,
        message: 'Sistema será hibernado em breve'
      };
    } catch (error) {
      console.error('Erro ao hibernar sistema:', error);
      throw new Error('Falha ao hibernar sistema');
    }
  }

  /**
   * Obtém informações de rede
   * @returns {Promise<Object>} Informações de rede
   */
  async getNetworkInfo() {
    try {
      const response = await this.executeCommand('ipconfig /all');
      return {
        success: true,
        info: response.output
      };
    } catch (error) {
      console.error('Erro ao obter informações de rede:', error);
      throw new Error('Falha ao obter informações de rede');
    }
  }

  /**
   * Lista processos em execução
   * @returns {Promise<Array>} Lista de processos
   */
  async getRunningProcesses() {
    try {
      const response = await this.executeCommand('tasklist');
      // Parsear output do tasklist
      const processes = response.output
        .split('\n')
        .slice(3) // Pular cabeçalhos
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            name: parts[0],
            pid: parts[1],
            memory: parts[4]
          };
        });

      return processes;
    } catch (error) {
      console.error('Erro ao listar processos:', error);
      throw new Error('Falha ao listar processos');
    }
  }
}

// Instância singleton
export const systemService = new SystemService();
export default systemService;
