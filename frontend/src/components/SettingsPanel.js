import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Settings, 
  Mic, 
  Volume2, 
  Monitor, 
  Palette, 
  Database,
  Shield,
  Bell,
  Globe,
  Keyboard,
  Mouse
} from 'lucide-react';

const SettingsPanel = ({ onClose, settings: propSettings, onSaveSettings }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // Configurações gerais
    language: 'pt-BR',
    theme: 'dark',
    autoStart: false,
    minimizeToTray: true,
    
    // Configurações de voz
    voiceEnabled: true,
    voiceLanguage: 'pt-BR',
    voiceSpeed: 0.85,
    voiceVolume: 0.9,
    
    // Configurações de áudio
    masterVolume: 50,
    notificationSound: true,
    musicVolume: 70,
    
    // Configurações de sistema
    autoUpdate: true,
    logLevel: 'info',
    maxLogSize: 100,
    
    // Configurações de privacidade
    dataCollection: false,
    analytics: false,
    crashReports: true
  });

  useEffect(() => {
    // Usar configurações passadas como props
    if (propSettings) {
      setSettings(prev => ({ ...prev, ...propSettings }));
    } else {
      // Carregar configurações salvas como fallback
      const savedSettings = localStorage.getItem('assistant-settings');
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    }
  }, [propSettings]);

  const saveSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('assistant-settings', JSON.stringify(updatedSettings));
  };

  const handleSettingChange = (key, value) => {
    const newSetting = { [key]: value };
    setSettings(prev => ({ ...prev, ...newSetting }));
    
    // Usar função externa se disponível
    if (onSaveSettings) {
      onSaveSettings(newSetting);
    } else {
      // Fallback para localStorage
      const updatedSettings = { ...settings, ...newSetting };
      localStorage.setItem('assistant-settings', JSON.stringify(updatedSettings));
    }
  };

  const SettingItem = ({ label, description, children, icon: Icon }) => (
    <div className="setting-item">
      <div className="setting-header">
        {Icon && <Icon size={16} />}
        <div className="setting-info">
          <label className="setting-label">{label}</label>
          {description && <p className="setting-description">{description}</p>}
        </div>
      </div>
      <div className="setting-control">
        {children}
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      className={`tab-button ${isActive ? 'active' : ''}`}
      onClick={() => onClick(id)}
    >
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );

  const renderGeneralSettings = () => (
    <div className="settings-content">
      <SettingItem
        label="Idioma"
        description="Selecione o idioma da interface"
        icon={Globe}
      >
        <select
          value={settings.language}
          onChange={(e) => handleSettingChange('language', e.target.value)}
          className="setting-select"
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es-ES">Español</option>
        </select>
      </SettingItem>

      <SettingItem
        label="Tema"
        description="Escolha entre tema claro ou escuro"
        icon={Palette}
      >
        <div className="theme-options">
          <label className="theme-option">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={settings.theme === 'light'}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            />
            <span>Claro</span>
          </label>
          <label className="theme-option">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={settings.theme === 'dark'}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            />
            <span>Escuro</span>
          </label>
        </div>
      </SettingItem>

      <SettingItem
        label="Iniciar com o Windows"
        description="Iniciar o assistente automaticamente quando o Windows iniciar"
        icon={Monitor}
      >
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.autoStart}
            onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </SettingItem>

      <SettingItem
        label="Minimizar para bandeja"
        description="Minimizar para a bandeja do sistema em vez de fechar"
        icon={Mouse}
      >
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.minimizeToTray}
            onChange={(e) => handleSettingChange('minimizeToTray', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </SettingItem>
    </div>
  );

  const renderVoiceSettings = () => (
    <div className="settings-content">
      <SettingItem
        label="Reconhecimento de voz"
        description="Ativar ou desativar o reconhecimento de voz"
        icon={Mic}
      >
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.voiceEnabled}
            onChange={(e) => handleSettingChange('voiceEnabled', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </SettingItem>

      <SettingItem
        label="Idioma da voz"
        description="Idioma para reconhecimento de voz"
        icon={Globe}
      >
        <select
          value={settings.voiceLanguage}
          onChange={(e) => handleSettingChange('voiceLanguage', e.target.value)}
          className="setting-select"
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es-ES">Español</option>
        </select>
      </SettingItem>

      <SettingItem
        label="Velocidade da voz"
        description="Velocidade de reprodução da voz"
        icon={Volume2}
      >
        <div className="slider-control">
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.voiceSpeed}
            onChange={(e) => handleSettingChange('voiceSpeed', parseFloat(e.target.value))}
            className="range-slider"
          />
          <span className="slider-value">{settings.voiceSpeed}x</span>
        </div>
      </SettingItem>

      <SettingItem
        label="Volume da voz"
        description="Volume da síntese de voz"
        icon={Volume2}
      >
        <div className="slider-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.voiceVolume}
            onChange={(e) => handleSettingChange('voiceVolume', parseFloat(e.target.value))}
            className="range-slider"
          />
          <span className="slider-value">{Math.round(settings.voiceVolume * 100)}%</span>
        </div>
      </SettingItem>
    </div>
  );

  const renderAudioSettings = () => (
    <div className="settings-content">
      <SettingItem
        label="Volume principal"
        description="Volume geral do sistema"
        icon={Volume2}
      >
        <div className="slider-control">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.masterVolume}
            onChange={(e) => handleSettingChange('masterVolume', parseInt(e.target.value))}
            className="range-slider"
          />
          <span className="slider-value">{settings.masterVolume}%</span>
        </div>
      </SettingItem>

      <SettingItem
        label="Som de notificação"
        description="Reproduzir sons para notificações"
        icon={Bell}
      >
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.notificationSound}
            onChange={(e) => handleSettingChange('notificationSound', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </SettingItem>

      <SettingItem
        label="Volume da música"
        description="Volume específico para reprodução de música"
        icon={Music}
      >
        <div className="slider-control">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.musicVolume}
            onChange={(e) => handleSettingChange('musicVolume', parseInt(e.target.value))}
            className="range-slider"
          />
          <span className="slider-value">{settings.musicVolume}%</span>
        </div>
      </SettingItem>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="settings-content">
      <SettingItem
        label="Atualização automática"
        description="Verificar e instalar atualizações automaticamente"
        icon={Database}
      >
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.autoUpdate}
            onChange={(e) => handleSettingChange('autoUpdate', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </SettingItem>

      <SettingItem
        label="Nível de log"
        description="Nível de detalhamento dos logs do sistema"
        icon={Monitor}
      >
        <select
          value={settings.logLevel}
          onChange={(e) => handleSettingChange('logLevel', e.target.value)}
          className="setting-select"
        >
          <option value="error">Apenas erros</option>
          <option value="warn">Avisos e erros</option>
          <option value="info">Informações gerais</option>
          <option value="debug">Tudo (debug)</option>
        </select>
      </SettingItem>

      <SettingItem
        label="Tamanho máximo do log"
        description="Tamanho máximo do arquivo de log em MB"
        icon={Database}
      >
        <div className="slider-control">
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={settings.maxLogSize}
            onChange={(e) => handleSettingChange('maxLogSize', parseInt(e.target.value))}
            className="range-slider"
          />
          <span className="slider-value">{settings.maxLogSize} MB</span>
        </div>
      </SettingItem>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="settings-content">
      <SettingItem
        label="Coleta de dados"
        description="Permitir coleta de dados de uso para melhorar o produto"
        icon={Shield}
      >
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.dataCollection}
            onChange={(e) => handleSettingChange('dataCollection', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </SettingItem>

      <SettingItem
        label="Analytics"
        description="Enviar dados de uso para análise"
        icon={Database}
      >
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.analytics}
            onChange={(e) => handleSettingChange('analytics', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </SettingItem>

      <SettingItem
        label="Relatórios de crash"
        description="Enviar relatórios automáticos quando o aplicativo falhar"
        icon={Shield}
      >
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.crashReports}
            onChange={(e) => handleSettingChange('crashReports', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </SettingItem>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'voice':
        return renderVoiceSettings();
      case 'audio':
        return renderAudioSettings();
      case 'system':
        return renderSystemSettings();
      case 'privacy':
        return renderPrivacySettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="settings-panel"
    >
      <div className="settings-header">
        <div className="settings-title">
          <Settings size={20} />
          <h2>Configurações</h2>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="settings-body">
        <div className="settings-tabs">
          <TabButton
            id="general"
            label="Geral"
            icon={Settings}
            isActive={activeTab === 'general'}
            onClick={setActiveTab}
          />
          <TabButton
            id="voice"
            label="Voz"
            icon={Mic}
            isActive={activeTab === 'voice'}
            onClick={setActiveTab}
          />
          <TabButton
            id="audio"
            label="Áudio"
            icon={Volume2}
            isActive={activeTab === 'audio'}
            onClick={setActiveTab}
          />
          <TabButton
            id="system"
            label="Sistema"
            icon={Monitor}
            isActive={activeTab === 'system'}
            onClick={setActiveTab}
          />
          <TabButton
            id="privacy"
            label="Privacidade"
            icon={Shield}
            isActive={activeTab === 'privacy'}
            onClick={setActiveTab}
          />
        </div>

        <div className="settings-content-wrapper">
          {renderContent()}
        </div>
      </div>

      <div className="settings-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Fechar
        </button>
        <button className="btn btn-primary" onClick={() => {
          // Salvar e aplicar configurações
          onClose();
        }}>
          Salvar
        </button>
      </div>
    </motion.div>
  );
};

export default SettingsPanel;
