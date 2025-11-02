import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Wifi, 
  Battery, 
  Volume2, 
  VolumeX,
  Power,
  RefreshCw,
  Terminal,
  FolderOpen,
  Settings
} from 'lucide-react';

const SystemControls = ({ systemInfo }) => {
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [systemStats, setSystemStats] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0
  });
  const [quickActions, setQuickActions] = useState([]);

  useEffect(() => {
    if (systemInfo) {
      // Calcular estatísticas do sistema
      const memoryUsage = ((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory) * 100;
      setSystemStats(prev => ({
        ...prev,
        memoryUsage: Math.round(memoryUsage)
      }));
    }
  }, [systemInfo]);

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    // Aqui você implementaria o controle real de volume
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const executeQuickAction = async (action) => {
    try {
      // Implementar ações rápidas
      console.log('Executando ação:', action);
    } catch (error) {
      console.error('Erro ao executar ação:', error);
    }
  };

  const SystemInfoCard = ({ title, icon: Icon, value, subtitle, color = 'blue' }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`system-card ${color}`}
    >
      <div className="card-header">
        <Icon size={20} />
        <h3>{title}</h3>
      </div>
      <div className="card-content">
        <div className="value">{value}</div>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>
    </motion.div>
  );

  const QuickActionButton = ({ action, icon: Icon, label, color = 'primary' }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`quick-action-btn ${color}`}
      onClick={() => executeQuickAction(action)}
    >
      <Icon size={20} />
      <span>{label}</span>
    </motion.button>
  );

  return (
    <div className="system-controls">
      <div className="controls-header">
        <h2>Controles do Sistema</h2>
        <button className="refresh-btn" title="Atualizar informações">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Informações do Sistema */}
      <div className="system-info-grid">
        <SystemInfoCard
          title="Sistema Operacional"
          icon={Monitor}
          value={systemInfo?.platform || 'Desconhecido'}
          subtitle={systemInfo?.release || ''}
          color="blue"
        />
        
        <SystemInfoCard
          title="Processador"
          icon={Cpu}
          value={`${systemInfo?.cpus || 0} cores`}
          subtitle="CPU"
          color="green"
        />
        
        <SystemInfoCard
          title="Memória"
          icon={MemoryStick}
          value={`${systemStats.memoryUsage}%`}
          subtitle={`${Math.round((systemInfo?.totalMemory || 0) / 1024 / 1024 / 1024)} GB total`}
          color="purple"
        />
        
        <SystemInfoCard
          title="Tempo de Atividade"
          icon={Power}
          value={`${Math.round((systemInfo?.uptime || 0) / 3600)}h`}
          subtitle="Uptime"
          color="orange"
        />
      </div>

      {/* Controle de Volume */}
      <div className="volume-control-section">
        <h3>Controle de Volume</h3>
        <div className="volume-controls">
          <button 
            className={`volume-btn ${isMuted ? 'muted' : ''}`}
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <div className="volume-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              disabled={isMuted}
              className="volume-slider"
            />
            <span className="volume-value">{isMuted ? 0 : volume}%</span>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="quick-actions-section">
        <h3>Ações Rápidas</h3>
        <div className="quick-actions-grid">
          <QuickActionButton
            action="open_terminal"
            icon={Terminal}
            label="Terminal"
            color="primary"
          />
          
          <QuickActionButton
            action="open_explorer"
            icon={FolderOpen}
            label="Explorador"
            color="secondary"
          />
          
          <QuickActionButton
            action="open_settings"
            icon={Settings}
            label="Configurações"
            color="success"
          />
          
          <QuickActionButton
            action="restart"
            icon={RefreshCw}
            label="Reiniciar"
            color="warning"
          />
        </div>
      </div>

      {/* Aplicativos Frequentes */}
      <div className="frequent-apps-section">
        <h3>Aplicativos Frequentes</h3>
        <div className="apps-grid">
          {[
            { name: 'Navegador', icon: '🌐', action: 'open_browser' },
            { name: 'Editor de Texto', icon: '📝', action: 'open_text_editor' },
            { name: 'Calculadora', icon: '🧮', action: 'open_calculator' },
            { name: 'Spotify', icon: '🎵', action: 'open_spotify' },
            { name: 'Discord', icon: '💬', action: 'open_discord' },
            { name: 'Steam', icon: '🎮', action: 'open_steam' }
          ].map((app, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="app-button"
              onClick={() => executeQuickAction(app.action)}
            >
              <span className="app-icon">{app.icon}</span>
              <span className="app-name">{app.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Comandos do Sistema */}
      <div className="system-commands-section">
        <h3>Comandos do Sistema</h3>
        <div className="commands-list">
          {[
            { command: 'dir', description: 'Listar arquivos do diretório atual' },
            { command: 'ipconfig', description: 'Mostrar configurações de rede' },
            { command: 'systeminfo', description: 'Informações detalhadas do sistema' },
            { command: 'tasklist', description: 'Listar processos em execução' }
          ].map((cmd, index) => (
            <motion.div
              key={index}
              whileHover={{ x: 5 }}
              className="command-item"
            >
              <div className="command-info">
                <code className="command-name">{cmd.command}</code>
                <span className="command-description">{cmd.description}</span>
              </div>
              <button 
                className="execute-btn"
                onClick={() => executeQuickAction(`run_${cmd.command}`)}
              >
                Executar
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemControls;
