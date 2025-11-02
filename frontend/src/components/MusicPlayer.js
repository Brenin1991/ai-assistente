import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Music,
  FolderOpen,
  List,
  Shuffle,
  Repeat
} from 'lucide-react';

const MusicPlayer = ({ musicStatus, onStatusChange }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    setIsPlaying(musicStatus.isPlaying);
  }, [musicStatus]);

  const handlePlay = async () => {
    if (playlist.length === 0) {
      alert('Nenhuma música carregada. Selecione uma pasta primeiro.');
      return;
    }

    try {
      setIsLoading(true);
      const currentTrack = playlist[currentTrackIndex];
      
      if (audioRef.current) {
        audioRef.current.src = currentTrack.path;
        await audioRef.current.play();
        setIsPlaying(true);
        onStatusChange({
          isPlaying: true,
          currentTrack: currentTrack.name
        });
      }
    } catch (error) {
      console.error('Erro ao tocar música:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      onStatusChange({
        isPlaying: false,
        currentTrack: musicStatus.currentTrack
      });
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      onStatusChange({
        isPlaying: false,
        currentTrack: null
      });
    }
  };

  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
    if (isPlaying) {
      handlePlay();
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    if (isPlaying) {
      handlePlay();
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const loadMusicFolder = async () => {
    if (!selectedFolder) {
      alert('Selecione uma pasta primeiro');
      return;
    }

    try {
      setIsLoading(true);
      // Aqui você implementaria a chamada para a API do backend
      // const response = await musicService.listMusic(selectedFolder);
      // setPlaylist(response.files);
      
      // Simulação de playlist
      const mockPlaylist = [
        { name: 'Música 1.mp3', path: '/path/to/music1.mp3' },
        { name: 'Música 2.mp3', path: '/path/to/music2.mp3' },
        { name: 'Música 3.mp3', path: '/path/to/music3.mp3' }
      ];
      setPlaylist(mockPlaylist);
    } catch (error) {
      console.error('Erro ao carregar pasta de música:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFolder = () => {
    // Aqui você implementaria a seleção de pasta usando Electron
    const mockFolder = '/Users/username/Music';
    setSelectedFolder(mockFolder);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-player">
      <div className="player-header">
        <h2>Player de Música</h2>
        <div className="player-controls-header">
          <button 
            className="folder-btn"
            onClick={selectFolder}
            title="Selecionar pasta de música"
          >
            <FolderOpen size={16} />
            Selecionar Pasta
          </button>
          <button 
            className={`playlist-btn ${showPlaylist ? 'active' : ''}`}
            onClick={() => setShowPlaylist(!showPlaylist)}
            title="Mostrar playlist"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Controles de Pasta */}
      {selectedFolder && (
        <div className="folder-controls">
          <div className="selected-folder">
            <span className="folder-path">{selectedFolder}</span>
            <button 
              className="load-btn"
              onClick={loadMusicFolder}
              disabled={isLoading}
            >
              {isLoading ? 'Carregando...' : 'Carregar Músicas'}
            </button>
          </div>
        </div>
      )}

      {/* Player Principal */}
      <div className="main-player">
        <div className="track-info">
          <div className="track-cover">
            <Music size={40} />
          </div>
          <div className="track-details">
            <h3 className="track-title">
              {playlist[currentTrackIndex]?.name || 'Nenhuma música selecionada'}
            </h3>
            <p className="track-artist">
              {playlist.length > 0 ? `${currentTrackIndex + 1} de ${playlist.length}` : '0 músicas'}
            </p>
          </div>
        </div>

        <div className="player-controls">
          <button 
            className="control-btn"
            onClick={handlePrevious}
            disabled={playlist.length === 0}
            title="Música anterior"
          >
            <SkipBack size={20} />
          </button>
          
          <button 
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={playlist.length === 0 || isLoading}
          >
            {isLoading ? (
              <div className="loading" />
            ) : isPlaying ? (
              <Pause size={24} />
            ) : (
              <Play size={24} />
            )}
          </button>
          
          <button 
            className="control-btn"
            onClick={handleNext}
            disabled={playlist.length === 0}
            title="Próxima música"
          >
            <SkipForward size={20} />
          </button>
          
          <button 
            className="control-btn"
            onClick={handleStop}
            disabled={!isPlaying}
            title="Parar"
          >
            <Square size={20} />
          </button>
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
      </div>

      {/* Playlist */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="playlist-section"
          >
            <h3>Playlist</h3>
            <div className="playlist">
              {playlist.length === 0 ? (
                <div className="empty-playlist">
                  <Music size={32} />
                  <p>Nenhuma música carregada</p>
                  <p>Selecione uma pasta para começar</p>
                </div>
              ) : (
                playlist.map((track, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ backgroundColor: 'var(--surface-light)' }}
                    className={`playlist-item ${index === currentTrackIndex ? 'current' : ''}`}
                    onClick={() => {
                      setCurrentTrackIndex(index);
                      if (isPlaying) handlePlay();
                    }}
                  >
                    <div className="track-number">
                      {index + 1}
                    </div>
                    <div className="track-info">
                      <span className="track-name">{track.name}</span>
                    </div>
                    {index === currentTrackIndex && isPlaying && (
                      <div className="playing-indicator">
                        <div className="equalizer">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Element (hidden) */}
      <audio
        ref={audioRef}
        onEnded={handleNext}
        onTimeUpdate={() => {
          // Atualizar progresso da música se necessário
        }}
      />
    </div>
  );
};

export default MusicPlayer;
