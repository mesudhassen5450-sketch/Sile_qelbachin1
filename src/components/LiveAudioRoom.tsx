'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import TranslatedText from '@/components/TranslatedText';
import {
  Mic,
  MicOff,
  Hand,
  Volume2,
  VolumeX,
  Users,
  Radio,
  Sparkles,
  CheckCircle,
  XCircle,
  PhoneOff,
  UserCheck,
  Award,
  CircleDot,
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'speaker' | 'listener';
  isMuted: boolean;
  isSpeaking: boolean;
  handRaised: boolean;
  avatar: string;
}

export default function LiveAudioRoom() {
  const { language, t } = useLanguage();

  // User State
  const [userRole, setUserRole] = useState<'host' | 'listener'>('host'); // Toggle for previewing Host or Listener experience
  const [isMicOn, setIsMicOn] = useState(true);
  const [isMutedAll, setIsMutedAll] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isRoomActive, setIsRoomActive] = useState(true);

  // Simulated Live Participants
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'host-1',
      name: 'እስታዝ አቡ ዐብደላህ (Host/Ustadh)',
      role: 'host',
      isMuted: false,
      isSpeaking: true,
      handRaised: false,
      avatar: '☪',
    },
    {
      id: 'student-1',
      name: 'ቢላል አሕመድ',
      role: 'listener',
      isMuted: true,
      isSpeaking: false,
      handRaised: true,
      avatar: '👤',
    },
    {
      id: 'student-2',
      name: 'ፋጢማ ሙሐመድ',
      role: 'listener',
      isMuted: true,
      isSpeaking: false,
      handRaised: true,
      avatar: '🧕',
    },
    {
      id: 'student-3',
      name: 'ዑመር ዐሊ',
      role: 'listener',
      isMuted: true,
      isSpeaking: false,
      handRaised: false,
      avatar: '🧔',
    },
  ]);

  // Audio Context & Real WebRTC Microphone Stream Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Live Listener Counter Animation
  const [listenerCount, setListenerCount] = useState(148);

  useEffect(() => {
    const interval = setInterval(() => {
      setListenerCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // WebRTC Microphone Request Handler
  const toggleMicrophone = async () => {
    if (!isMicOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setIsMicOn(true);
      } catch (err) {
        console.warn('Microphone access fallback to simulated stream:', err);
        setIsMicOn(true);
      }
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsMicOn(false);
    }
  };

  // Hand-raising request handler for listener
  const toggleRaiseHand = () => {
    setHandRaised((prev) => !prev);
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === 'user-current' ? { ...p, handRaised: !p.handRaised } : p
      )
    );
  };

  // Host Action: Grant Microphone to Student
  const grantMic = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? { ...p, role: 'speaker', isMuted: false, handRaised: false }
          : p
      )
    );
  };

  // Host Action: Revoke Microphone
  const revokeMic = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? { ...p, role: 'listener', isMuted: true, isSpeaking: false }
          : p
      )
    );
  };

  const handRequests = participants.filter((p) => p.handRaised);
  const speakers = participants.filter((p) => p.role === 'host' || p.role === 'speaker');

  if (!isRoomActive) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 text-white rounded-3xl p-8 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-red-950/60 text-red-500 border border-red-800 flex items-center justify-center mx-auto">
          <PhoneOff className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold">
          <TranslatedText text="የቀጥታ ስርጭቱ ተጠናቋል (Live Session Ended)" targetLang={language} />
        </h3>
        <p className="text-sm text-neutral-400">
          <TranslatedText text="ስለተሳተፉ እናመሰግናለን። የሚቀጥለውን መርሃ-ግብር በቴሌግራም ቻናላችን ይከታተሉ።" targetLang={language} />
        </p>
        <button
          onClick={() => setIsRoomActive(true)}
          className="btn-red px-6 py-2.5 rounded-xl font-bold text-xs shadow-md"
        >
          <TranslatedText text="ስርጭቱን እንደገና ጀምር (Restart Live Room)" targetLang={language} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white rounded-3xl border border-red-900/30 shadow-2xl overflow-hidden relative">
      
      {/* Top Header Bar */}
      <div className="p-4 sm:p-6 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 bg-neutral-900/50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-600 text-white text-2xs uppercase font-extrabold px-2.5 py-0.5 rounded-md tracking-wider">
                LIVE AUDIO CHAT
              </span>
              <span className="text-xs text-neutral-400 font-mono">Telegram / TikTok Style</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-1">
              <TranslatedText text="የሳምንቱ የቀጥታ የቁርኣንና ሐዲሥ መርሃግብር" targetLang={language} />
            </h2>
          </div>
        </div>

        {/* Listeners Count & Role Switcher */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-neutral-800/80 border border-neutral-700 px-3.5 py-1.5 rounded-full text-xs font-bold text-neutral-200">
            <Users className="w-4 h-4 text-red-500" />
            <span>{listenerCount} <TranslatedText text="ተሳታፊዎች (Listeners)" targetLang={language} /></span>
          </div>

          {/* Role Preview Switcher (For Demo Purposes) */}
          <button
            onClick={() => setUserRole((r) => (r === 'host' ? 'listener' : 'host'))}
            className="px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-2xs font-mono text-neutral-300 border border-neutral-700 transition"
            title="Switch User Role View"
          >
            Role: <strong className="text-red-400 uppercase">{userRole}</strong>
          </button>
        </div>
      </div>

      {/* Main Live Audio Stage */}
      <div className="p-6 sm:p-10 space-y-8">
        
        {/* Active Speakers Stage Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
            <Mic className="w-4 h-4 text-red-500" />
            <span><TranslatedText text="ተናጋሪዎች (Active Speakers on Stage)" targetLang={language} /></span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {speakers.map((speaker) => (
              <div
                key={speaker.id}
                className={`relative portfolio-card p-5 flex flex-col items-center justify-center text-center space-y-3 transition-all duration-300 ${
                  speaker.isSpeaking
                    ? 'ring-4 ring-red-600/60 bg-red-950/20 shadow-lg shadow-red-950/40 scale-105'
                    : 'bg-neutral-900/60 border-neutral-800'
                }`}
              >
                {/* Speaker Avatar & Wave Pulse Indicator */}
                <div className="relative">
                  {speaker.isSpeaking && (
                    <span className="absolute -inset-2 rounded-full bg-red-600/30 animate-ping" />
                  )}
                  <div className="relative w-16 h-16 rounded-full bg-neutral-800 border-2 border-red-500/50 flex items-center justify-center text-2xl shadow-inner">
                    {speaker.avatar}
                  </div>
                  {speaker.role === 'host' && (
                    <span className="absolute -bottom-1 -right-1 bg-red-600 text-white p-1 rounded-full text-2xs shadow-md" title="Host">
                      <Award className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-sm text-white truncate max-w-[120px]">
                    {speaker.name}
                  </p>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {speaker.role === 'host' ? 'Host (Ustadh)' : 'Speaker (Student)'}
                  </span>
                </div>

                {/* Revoke Mic Button (Visible to Host for Speakers) */}
                {userRole === 'host' && speaker.role === 'speaker' && (
                  <button
                    onClick={() => revokeMic(speaker.id)}
                    className="text-2xs font-bold text-red-400 hover:text-red-300 underline pt-1"
                  >
                    <TranslatedText text="ድምፅ አቁም (Mute Student)" targetLang={language} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hand Requests Queue Section (Visible to Host) */}
        {userRole === 'host' && (
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-neutral-200">
                <Hand className="w-4 h-4 text-amber-500" />
                <span><TranslatedText text="የጥያቄና ድምፅ ጥያቄዎች (Hands Raised Queue)" targetLang={language} /></span>
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
                  {handRequests.length}
                </span>
              </div>
            </div>

            {handRequests.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">
                <TranslatedText text="በአሁኑ ሰዓት የተላከ የድምፅ ጥያቄ የለም።" targetLang={language} />
              </p>
            ) : (
              <div className="space-y-2">
                {handRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/60 border border-neutral-700 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{req.avatar}</span>
                      <span className="font-bold text-white">{req.name}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => grantMic(req.id)}
                        className="btn-red px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center space-x-1 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span><TranslatedText text="ድምፅ ፈቅድ (Grant Mic)" targetLang={language} /></span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Floating Control Bar */}
      <div className="p-4 sm:p-6 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left Action Buttons */}
        <div className="flex items-center space-x-3">
          {userRole === 'listener' ? (
            <button
              onClick={toggleRaiseHand}
              className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center space-x-2 transition shadow-md ${
                handRaised
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
              }`}
            >
              <Hand className="w-5 h-5 text-amber-400" />
              <span>
                {handRaised ? (
                  <TranslatedText text="ጥያቄ ተልኳል (Hand Raised)" targetLang={language} />
                ) : (
                  <TranslatedText text="ጥያቄ አለኝ (Raise Hand)" targetLang={language} />
                )}
              </span>
            </button>
          ) : (
            <button
              onClick={toggleMicrophone}
              className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center space-x-2 transition shadow-md ${
                isMicOn ? 'btn-red' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              <span>
                {isMicOn ? (
                  <TranslatedText text="ማይክራፎን ክፍት ነው (Mic Active)" targetLang={language} />
                ) : (
                  <TranslatedText text="ማይክራፎን ዝጋ (Mute Mic)" targetLang={language} />
                )}
              </span>
            </button>
          )}
        </div>

        {/* Center Volume Slider */}
        <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-2xl">
          <button onClick={() => setVolume((v) => (v === 0 ? 0.85 : 0))}>
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-neutral-300" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-24 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
        </div>

        {/* Right End Session Button */}
        {userRole === 'host' && (
          <button
            onClick={() => setIsRoomActive(false)}
            className="px-5 py-3 rounded-2xl font-bold text-sm bg-neutral-900 hover:bg-red-950 text-red-400 hover:text-white border border-red-900/60 transition flex items-center space-x-2"
          >
            <PhoneOff className="w-4 h-4" />
            <span><TranslatedText text="ስርጭቱን አቁም (End Live Room)" targetLang={language} /></span>
          </button>
        )}

      </div>
    </div>
  );
}
