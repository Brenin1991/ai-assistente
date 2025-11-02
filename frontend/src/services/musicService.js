import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

class MusicService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.currentTrack = null;
    this.isPlaying = false;
    this.playlist = [];
    this.currentIndex = 0;
  }

  /**
   * Toca uma música
   * @param {string} filePath - Caminho do arquivo de música
   * @param {string} url - URL da música (opcional)
   * @param {string} search - Termo de pesquisa (opcional)
   * @returns {Promise<Object>} Resultado da operação
   */
  async play(filePath = null, url = null, search = null) {
    try {
      const response = await this.api.post('/music/play', {
        filePath,
        url,
        search
      });

      this.isPlaying = response.data.isPlaying;
      this.currentTrack = response.data.track;

      return {
        success: true,
        isPlaying: this.isPlaying,
        currentTrack: this.currentTrack,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erro ao tocar música:', error);
      throw new Error('Falha ao tocar música');
    }
  }

  /**
   * Pausa a música atual
   * @returns {Promise<Object>} Resultado da operação
   */
  async pause() {
    try {
      const response = await this.api.post('/music/pause');

      this.isPlaying = false;

      return {
        success: true,
        isPlaying: this.isPlaying,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erro ao pausar música:', error);
      throw new Error('Falha ao pausar música');
    }
  }

  /**
   * Retoma a música pausada
   * @returns {Promise<Object>} Resultado da operação
   */
  async resume() {
    try {
      const response = await this.api.post('/music/resume');

      this.isPlaying = response.data.isPlaying;

      return {
        success: true,
        isPlaying: this.isPlaying,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erro ao retomar música:', error);
      throw new Error('Falha ao retomar música');
    }
  }

  /**
   * Para a música atual
   * @returns {Promise<Object>} Resultado da operação
   */
  async stop() {
    try {
      const response = await this.api.post('/music/stop');

      this.isPlaying = false;
      this.currentTrack = null;

      return {
        success: true,
        isPlaying: this.isPlaying,
        currentTrack: this.currentTrack,
        message: response.data.message
      };
    } catch (error) {
      console.error('Erro ao parar música:', error);
      throw new Error('Falha ao parar música');
    }
  }

  /**
   * Obtém o status atual da música
   * @returns {Promise<Object>} Status da música
   */
  async getStatus() {
    try {
      const response = await this.api.get('/music/status');
      
      this.isPlaying = response.data.data.isPlaying;
      this.currentTrack = response.data.data.currentTrack;

      return {
        success: true,
        isPlaying: this.isPlaying,
        currentTrack: this.currentTrack,
        timestamp: response.data.data.timestamp
      };
    } catch (error) {
      console.error('Erro ao obter status da música:', error);
      throw new Error('Falha ao obter status da música');
    }
  }

  /**
   * Lista arquivos de música em um diretório
   * @param {string} directory - Diretório para listar
   * @returns {Promise<Array>} Lista de arquivos de música
   */
  async listMusic(directory) {
    try {
      const response = await this.api.post('/music/list', {
        directory
      });

      this.playlist = response.data.data.files;
      
      return {
        success: true,
        files: this.playlist,
        directory: response.data.data.directory,
        count: response.data.data.count
      };
    } catch (error) {
      console.error('Erro ao listar música:', error);
      throw new Error('Falha ao listar arquivos de música');
    }
  }

  /**
   * Toca a próxima música da playlist
   * @returns {Promise<Object>} Resultado da operação
   */
  async next() {
    if (this.playlist.length === 0) {
      throw new Error('Nenhuma música na playlist');
    }

    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    const nextTrack = this.playlist[this.currentIndex];

    return await this.play(nextTrack.path);
  }

  /**
   * Toca a música anterior da playlist
   * @returns {Promise<Object>} Resultado da operação
   */
  async previous() {
    if (this.playlist.length === 0) {
      throw new Error('Nenhuma música na playlist');
    }

    this.currentIndex = this.currentIndex === 0 
      ? this.playlist.length - 1 
      : this.currentIndex - 1;
    const prevTrack = this.playlist[this.currentIndex];

    return await this.play(prevTrack.path);
  }

  /**
   * Toca uma música específica da playlist
   * @param {number} index - Índice da música na playlist
   * @returns {Promise<Object>} Resultado da operação
   */
  async playTrack(index) {
    if (index < 0 || index >= this.playlist.length) {
      throw new Error('Índice inválido da playlist');
    }

    this.currentIndex = index;
    const track = this.playlist[index];

    return await this.play(track.path);
  }

  /**
   * Adiciona uma música à playlist
   * @param {string} filePath - Caminho do arquivo
   * @param {string} name - Nome da música
   * @returns {void}
   */
  addToPlaylist(filePath, name) {
    const track = {
      name,
      path: filePath,
      extension: filePath.split('.').pop().toLowerCase()
    };

    this.playlist.push(track);
  }

  /**
   * Remove uma música da playlist
   * @param {number} index - Índice da música a remover
   * @returns {void}
   */
  removeFromPlaylist(index) {
    if (index >= 0 && index < this.playlist.length) {
      this.playlist.splice(index, 1);
      
      // Ajustar índice atual se necessário
      if (this.currentIndex >= this.playlist.length) {
        this.currentIndex = Math.max(0, this.playlist.length - 1);
      }
    }
  }

  /**
   * Limpa a playlist
   * @returns {void}
   */
  clearPlaylist() {
    this.playlist = [];
    this.currentIndex = 0;
    this.currentTrack = null;
    this.isPlaying = false;
  }

  /**
   * Obtém a playlist atual
   * @returns {Array} Lista de músicas
   */
  getPlaylist() {
    return this.playlist;
  }

  /**
   * Obtém a música atual
   * @returns {Object|null} Música atual
   */
  getCurrentTrack() {
    return this.currentTrack;
  }

  /**
   * Obtém o índice atual da playlist
   * @returns {number} Índice atual
   */
  getCurrentIndex() {
    return this.currentIndex;
  }

  /**
   * Verifica se está tocando
   * @returns {boolean} Status de reprodução
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * Pesquisa música online (implementação futura)
   * @param {string} query - Termo de pesquisa
   * @returns {Promise<Array>} Resultados da pesquisa
   */
  async searchOnline(query) {
    try {
      // Implementar integração com APIs de música como Spotify, YouTube, etc.
      console.log('Pesquisa online não implementada ainda:', query);
      return [];
    } catch (error) {
      console.error('Erro na pesquisa online:', error);
      throw new Error('Falha na pesquisa online');
    }
  }

  /**
   * Obtém metadados de um arquivo de música
   * @param {string} filePath - Caminho do arquivo
   * @returns {Promise<Object>} Metadados da música
   */
  async getMetadata(filePath) {
    try {
      // Implementar extração de metadados usando bibliotecas como music-metadata
      return {
        title: 'Título desconhecido',
        artist: 'Artista desconhecido',
        album: 'Álbum desconhecido',
        duration: 0,
        year: null,
        genre: null
      };
    } catch (error) {
      console.error('Erro ao obter metadados:', error);
      return null;
    }
  }
}

// Instância singleton
export const musicService = new MusicService();
export default musicService;
