import React from 'react';
import { cn } from '@/lib/utils';

interface VoicePlayerProps {
  src: string;
  className?: string;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ src, className }) => {
  return (
    <div className={cn("flex items-center gap-2 p-2 bg-background rounded-lg border border-border", className)}>
      <audio 
        controls 
        className="w-full"
        src={src}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default VoicePlayer; 