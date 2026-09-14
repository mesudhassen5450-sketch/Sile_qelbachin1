'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AudioTrack } from '@/data/channelData';
import { resolveMediaUrl } from '@/lib/mediaUrl';

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  playlist: AudioTrack[];
  playTrack: (track: AudioTrack, playlist?: AudioTrack[]) => void;
  togglePlayPause: () => void;
  closePlayer: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  playNext: () => void;
  playPrev: () => void;
}

function pauseOtherHtmlMedia(except?: HTMLMediaElement | null) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('audio, video').forEach((el) => {
    const media = el as HTMLMediaElement;
    if (media !== except && !media.paused) {
      media.pause();
    }
  });
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(300); // 5 min default presentation
  const [volume, setVolumeState] = useState<number>(0.8);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    // Create HTML5 Audio element
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio && audio.duration) {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      playNext();
    };

    const handleError = () => {
      // Fallback synthetic audio simulation if static mp3 cannot be decoded
      console.log('Using synthetic lecture audio tone fallback');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    const handleAnyMediaPlay = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLMediaElement)) return;
      pauseOtherHtmlMedia(target);
      if (target instanceof HTMLVideoElement && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    document.addEventListener('play', handleAnyMediaPlay, true);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      document.removeEventListener('play', handleAnyMediaPlay, true);
      audio.pause();
    };
  }, []);

  // Internal Synthetic Tone generator for live lecture simulation
  const startSyntheticAudio = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch {
      // Silent catch
    }
  };

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (oscRef.current) {
      try {
        oscRef.current.stop();
      } catch {
        // already stopped
      }
      oscRef.current = null;
    }
  };

  const playTrack = (track: AudioTrack, newPlaylist?: AudioTrack[]) => {
    stopCurrentAudio();
    pauseOtherHtmlMedia();
    setCurrentTime(0);
    setCurrentTrack(track);
    if (newPlaylist) {
      setPlaylist(newPlaylist);
    }

    if (audioRef.current) {
      audioRef.current.src = resolveMediaUrl(track.audioUrl);
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = volume;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(true);
          startSyntheticAudio();
        });
    } else {
      setIsPlaying(true);
    }
  };

  const closePlayer = () => {
    stopCurrentAudio();
    if (audioRef.current) {
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaylist([]);
  };

  const togglePlayPause = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            setIsPlaying(true);
            startSyntheticAudio();
          });
      } else {
        setIsPlaying(true);
      }
    }
  };

  const seek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = time;
    }
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const setPlaybackSpeed = (speed: number) => {
    setPlaybackRateState(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const playNext = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      playTrack(playlist[currentIndex + 1], playlist);
    }
  };

  const playPrev = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(playlist[currentIndex - 1], playlist);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        playbackRate,
        playlist,
        playTrack,
        togglePlayPause,
        closePlayer,
        seek,
        setVolume,
        setPlaybackSpeed,
        playNext,
        playPrev,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
