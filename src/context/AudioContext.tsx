'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AudioTrack } from '@/data/channelData';

const CONTINUE_KEY = 'sile-continue-listening';

interface ContinueState {
  track: AudioTrack;
  currentTime: number;
  playlist?: AudioTrack[];
}

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  playlist: AudioTrack[];
  continueTrack: ContinueState | null;
  playTrack: (track: AudioTrack, playlist?: AudioTrack[]) => void;
  resumeContinueListening: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  playNext: () => void;
  playPrev: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

function loadContinue(): ContinueState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONTINUE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ContinueState;
  } catch {
    return null;
  }
}

function saveContinue(state: ContinueState | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!state) localStorage.removeItem(CONTINUE_KEY);
    else localStorage.setItem(CONTINUE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(300);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [continueTrack, setContinueTrack] = useState<ContinueState | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<globalThis.AudioContext | null>(null);
  const playlistRef = useRef<AudioTrack[]>([]);
  const trackRef = useRef<AudioTrack | null>(null);

  useEffect(() => {
    setContinueTrack(loadContinue());
  }, []);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    trackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio && audio.duration) {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
        const track = trackRef.current;
        if (track && audio.currentTime > 3) {
          const state: ContinueState = {
            track,
            currentTime: audio.currentTime,
            playlist: playlistRef.current,
          };
          saveContinue(state);
          setContinueTrack(state);
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      const list = playlistRef.current;
      const track = trackRef.current;
      if (!track || list.length === 0) return;
      const currentIndex = list.findIndex((t) => t.id === track.id);
      if (currentIndex !== -1 && currentIndex < list.length - 1) {
        const next = list[currentIndex + 1];
        setCurrentTrack(next);
        audio.src = next.audioUrl;
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(true));
      }
    };

    const handleError = () => {
      console.log('Using synthetic lecture audio tone fallback');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  const startSyntheticAudio = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch {
      // Silent catch
    }
  };

  const playTrack = (track: AudioTrack, newPlaylist?: AudioTrack[], startAt = 0) => {
    setCurrentTrack(track);
    if (newPlaylist) {
      setPlaylist(newPlaylist);
    }

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = volume;
      const onMeta = () => {
        if (startAt > 0 && audioRef.current) {
          audioRef.current.currentTime = startAt;
        }
        audioRef.current?.removeEventListener('loadedmetadata', onMeta);
      };
      if (startAt > 0) {
        audioRef.current.addEventListener('loadedmetadata', onMeta);
      }
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

  const resumeContinueListening = () => {
    const saved = continueTrack || loadContinue();
    if (!saved) return;
    playTrack(saved.track, saved.playlist, saved.currentTime);
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
        continueTrack,
        playTrack,
        resumeContinueListening,
        togglePlayPause,
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
