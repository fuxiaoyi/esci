import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles, Link } from 'lucide-react';
import { callCozeAPI, decodeStreamChunk, getCozeAnswerContent } from '@/lib/coze-api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import VoicePlayer from '@/components/VoicePlayer';

// Maximum number of messages to keep in the dialogue
const MAX_MESSAGES = 50;

interface DialogueInterfaceProps {
  title: string;
  description: string;
  onSendQuery?: () => boolean | Promise<boolean>;
  messages?: { role: 'user' | 'assistant', content: string }[];
  onMessagesUpdate?: (messages: { role: 'user' | 'assistant', content: string }[]) => void;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
  queryCount?: number;
  queryLimit?: number;
  showCounter?: boolean;
  isSubscribed?: boolean;
  showFileUpload?: boolean;
  isNewTab?: boolean;
  conversationContext?: {
    contextUrl?: string;
    cozeConfig?: {
      apiUrl: string;
      botId: string;
      apiToken: string;
    };
  };
  podcastContent?: string | null;
  onCreateNewPresentation?: () => void;
}

const DialogueInterface: React.FC<DialogueInterfaceProps> = ({ 
  title, 
  description,
  onSendQuery = () => true,
  messages: externalMessages,
  onMessagesUpdate,
  showUpgradeButton = false,
  onUpgradeClick,
  queryCount = 0,
  queryLimit = 5,
  showCounter = false,
  isSubscribed = false,
  showFileUpload = true,
  isNewTab = false,
  conversationContext,
  podcastContent,
  onCreateNewPresentation
}) => {
  const [input, setInput] = useState('');
  const [internalMessages, setInternalMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasClickedNewPresentation, setHasClickedNewPresentation] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use external messages if provided, otherwise use internal state
  const messages = externalMessages || internalMessages;
  
  // Update internal messages when external messages change
  useEffect(() => {
    if (externalMessages) {
      setInternalMessages(externalMessages);
    } else {
      // Reset internal messages when external messages are cleared
      setInternalMessages([]);
    }
  }, [externalMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const updateMessages = (newMessages: { role: 'user' | 'assistant', content: string }[]) => {
    if (onMessagesUpdate) {
      onMessagesUpdate(newMessages);
    } else {
      setInternalMessages(newMessages);
    }
  };

  const handleNewPresentationClick = () => {
    setHasClickedNewPresentation(true);
    if (onCreateNewPresentation) {
      onCreateNewPresentation();
    }
  };

  // Insert podcastContent as assistant messages if not already present
  const [hasInsertedPodcastContent, setHasInsertedPodcastContent] = useState(false);
  useEffect(() => {
    if (
      podcastContent &&
      !hasInsertedPodcastContent &&
      !messages.some(m => m.role === 'assistant' && m.content.includes(podcastContent))
    ) {
      let newMessages = [...messages];
      
      // Enhanced markers for both Chinese and English content
      const markers = [
        { marker: '播客脚本:', offset: 5 },
        { marker: 'Podcast Script', offset: 14 },
        { marker: '音频脚本:', offset: 5 },
        { marker: 'Audio Script', offset: 12 },
        { marker: '脚本:', offset: 3 },
        { marker: 'Script:', offset: 7 }
      ];
      
      let found = false;
      for (const { marker, offset } of markers) {
        const scriptIndex = podcastContent.indexOf(marker);
        if (scriptIndex !== -1) {
          // Extract the script after the marker
          const script = podcastContent.slice(scriptIndex + offset).trim();
          // Split by newlines
          const lines = script.split(/\r?\n/).filter(line => line.trim() !== '');
          // Create assistant messages for each line
          const scriptMessages = lines.map(line => ({ role: 'assistant' as const, content: line }));
          newMessages = [...messages, ...scriptMessages].slice(-MAX_MESSAGES);
          found = true;
          break;
        }
      }
      
      // If no specific markers found, try to detect if the content is Chinese and treat it as a script
      if (!found) {
        // Check if content contains Chinese characters
        const hasChineseChars = /[\u4e00-\u9fff]/.test(podcastContent);
        
        if (hasChineseChars) {
          // For Chinese content without specific markers, treat the entire content as a script
          const lines = podcastContent.split(/\r?\n/).filter(line => line.trim() !== '');
          const scriptMessages = lines.map(line => ({ role: 'assistant' as const, content: line }));
          newMessages = [...messages, ...scriptMessages].slice(-MAX_MESSAGES);
        } else {
          // Fallback: show the whole podcastContent as one message
          const podcastMessage = { role: 'assistant' as const, content: `Here's the podcast content:\n\n${podcastContent}` };
          newMessages = [podcastMessage, ...messages].slice(-MAX_MESSAGES);
        }
      }
      
      updateMessages(newMessages);
      setHasInsertedPodcastContent(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podcastContent, messages]);

  const renderMessageContent = (message: { role: 'user' | 'assistant', content: string }) => {
    if (message.role === 'user') {
      return (
        <div className="markdown-content prose prose-sm dark:prose-invert max-w-none [&_a]:text-white [&_a:hover]:text-white/80">
          {message.content}
        </div>
      );
    } else {
      return (
        <div className="markdown-content prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Custom components for markdown
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                );
              },
              // Handle links
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400 underline"
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Check if we should proceed with the query
    let shouldProceed = true;
    if (onSendQuery) {
      shouldProceed = await Promise.resolve(onSendQuery());
    }
    
    if (!shouldProceed) {
      return;
    }
    
    // Add user message
    const userMessage = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMessage];
    updateMessages(newMessages);
    
    // Clear input
    const currentInput = input;
    setInput('');
    
    // Set loading state
    setIsLoading(true);
    
    console.log('Sending query to Coze API:', currentInput);
    
    try {
      // Add an empty assistant message first that will be populated with content
      const assistantMessage = { 
        role: 'assistant' as const, 
        content: 'Thinking...'
      };
      
      const streamingMessages = [...newMessages, assistantMessage];
      updateMessages(streamingMessages);
      
      // TODO: Handle file upload and processing here
      // For now, we'll just pass undefined instead of URL context
      // In a real implementation, you would process the file and pass it to the API
      
      // Prepare context for the API call
      let contextToSend = undefined;
      if (podcastContent) {
        // Combine the user's message with the podcast content as context
        contextToSend = `Podcast Content Context:\n${podcastContent}\n\nUser Question: ${currentInput}`;
      }
      
      const responseContent = await getCozeAnswerContent(
        currentInput,
        user?.id || 'anonymous_user',
        contextToSend,
        // Update the message incrementally as content arrives
        (content) => {
          if (content && content.trim()) {
            console.log('Received content update:', content.substring(0, 50) + (content.length > 50 ? '...' : ''));
            
            // Get the current latest messages
            const currentMessages = externalMessages || internalMessages;
            
            // Check if the content contains Chinese characters
            const hasChineseChars = /[\u4e00-\u9fff]/.test(content);
            
            if (hasChineseChars) {
              // For Chinese content, split into lines and create separate messages
              const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
              
              // Remove any existing assistant messages and replace with script lines
              const messagesWithoutAssistant = currentMessages.filter(msg => msg.role !== 'assistant');
              const scriptMessages = lines.map(line => ({ role: 'assistant' as const, content: line }));
              const updatedMessages = [...messagesWithoutAssistant, ...scriptMessages];
              updateMessages(updatedMessages);
            } else {
              // For non-Chinese content, update the last assistant message as before
              if (currentMessages.length > 0 && currentMessages[currentMessages.length - 1].role === 'assistant') {
                // Create a new array with all but the last message
                const allButLastMessage = currentMessages.slice(0, -1);
                // Update the last message with the new content
                const updatedMessages = [
                  ...allButLastMessage,
                  { role: 'assistant' as const, content: content }
                ];
                updateMessages(updatedMessages);
              } else {
                // This shouldn't happen normally, but just in case
                const updatedMessages = [...newMessages, { role: 'assistant' as const, content: content }];
                updateMessages(updatedMessages);
              }
            }
          }
        },
        conversationContext?.cozeConfig
      );
      
      console.log('Final response content:', responseContent ? 
        (responseContent.substring(0, 50) + (responseContent.length > 50 ? '...' : '')) : 'null');
      
      if (responseContent === null) {
        throw new Error('Failed to get response (null response)');
      }
      
      // Only update with final message if we got a valid response content
      if (responseContent && responseContent.trim()) {
        // Check if the response contains Chinese characters
        const hasChineseChars = /[\u4e00-\u9fff]/.test(responseContent);
        
        let finalMessages;
        if (hasChineseChars) {
          // For Chinese content, treat it as an audio script and split into individual lines
          const lines = responseContent.split(/\r?\n/).filter(line => line.trim() !== '');
          const scriptMessages = lines.map(line => ({ role: 'assistant' as const, content: line }));
          finalMessages = [...newMessages, ...scriptMessages];
        } else {
          // For non-Chinese content, treat as a single message
          finalMessages = [...newMessages, { role: 'assistant' as const, content: responseContent }];
        }
        
        // Limit the number of messages to prevent excessive memory usage
        const limitedMessages = finalMessages.slice(-MAX_MESSAGES);
        updateMessages(limitedMessages);
      } else {
        console.error('Empty response content received from Coze API');
        // Handle empty response
        const errorMessages = [...newMessages, { 
          role: 'assistant' as const, 
          content: 'Sorry, I couldn\'t generate a proper response. Please try again.' 
        }];
        updateMessages(errorMessages.slice(-MAX_MESSAGES));
      }
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Add error message as assistant response
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, there was an error processing your request. Please try again later.'
      };
      
      const limitedMessages = [...newMessages, errorMessage].slice(-MAX_MESSAGES);
      updateMessages(limitedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 p-4 space-y-4 relative ${messages.length === 0 && onCreateNewPresentation && !hasClickedNewPresentation ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {messages.length === 0 ? (
          <>
            {/* New Presentation Button as background element */}
            {onCreateNewPresentation && !hasClickedNewPresentation && (
              <div className="absolute inset-0 flex justify-center items-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-darkGreen-600/10 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-darkGreen-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Start Your First Presentation</h3>
                    <p className="text-muted-foreground mb-6">Create a new presentation to begin your learning journey</p>
                    <Button 
                      onClick={handleNewPresentationClick} 
                      className="bg-darkGreen-600 hover:bg-darkGreen-700 text-white h-12 px-8 text-lg font-semibold shadow-lg"
                    >
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Start New Presentation
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-lg p-3 bg-background border border-border">
                <div className="markdown-content prose prose-sm dark:prose-invert max-w-none">
                  Hi, I am Edge Science. How can I help you today?
                </div>
                {/* Show context information if available */}
                {conversationContext && conversationContext.contextUrl && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Context for this conversation:</p>
                    <div className="flex items-center gap-2 mb-1">
                      <Link className="h-3 w-3 text-muted-foreground" />
                      <a 
                        href={conversationContext.contextUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-400 underline truncate"
                      >
                        {conversationContext.contextUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.role === 'assistant' 
                      ? 'bg-background border border-border' 
                      : 'bg-darkGreen-600 text-white [&_a]:text-white [&_a:hover]:text-white/80'
                  }`}
                >
                  {renderMessageContent(message)}
                </div>
              </div>
            ))}
            
            {/* Loading indicator when waiting for response */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-lg p-3 bg-background border border-border">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-muted animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-muted animate-bounce delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-muted animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="p-4 border-t border-border bg-card mt-auto">
        {showCounter && !isSubscribed && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              {queryCount} / {queryLimit} free queries used
            </span>
            {showUpgradeButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUpgradeClick}
                className="text-sm"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Upgrade for unlimited
              </Button>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 min-h-10 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            className="self-end bg-darkGreen-600 hover:bg-darkGreen-700 text-white"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DialogueInterface;
