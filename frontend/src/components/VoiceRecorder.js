import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const VoiceRecorder = ({ isListening, onToggleListening, onVoiceCommand }) => {
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Verificar suporte para Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';

      recognitionInstance.onstart = () => {
        console.log('Reconhecimento de voz iniciado');
      };

      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          setIsProcessing(true);
          onVoiceCommand(finalTranscript);
          setTimeout(() => {
            setIsProcessing(false);
            setTranscript('');
          }, 1000);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsProcessing(false);
      };

      recognitionInstance.onend = () => {
        console.log('Reconhecimento de voz finalizado');
        setIsProcessing(false);
      };

      setRecognition(recognitionInstance);
      setIsSupported(true);
    } else {
      console.warn('Web Speech API não suportada neste navegador');
      setIsSupported(false);
    }
  }, [onVoiceCommand]);

  useEffect(() => {
    if (isListening && recognition) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Erro ao iniciar reconhecimento:', error);
      }
    } else if (!isListening && recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Erro ao parar reconhecimento:', error);
      }
    }
  }, [isListening, recognition]);

  const handleToggleListening = () => {
    if (!isSupported) {
      alert('Reconhecimento de voz não é suportado neste navegador');
      return;
    }
    onToggleListening();
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    
    // Aqui você pode implementar controle de volume real
    // Por exemplo, usando Web Audio API
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!isSupported) {
    return (
      <div className="voice-recorder unsupported">
        <div className="unsupported-message">
          <MicOff size={24} />
          <span>Reconhecimento de voz não suportado</span>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-recorder">
      <div className="voice-controls">
        <motion.button
          className={`voice-btn ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={handleToggleListening}
          disabled={isProcessing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            scale: isListening ? [1, 1.1, 1] : 1,
            boxShadow: isListening 
              ? '0 0 20px rgba(99, 102, 241, 0.5)' 
              : '0 0 0px rgba(99, 102, 241, 0)'
          }}
          transition={{
            scale: { duration: 0.5, repeat: isListening ? Infinity : 0 },
            boxShadow: { duration: 0.3 }
          }}
        >
          {isProcessing ? (
            <div className="loading" />
          ) : isListening ? (
            <Mic size={24} />
          ) : (
            <MicOff size={24} />
          )}
        </motion.button>

        <div className="voice-status">
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="listening-indicator"
            >
              <div className="pulse-dot"></div>
              <span>Ouvindo...</span>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="processing-indicator"
            >
              <div className="loading" />
              <span>Processando...</span>
            </motion.div>
          )}

          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="transcript"
            >
              <span className="transcript-text">"{transcript}"</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="volume-controls">
        <button 
          className={`volume-btn ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Ativar som' : 'Silenciar'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        
        <div className="volume-slider">
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            disabled={isMuted}
            className="volume-range"
          />
          <span className="volume-value">{isMuted ? 0 : volume}%</span>
        </div>
      </div>

      <div className="voice-instructions">
        <p>Clique no microfone e fale seu comando</p>
        <div className="voice-examples">
          <span className="example">"Abra o navegador"</span>
          <span className="example">"Toque uma música"</span>
          <span className="example">"Pesquise sobre IA"</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
