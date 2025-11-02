import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, Square, Settings, Minimize2, X } from 'lucide-react';
import './App.css';

// Componentes
import ChatInterface from './components/ChatInterface';
import SystemControls from './components/SystemControls';
import MusicPlayer from './components/MusicPlayer';
import SettingsPanel from './components/SettingsPanel';

// Serviços
import { aiService } from './services/aiService';
import { systemService } from './services/systemService';
import { musicService } from './services/musicService';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentView, setCurrentView] = useState('chat');
  const [systemInfo, setSystemInfo] = useState(null);
  const [musicStatus, setMusicStatus] = useState({ isPlaying: false, currentTrack: null });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    voiceSpeed: 0.85,
    voiceVolume: 0.9,
    voiceLanguage: 'pt-BR',
    theme: 'dark',
    masterVolume: 50,
    notificationSound: true,
    musicVolume: 70
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Carregar informações do sistema
    loadSystemInfo();
    loadMusicStatus();
    
    // Verificar estado de maximização da janela
    checkWindowState();
    
    // Carregar vozes disponíveis
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const portugueseVoices = voices.filter(voice => 
        voice.lang.startsWith('pt') || voice.lang === 'pt-BR'
      );
      setAvailableVoices(portugueseVoices);
      
      // Selecionar primeira voz feminina em português
      const defaultVoice = portugueseVoices.find(voice => 
        voice.name.includes('Female') || voice.name.includes('feminina') || voice.name.includes('Maria')
      ) || portugueseVoices[0];
      
      if (defaultVoice) {
        setSelectedVoice(defaultVoice);
      }
    };
    
    // Carregar vozes imediatamente e quando mudarem
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Carregar configurações salvas
    const savedSettings = localStorage.getItem('assistant-settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsedSettings }));
      setSpeechEnabled(parsedSettings.voiceEnabled || false);
      
      // Aplicar tema
      if (parsedSettings.theme) {
        document.body.className = `theme-${parsedSettings.theme}`;
      }
    }
    
    // Adicionar mensagem de boas-vindas
    setMessages([{
      id: Date.now(),
      type: 'assistant',
      content: 'Olá! Sou seu assistente pessoal. Como posso ajudá-lo hoje?',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.app-menu')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSystemInfo = async () => {
    try {
      const info = await systemService.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Erro ao carregar informações do sistema:', error);
    }
  };

  const loadMusicStatus = async () => {
    try {
      const status = await musicService.getStatus();
      setMusicStatus(status);
    } catch (error) {
      console.error('Erro ao carregar status da música:', error);
    }
  };

  const checkWindowState = async () => {
    if (window.electronAPI) {
      try {
        const maximized = await window.electronAPI.windowIsMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error('Erro ao verificar estado da janela:', error);
      }
    }
  };

  const handleVoiceCommand = async (transcript) => {
    if (!transcript.trim()) return;

    // Adicionar mensagem do usuário
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: transcript,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    setIsProcessing(true);

    try {
      // Criar contexto com histórico de mensagens (incluindo a mensagem atual)
      const contextMessages = [...messages, userMessage].slice(-10); // Últimas 10 mensagens incluindo a atual
      const context = contextMessages.map(msg => 
        `${msg.type === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`
      ).join('\n');
      
      // Processar comando com IA
      const response = await aiService.processCommand(transcript, context);
      
      // Adicionar resposta do assistente
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response,
        timestamp: new Date(),
        action: response.action,
        parameters: response.parameters
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Executar ação se necessário
      if (response.action && response.action !== 'general_response') {
        console.log('Frontend: Ação detectada:', response.action, 'Parâmetros:', response.parameters);
        await executeAction(response.action, response.parameters);
      } else {
        console.log('Frontend: Nenhuma ação a executar. Action:', response.action);
      }

      // Falar a resposta se síntese de voz estiver ativada
      if (speechEnabled && response.response) {
        speakText(response.response);
      }

    } catch (error) {
      console.error('Erro ao processar comando:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar seu comando. Tente novamente.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para limpar texto para síntese de voz
  const cleanTextForSpeech = (text) => {
    if (!text) return '';
    
    return text
      // Remover emojis
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Remover markdown bold
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Remover markdown italic
      .replace(/\*(.*?)\*/g, '$1')
      // Remover quebras de linha excessivas
      .replace(/\n{2,}/g, '\n')
      // Remover espaços extras
      .replace(/\s{2,}/g, ' ')
      // Limpar início e fim
      .trim();
  };

  // Função para síntese de voz
  const speakText = (text) => {
    if (!speechEnabled || !text) return;

    // Parar fala anterior se estiver falando
    if (isSpeaking) {
      window.speechSynthesis.cancel();
    }

    // Limpar texto antes de falar
    const cleanText = cleanTextForSpeech(text);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = settings.voiceLanguage || 'pt-BR';
    utterance.rate = settings.voiceSpeed || 0.85;
    utterance.pitch = 1.1;  // Tom um pouco mais alto
    utterance.volume = settings.voiceVolume || 0.9;

    // Usar voz selecionada pelo usuário
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('Voz selecionada:', selectedVoice.name, selectedVoice.lang);
    } else {
      // Fallback: buscar melhor voz disponível
      const voices = window.speechSynthesis.getVoices();
      const fallbackVoice = voices.find(voice => 
        voice.lang === 'pt-BR' && 
        (voice.name.includes('Female') || voice.name.includes('feminina'))
      ) || voices.find(voice => voice.lang.startsWith('pt'));
      
      if (fallbackVoice) {
        utterance.voice = fallbackVoice;
        console.log('Voz fallback:', fallbackVoice.name, fallbackVoice.lang);
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Função para parar síntese de voz
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Função para alternar síntese de voz
  const toggleSpeech = () => {
    if (speechEnabled) {
      stopSpeaking();
    }
    setSpeechEnabled(!speechEnabled);
  };

  // Função para trocar voz
  const changeVoice = (voice) => {
    setSelectedVoice(voice);
    setShowVoiceSelector(false);
    // Testar a nova voz
    speakText("Voz alterada com sucesso!");
  };

  // Função para salvar configurações
  const saveSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('assistant-settings', JSON.stringify(updatedSettings));
    
    // Aplicar configurações imediatamente
    if (newSettings.voiceEnabled !== undefined) {
      setSpeechEnabled(newSettings.voiceEnabled);
    }
    
    // Aplicar tema
    if (newSettings.theme) {
      document.body.className = `theme-${newSettings.theme}`;
    }
  };

  const executeAction = async (action, parameters) => {
    try {
      console.log('Executando ação:', action, 'com parâmetros:', parameters);
      
      let commandResult = null;
      
      switch (action) {
        case 'open_app':
          console.log('Frontend: Executando open_app com:', { appName: parameters.appName, appPath: parameters.path });
          commandResult = await fetch('http://localhost:3001/api/commands/open-app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              appName: parameters.appName,
              appPath: parameters.path 
            })
          });
          console.log('Frontend: Resposta do open-app:', commandResult);
          break;
        case 'open_website':
          console.log('Frontend: Executando open_website com:', { url: parameters.url, siteName: parameters.siteName });
          commandResult = await fetch('http://localhost:3001/api/commands/open-website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              url: parameters.url,
              siteName: parameters.siteName
            })
          });
          console.log('Frontend: Resposta do open-website:', commandResult);
          break;
        case 'play_music':
          await musicService.play(parameters.filePath, parameters.url);
          break;
        case 'system_control':
          if (parameters.command) {
            await systemService.executeCommand(parameters.command);
          } else {
            console.log('Comando não especificado para system_control');
          }
          break;
        case 'volume_control':
          commandResult = await fetch('http://localhost:3001/api/commands/volume-control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: parameters.action || 'get',
              value: parameters.value
            })
          });
          break;
        case 'screenshot':
          // Usar screenshot avançado com parâmetros detectados
          const screenshotType = parameters.screenshotType || 'full';
          const windowTitle = parameters.windowTitle;
          
          console.log('Frontend screenshot params:', {
            screenshotType,
            windowTitle,
            parameters
          });
          
          commandResult = await fetch('http://localhost:3001/api/commands/screenshot-advanced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: screenshotType,
              window_title: windowTitle,
              exclude_assistant: true
            })
          });
          break;
        case 'list_windows':
          commandResult = await fetch('http://localhost:3001/api/commands/list-windows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          break;
        case 'close_window':
          commandResult = await fetch('http://localhost:3001/api/commands/close-window', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              windowTitle: parameters.windowTitle || parameters.title 
            })
          });
          break;
        case 'run_command':
          commandResult = await fetch('http://localhost:3001/api/commands/run-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              command: parameters.command 
            })
          });
          break;
        case 'focus_window':
          commandResult = await fetch('http://localhost:3001/api/commands/focus-window', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              window_title: parameters.windowTitle 
            })
          });
          break;
        case 'analyze_image':
          commandResult = await fetch('http://localhost:3001/api/ai/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              imagePath: parameters.imagePath,
              prompt: parameters.prompt || "Descreva o que você vê nesta imagem"
            })
          });
          break;
        case 'analyze_screen':
          commandResult = await fetch('http://localhost:3001/api/commands/analyze-screen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: parameters.prompt || "Descreva o que você vê nesta tela"
            })
          });
          break;
        default:
          console.log('Ação não implementada:', action);
      }

      // Processar resultado do comando se houver
      if (commandResult) {
        const result = await commandResult.json();
        if (result.success) {
          let commandMessage;
          
          // Processar resposta específica para análise de tela
          if (action === 'analyze_screen' && result.analysis) {
            commandMessage = {
              id: Date.now() + 1000,
              type: 'assistant',
              content: `📸 Análise da tela: ${result.analysis}`,
              timestamp: new Date()
            };
          }
          // Processar resposta específica para análise de imagem
          else if (action === 'analyze_image' && result.response) {
            commandMessage = {
              id: Date.now() + 1000,
              type: 'assistant',
              content: `🖼️ Análise da imagem: ${result.response}`,
              timestamp: new Date()
            };
          }
          // Processar resposta específica para listar janelas
          else if (action === 'list_windows' && result.windows) {
            if (result.windows.length === 0) {
              commandMessage = {
                id: Date.now() + 1000,
                type: 'assistant',
                content: 'Nenhuma janela ativa encontrada no momento.',
                timestamp: new Date()
              };
            } else {
              const windowsList = result.windows
                .filter(window => !window.isMinimized && window.title.trim())
                .map((window, index) => `${index + 1}. ${window.title}`)
                .join('\n');
              
              commandMessage = {
                id: Date.now() + 1000,
                type: 'assistant',
                content: `📋 **Janelas ativas encontradas:**\n\n${windowsList}\n\nVocê gostaria de fechar alguma dessas janelas? Ou posso ajudar a abri-la novamente se você não a precisou mais?`,
                timestamp: new Date()
              };
            }
          } else {
            // Resposta padrão para outros comandos
            commandMessage = {
              id: Date.now() + 1000,
              type: 'assistant',
              content: `✅ ${result.message}`,
              timestamp: new Date()
            };
          }
          
          setMessages(prev => [...prev, commandMessage]);
          
          // Falar a resposta se síntese de voz estiver ativada
          if (speechEnabled && commandMessage.content) {
            speakText(commandMessage.content);
          }
        } else {
          const errorMessage = {
            id: Date.now() + 1000,
            type: 'assistant',
            content: `❌ Erro: ${result.error}`,
            timestamp: new Date(),
            isError: true
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      const errorMessage = {
        id: Date.now() + 1000,
        type: 'assistant',
        content: `❌ Erro ao executar comando: ${error.message}`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleTextMessage = async (message) => {
    await handleVoiceCommand(message);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const minimizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.windowMinimize();
    }
  };

  const maximizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.windowMaximize();
      // Atualizar estado após um pequeno delay
      setTimeout(() => {
        checkWindowState();
      }, 100);
    }
  };

  const closeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.showMessageBox({
        type: 'question',
        buttons: ['Sim', 'Não'],
        defaultId: 0,
        message: 'Deseja realmente fechar o assistente?'
      }).then((result) => {
        if (result.response === 0) {
          window.electronAPI.windowClose();
        }
      });
    }
  };

  const toggleMinimize = () => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);
    
    console.log('Toggle minimize:', newMinimizedState);
    console.log('electronAPI available:', !!window.electronAPI);
    console.log('windowResize available:', !!window.electronAPI?.windowResize);
    
    // Redimensionar a janela do Electron
    if (window.electronAPI && window.electronAPI.windowResize) {
      if (newMinimizedState) {
        // Minimizado: altura bem reduzida
        console.log('Redimensionando para 400x80');
        window.electronAPI.windowResize(400, 200);
        // Tornar janela mais transparente quando minimizada
        if (window.electronAPI.windowOpacity) {
          window.electronAPI.windowOpacity(1.0);
        }
      } else {
        // Expandido: altura normal
        console.log('Redimensionando para 400x600');
        window.electronAPI.windowResize(400, 600);
        // Opacidade normal quando expandida
        if (window.electronAPI.windowOpacity) {
          window.electronAPI.windowOpacity(1.0);
        }
      }
    } else {
      console.log('electronAPI ou windowResize não disponível');
    }
  };

  return (
    <div className={`app ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="app-header window-drag-area">
        <div className="header-left">
          {/* Custom Menu Button */}
          <div className="app-menu">
            <button 
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Menu"
            >
              ☰
            </button>
            
            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="menu-dropdown"
                >
                  <button 
                    className={`menu-item ${currentView === 'chat' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('chat');
                      setShowMenu(false);
                    }}
                  >
                    💬 Chat
                  </button>
                  <button 
                    className={`menu-item ${currentView === 'system' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('system');
                      setShowMenu(false);
                    }}
                  >
                    ⚙️ Sistema
                  </button>
                  <button 
                    className={`menu-item ${currentView === 'music' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('music');
                      setShowMenu(false);
                    }}
                  >
                    🎵 Música
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="header-controls">
          <button 
            className={`control-btn ${speechEnabled ? 'active' : ''}`}
            onClick={toggleSpeech}
            title={speechEnabled ? "Desativar narração" : "Ativar narração"}
          >
            {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button 
            className="control-btn"
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
            title="Trocar voz"
          >
            🎤
          </button>
          <button 
            className="control-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Configurações"
          >
            <Settings size={16} />
          </button>
          <button 
            className="control-btn"
            onClick={toggleMinimize}
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            <Minimize2 size={16} />
          </button>
          <button 
            className="control-btn maximize-btn"
            onClick={maximizeWindow}
            title={isMaximized ? "Restaurar" : "Maximizar"}
          >
            {isMaximized ? <Square size={14} /> : <Square size={16} />}
          </button>
          <button 
            className="control-btn close-btn"
            onClick={closeWindow}
            title="Fechar"
          >
            <X size={16} />
          </button>
          
        </div>
      </div>

      {/* Seletor de Vozes */}
      {showVoiceSelector && (
        <div className="voice-selector-overlay" onClick={() => setShowVoiceSelector(false)}>
          <div className="voice-selector" onClick={(e) => e.stopPropagation()}>
            <h3>Escolher Voz</h3>
            <div className="voice-list">
              {availableVoices.map((voice, index) => (
                <div 
                  key={index}
                  className={`voice-option ${selectedVoice === voice ? 'selected' : ''}`}
                  onClick={() => changeVoice(voice)}
                >
                  <div className="voice-info">
                    <strong>{voice.name}</strong>
                    <span>{voice.lang}</span>
                  </div>
                  <button 
                    className="test-voice-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const utterance = new SpeechSynthesisUtterance("Teste de voz");
                      utterance.voice = voice;
                      utterance.rate = 0.85;
                      utterance.pitch = 1.1;
                      utterance.volume = 0.9;
                      window.speechSynthesis.speak(utterance);
                    }}
                  >
                    ▶️
                  </button>
                </div>
              ))}
            </div>
            <button 
              className="close-voice-selector"
              onClick={() => setShowVoiceSelector(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="app-content">
        <AnimatePresence mode="wait">
          {currentView === 'chat' && !isMinimized && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="chat-container"
            >
              <ChatInterface
                messages={messages}
                isProcessing={isProcessing}
                onSendMessage={handleTextMessage}
                onVoiceCommand={handleVoiceCommand}
                isListening={isListening}
                onToggleListening={toggleListening}
              />
            </motion.div>
          )}

          {/* Input sempre visível quando minimizado */}
          {isMinimized && currentView === 'chat' && (
            <div className="minimized-input-container">
              <ChatInterface
                messages={[]}
                isProcessing={isProcessing}
                onSendMessage={handleTextMessage}
                onVoiceCommand={handleVoiceCommand}
                isListening={isListening}
                onToggleListening={toggleListening}
                minimized={true}
              />
            </div>
          )}

          {currentView === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="system-container"
            >
              <SystemControls systemInfo={systemInfo} />
            </motion.div>
          )}

          {currentView === 'music' && (
            <motion.div
              key="music"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="music-container"
            >
              <MusicPlayer 
                musicStatus={musicStatus}
                onStatusChange={setMusicStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="settings-panel"
          >
            <SettingsPanel 
              onClose={() => setShowSettings(false)}
              settings={settings}
              onSaveSettings={saveSettings}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="voice-indicator"
          >
            <div className="pulse-ring"></div>
            <Mic size={24} />
            <span>Ouvindo...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
