import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Camera, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  videoFile?: File;
  onCaptureFrame?: (data: { timestamp: number; base64: string; formattedTime: string }) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  videoFile,
  onCaptureFrame,
  onTimeUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Ref to track the current blob URL for proper cleanup
  const blobUrlRef = useRef<string | null>(null);
  // Ref to track toast timeout to prevent memory leaks on unmount
  const toastTimeoutRef = useRef<number | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptureToast, setShowCaptureToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use file URL if provided, otherwise use videoUrl
  const videoSrc = useMemo(() => {
    // 1. Revoke the previous URL before creating a new one
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      // 2. Store blob URL in a ref when created
      blobUrlRef.current = url;
      return url;
    }
    
    return videoUrl;
  }, [videoFile, videoUrl]);

  useEffect(() => {
    // Clear error when video source changes
    setError(null);
  }, [videoFile, videoUrl]);

  // 3. Also revoke on component unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      // Also clear toast timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      onTimeUpdate?.(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/png');

        onCaptureFrame?.({
          timestamp: currentTime,
          base64,
          formattedTime: formatTime(currentTime)
        });

        // Show toast with proper timeout cleanup
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        setShowCaptureToast(true);
        toastTimeoutRef.current = window.setTimeout(() => setShowCaptureToast(false), 2000);
      }
    } catch (err) {
      console.error('Frame capture failed:', err);
      setError('Frame capture failed. If using a remote video, try downloading it first.');
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleError = () => {
    setError('Failed to load video. CORS restrictions may prevent direct playback of remote videos.');
  };

  return (
    <div className="bg-black rounded-xl overflow-hidden relative">
      {/* Video Element */}
      <div className="relative aspect-video bg-gray-900">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={handleError}
          crossOrigin="anonymous"
          muted={isMuted}
        />

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4">
            <div className="text-center max-w-md">
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-sm text-gray-400">
                Try uploading a local video file instead.
              </p>
            </div>
          </div>
        )}

        {/* Capture Toast */}
        {showCaptureToast && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in flex items-center gap-2">
            <Camera size={16} />
            Frame captured at {formatTime(currentTime)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 px-4 py-3 space-y-2">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono w-12">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3
                       [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:bg-blue-500
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-xs text-gray-400 font-mono w-12 text-right">{formatTime(duration)}</span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSkip(-10)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Back 10s"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Forward 10s"
            >
              <SkipForward size={18} />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCaptureFrame}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Camera size={16} />
              Capture Frame
            </button>

            <button
              onClick={handleFullscreen}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;