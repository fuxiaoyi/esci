import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (url?: string) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [url, setUrl] = useState('');

  const handleConfirm = () => {
    // Close modal immediately
    onOpenChange(false);
    // Reset form
    setUrl('');
    // Call onConfirm after modal is closed
    onConfirm(url || undefined);
  };

  const handleCancel = () => {
    // Reset form
    setUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            New Presentation
          </DialogTitle>
          <DialogDescription>
            Start a new presentation by providing a URL as content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Website URL (optional)
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Provide a URL to create a new presentation
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-darkGreen-600 hover:bg-darkGreen-700 text-white">
            Create 
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationModal; 