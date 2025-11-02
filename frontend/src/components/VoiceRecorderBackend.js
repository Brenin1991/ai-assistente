import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import axios from 'axios';

const VoiceRecorderBackend = ({ isListening, onToggleListening, onVoiceCommand }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    onToggleListening();
    
    try {
      const response = await axios.post('http://localhost:3001/api/voice/start-recording', {
        duration: 5
      });
      
      if (response.data.success && response.data.text) {
        await onVoiceCommand(response.data.text);
      } else {
        await onVoiceCommand('Nenhum comando reconhecido. Tente falar mais claramente.');
      }
      
    } catch (error) {
      console.error('Erro no reconhecimento de voz:', error);
      await onVoiceCommand('Erro no reconhecimento. Tente novamente.');
    } finally {
      setIsProcessing(false);
      onToggleListening();
    }
  };

  return (
    <div className="voice-recorder-simple">
      <motion.button
        className={`voice-btn ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={handleStartRecording}
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
          <div className="spinner"></div>
        ) : (
          <Mic size={24} />
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
            <div className="spinner"></div>
            <span>Processando...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorderBackend;