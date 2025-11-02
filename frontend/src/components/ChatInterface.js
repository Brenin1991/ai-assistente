import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Clock, Copy, ThumbsUp, ThumbsDown, Mic } from 'lucide-react';

const ChatInterface = ({ messages, isProcessing, onSendMessage, onVoiceCommand, isListening, onToggleListening, minimized = false }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dragTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages, isProcessing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    onSendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleVoiceCommand = async () => {
    if (isProcessing || isVoiceProcessing) return;
    
    setIsVoiceProcessing(true);
    onToggleListening(); // Inicia listening
    
    try {
      console.log('🎤 Iniciando reconhecimento de voz...');
      
      const response = await fetch('http://localhost:3001/api/voice/start-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration: 5 })
      });
      
      const data = await response.json();
      console.log('Resposta do backend:', data);
      
      // Para o listening antes de processar
      onToggleListening();
      
      if (data.success && data.text) {
        console.log('✅ Texto reconhecido:', data.text);
        onVoiceCommand(data.text);
      } else {
        console.log('❌ Nenhum texto reconhecido');
        onVoiceCommand('Nenhum comando reconhecido. Tente falar mais claramente.');
      }
      
    } catch (error) {
      console.error('❌ Erro no reconhecimento de voz:', error);
      onToggleListening(); // Para o listening em caso de erro
      onVoiceCommand('Erro no reconhecimento. Tente novamente.');
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  // Funções para drag & drop de imagens
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Limpar timeout anterior
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    // Só ativa se tiver arquivos sendo arrastados
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Usar timeout para evitar piscar
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragOver(false);
    }, 100);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('Por favor, arraste apenas arquivos de imagem (PNG, JPG, GIF, etc.)');
      return;
    }

    if (imageFiles.length > 1) {
      alert('Por favor, arraste apenas uma imagem por vez');
      return;
    }

    const imageFile = imageFiles[0];
    await handleImageUpload(imageFile);
  };

  const handleImageUpload = async (file) => {
    setIsUploading(true);
    
    try {
      // Criar FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('image', file);

      // Enviar para o backend
      const response = await fetch('http://localhost:3001/api/ai/analyze-image-upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Preencher o input com o comando de análise
        setInputMessage(`analise a imagem: ${result.imagePath}`);
      } else {
        alert('Erro ao fazer upload da imagem: ' + result.error);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.type === 'user';
    const isError = message.isError;

    return (
      <div
        className={`message-bubble ${isUser ? 'user' : 'assistant'} ${isError ? 'error' : ''}`}
      >
        <div className="message-header">
          <div className="message-avatar">
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
          <div className="message-info">
            <span className="message-author">
              {isUser ? 'Você' : 'Assistente IA'}
            </span>
            <span className="message-time">
              <Clock size={12} />
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          <div className="message-actions">
            <button
              className="action-btn"
              onClick={() => copyToClipboard(message.content, message.id)}
              title="Copiar mensagem"
            >
              {copiedMessageId === message.id ? (
                <span className="copied">✓</span>
              ) : (
                <Copy size={14} />
              )}
            </button>
            {!isUser && !isError && (
              <>
                <button className="action-btn" title="Útil">
                  <ThumbsUp size={14} />
                </button>
                <button className="action-btn" title="Não útil">
                  <ThumbsDown size={14} />
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="message-content">
          {!(message.action && message.action !== 'general_response') && (
            <p>{message.content}</p>
          )}
          
          {message.action && message.action !== 'general_response' && (
            <div className="message-action">
              <span className="action-label">Ação executada:</span>
              <span className="action-value">{message.action}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`chat-interface ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!minimized && (
        <div className="chat-messages">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isProcessing && (
            <div className="processing-message">
              <div className="message-avatar">
                <Bot size={16} />
              </div>
              <div className="processing-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>Assistente está pensando...</span>
              </div>
            </div>
          )}
          
          {isDragOver && (
            <div className="drag-overlay">
              <div className="drag-indicator">
                <div className="drag-icon">📁</div>
                <div className="drag-text">
                  <h3>Solte a imagem aqui</h3>
                  <p>Arraste uma imagem para analisar</p>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isUploading ? "Fazendo upload da imagem..." : "Digite sua mensagem..."}
            className="chat-input"
            rows="1"
            disabled={isProcessing}
          />
          <div className="input-buttons">
            <button
              type="button"
              onClick={handleVoiceCommand}
              disabled={isProcessing || isVoiceProcessing}
              className={`voice-btn ${isListening ? 'listening' : ''} ${isVoiceProcessing ? 'processing' : ''}`}
            >
              {isVoiceProcessing ? (
                <div className="spinner"></div>
              ) : (
                <Mic size={22} />
              )}
            </button>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isProcessing}
              className="send-btn"
            >
              <Send size={22} />
            </button>
          </div>
        </div>
        
        <div className="input-hints">
          {isVoiceProcessing ? (
            <span>🎤 Processando áudio...</span>
          ) : isListening ? (
            <span>🎤 Ouvindo... Fale agora!</span>
          ) : (
            <span>Pressione Enter para enviar, Shift+Enter para nova linha</span>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
