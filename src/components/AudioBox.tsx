import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X, Minimize2, Settings, Download } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import { getCozePodcastContent, COZE_PODCAST_CONFIG } from '@/lib/coze-api';

interface AudioBoxProps {
  className?: string;
  audioUrl?: string;
  onPodcastContentGenerated?: (podcastContent: string) => void;
  podcastContent?: string | null;
}

const AudioBox: React.FC<AudioBoxProps> = ({ className, audioUrl, onPodcastContentGenerated, podcastContent }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMinimized, setIsMinimized] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizePrompt, setCustomizePrompt] = useState('');
  const [audioSrc, setAudioSrc] = useState<string>("/Onboarding.mp3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCharLimitAlert, setShowCharLimitAlert] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasSentPodcastContentRef = useRef(false);

  useEffect(() => {
    if (audioUrl) {
      setAudioSrc(audioUrl);
    }
  }, [audioUrl]);

  const handlePlayPause = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Audio play failed:', error);
        // Reset the playing state if autoplay is blocked
        setIsPlaying(false);
      }
    }
  };

  const handleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (isPlaying) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + 10
      );
    }
  };

  const handleGenerate = async () => {
    if (!customizePrompt.trim()) return;
    
    // Check character limit
    if (customizePrompt.length > 4096) {
      setShowCharLimitAlert(true);
      return;
    }
    
    setIsGenerating(true);
    try {
      const userId = 'anonymous_user'; // Replace with actual user ID if available
      
      // Get the podcast content (single API call)
      const podcastContent = await getCozePodcastContent(customizePrompt, userId);
      
      if (podcastContent) {
        // Extract audio URL from the podcast content
        const audioUrlMatch = podcastContent.match(/https?:\/\/[^\s<>"']+\.(mp3|wav|m4a|ogg|aac)(\?[^\s<>"']*)?/i);
        if (audioUrlMatch) {
          setAudioSrc(audioUrlMatch[0]);
          setCurrentTime(0);
          setIsPlaying(true);
          setCustomizeOpen(false);
          
          // Call the callback with the podcast content if provided
          if (onPodcastContentGenerated) {
            onPodcastContentGenerated(podcastContent);
          }
        } else {
          alert('No audio URL found in response.');
        }
      } else {
        alert('Failed to generate podcast content.');
      }
    } catch (e) {
      console.error('Failed to generate audio:', e);
      alert('Failed to generate audio.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSrc]);

  // Add autoplay on component mount
  useEffect(() => {
    const handleAutoplay = async () => {
      if (audioRef.current && audioSrc) {
        try {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Autoplay failed:', error);
          // Autoplay might be blocked by browser policy
          setIsPlaying(false);
        }
      }
    };

    // Small delay to ensure audio element is ready
    const timer = setTimeout(handleAutoplay, 100);
    return () => clearTimeout(timer);
  }, []); // Run only on mount

  const handleAudioPlay = () => {
    setIsPlaying(true);
    if (
      podcastContent &&
      onPodcastContentGenerated &&
      !hasSentPodcastContentRef.current
    ) {
      onPodcastContentGenerated(podcastContent);
      hasSentPodcastContentRef.current = true;
    }
  };

  const handleDownload = () => {
    if (audioSrc) {
      const link = document.createElement('a');
      link.href = audioSrc;
      link.download = 'presentation-audio.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isMinimized) {
    return (
      <div className={cn(
        "bg-card border border-border rounded-lg p-3 shadow-sm",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="h-8 w-8 rounded-full bg-darkGreen-600 hover:bg-darkGreen-700 text-white"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {audioUrl ? 'Generated Presentation Audio' : 'No Audio Available'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {audioUrl ? `${formatTime(currentTime)} / ${formatTime(duration)}` : 'Create presentation with URL'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(false)}
            className="h-6 w-6"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-4 shadow-sm",
      className
    )}>
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={handleAudioPlay}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* Header with minimize button */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-center flex-1">
          <p className="text-sm font-medium">Presentation Audio</p>
          <p className="text-xs text-muted-foreground">
            {audioUrl ? 'Currently playing: Generated Presentation Audio' : 'No audio available - Create a new presentation with a URL to generate audio'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-6 w-6"
            aria-label="Download Audio"
            disabled={!audioSrc || audioSrc === "/Onboarding.mp3"}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCustomizeOpen(true)}
            className="h-6 w-6"
            aria-label="Customize Audio"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between space-x-2 md:space-x-4">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayPause}
          className="h-10 w-10 rounded-full bg-darkGreen-600 hover:bg-darkGreen-700 text-white flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        {/* Skip Back */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkipBack}
          className="h-8 w-8 flex-shrink-0"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Progress Bar */}
        <div className="flex-1 flex items-center space-x-2 min-w-0">
          <span className="text-xs text-muted-foreground w-8 md:w-10 flex-shrink-0">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8 md:w-10 flex-shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Skip Forward */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkipForward}
          className="h-8 w-8 flex-shrink-0"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Volume Control */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMute}
            className="h-8 w-8"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <div className="hidden md:block">
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Customize Audio Modal */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Customize Presentation Audio</DialogTitle>
            <DialogDescription>What should the AI hosts focus on?</DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-md p-3 mb-4">
            <div className="text-xs font-semibold mb-1">Things to try</div>
            <ul className="text-xs list-disc pl-4 space-y-1">
              <li>Focus on a specific source (<span className="italic">"only cover the article about Italy"</span>)</li>
              <li>Focus on a specific topic (<span className="italic">"just discuss the novel's main character"</span>)</li>
              <li>Target a specific audience (<span className="italic">"explain to someone new to biology"</span>)</li>
            </ul>
          </div>
          {/* Replace Input with Markdown Editor */}
          <div className="mb-4">
            <MDEditor
              value={customizePrompt}
              onChange={setCustomizePrompt}
              previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
              minHeight={120}
              height={200}
              textareaProps={{
                placeholder: 'Type your instructions here...'
              }}
              className="mb-2"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {customizePrompt.length} / 4,096 characters
              </span>
              {customizePrompt.length > 4096 && (
                <span className="text-red-500 font-medium">
                  Input too long
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setCustomizeOpen(false)} className="mr-2" variant="outline">Cancel</Button>
            <Button onClick={handleGenerate} disabled={!customizePrompt.trim() || isGenerating || customizePrompt.length > 4096}>
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Character Limit Alert Dialog */}
      <AlertDialog open={showCharLimitAlert} onOpenChange={setShowCharLimitAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Input Too Long</AlertDialogTitle>
            <AlertDialogDescription>
              Your input exceeds the maximum limit of 4,096 characters. Please shorten your text to continue generating audio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowCharLimitAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AudioBox; 