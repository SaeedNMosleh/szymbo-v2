"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { AudioPlayerState } from "../types/questionTypes";

interface AudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export function AudioPlayer({
  src,
  className = "",
  autoPlay = false,
  onPlay,
  onPause,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setState((prev) => ({ ...prev, duration: audio.duration }));
    };

    const handleTimeUpdate = () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
      onPlay?.();
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      onPause?.();
    };

    const handleEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
      onEnded?.();
    };

    const handleError = () => {
      setError("Failed to load audio file");
      setIsLoading(false);
    };

    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Auto-play if requested
    if (autoPlay) {
      audio.play().catch(() => {
        console.warn("Auto-play prevented by browser policy");
      });
    }

    return () => {
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [src, autoPlay, onPlay, onPause, onEnded]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (state.isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setError("Could not play audio");
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = state.volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const volume = newVolume / 100;
    audio.volume = volume;
    setState((prev) => ({ ...prev, volume }));
    setIsMuted(volume === 0);
  };

  const handleSeek = (newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = (newTime / 100) * state.duration;
    audio.currentTime = time;
    setState((prev) => ({ ...prev, currentTime: time }));
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setState((prev) => ({ ...prev, currentTime: 0 }));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <Volume2 className="mx-auto mb-2 size-8" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <audio ref={audioRef} src={src} preload="metadata" />

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={restart}
              disabled={isLoading}
              aria-label="Restart audio"
            >
              <RotateCcw className="size-4" />
            </Button>

            <Button
              onClick={togglePlayPause}
              disabled={isLoading}
              size="lg"
              className="size-12 rounded-full"
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <div className="size-4 animate-spin rounded-full border-b-2 border-white"></div>
              ) : state.isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="ml-0.5 size-5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleMute}
              disabled={isLoading}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-12 text-xs text-gray-500">
                {formatTime(state.currentTime)}
              </span>
              <div className="flex-1">
                <Progress
                  value={progressPercent}
                  className="h-2 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = (x / rect.width) * 100;
                    handleSeek(percentage);
                  }}
                />
              </div>
              <span className="w-12 text-xs text-gray-500">
                {formatTime(state.duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-gray-400" />
              <div className="flex-1">
                <Progress
                  value={isMuted ? 0 : state.volume * 100}
                  className="h-1 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = (x / rect.width) * 100;
                    handleVolumeChange(percentage);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
