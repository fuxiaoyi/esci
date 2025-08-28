import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Upload, X } from 'lucide-react';
import { useAnnotation } from '@/contexts/AnnotationContext';
import { useToast } from '@/hooks/use-toast';

interface QuestionInputModalProps {
  children: React.ReactNode;
}

export function QuestionInputModal({ children }: QuestionInputModalProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [solutionA, setSolutionA] = useState('');
  const [solutionB, setSolutionB] = useState('');
  const [modelName, setModelName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { addNewQuestion } = useAnnotation();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL for image files
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!question.trim() || !solutionA.trim() || !solutionB.trim() || !modelName.trim()) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Create new question object
      const newQuestion = {
        question: question.trim(),
        answer_a: solutionA.trim(),
        answer_b: solutionB.trim(),
        model_name: modelName.trim(),
        figure: selectedFile || undefined
      };

      // Add to annotation context
      await addNewQuestion(newQuestion);
      
      // Show success message
      toast({
        title: "Success!",
        description: "New question has been added successfully.",
      });
      
      // Reset form
      setQuestion('');
      setSolutionA('');
      setSolutionB('');
      setModelName('');
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setOpen(false);
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Failed to add question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setQuestion('');
    setSolutionA('');
    setSolutionB('');
    setModelName('');
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Question
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Question Input */}
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              placeholder="Enter your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Model Name Input */}
          <div className="space-y-2">
            <Label htmlFor="modelName">Model Name</Label>
            <Input
              id="modelName"
              placeholder="Enter model name (e.g., BBa_K2206006)"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </div>

          {/* Solution A Input */}
          <div className="space-y-2">
            <Label htmlFor="solutionA">Solution A</Label>
            <Textarea
              id="solutionA"
              placeholder="Enter solution A..."
              value={solutionA}
              onChange={(e) => setSolutionA(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Solution B Input */}
          <div className="space-y-2">
            <Label htmlFor="solutionB">Solution B</Label>
            <Textarea
              id="solutionB"
              placeholder="Enter solution B..."
              value={solutionB}
              onChange={(e) => setSolutionB(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Upload Figure</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-primary hover:text-primary/80">
                      Click to upload
                    </span> or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </label>
            </div>
            
            {/* File Preview */}
            {selectedFile && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {previewUrl && (
                  <div className="mt-2">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto max-h-32 rounded border"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!question.trim() || !solutionA.trim() || !solutionB.trim() || !modelName.trim()}>
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
