import React, { useState, useEffect, useRef } from 'react';
import DialogueInterface from '@/components/DialogueInterface';
import PaymentModal from '@/components/PaymentModal';
import { useQueryLimit } from '@/hooks/useQueryLimit';
import { Skeleton } from '@/components/ui/skeleton';
import { QUERY_LIMIT } from '@/lib/quota-service';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { verifyPaymentSession, updateSubscriptionStatus } from '@/lib/payment-service';

// Define AI Model type
interface AIModel {
  id: string;
  name: string;
  iconSrc?: string;
  icon?: React.ReactNode;
}

interface DialogueWrapperProps {
  activeConversation: string | null;
  clearMessages: React.MutableRefObject<boolean>;
  onUpdateConversation?: (id: string, title: string, preview: string) => void;
  models?: AIModel[];
  onModelSelect?: (modelId: string) => void;
  conversationContext?: {
    contextUrl?: string;
    cozeConfig?: {
      apiUrl: string;
      botId: string;
      apiToken: string;
    };
  };
  podcastContent?: string | null;
  forceReloadMessages?: number;
  onCreateNewPresentation?: () => void;
}

const DialogueWrapper: React.FC<DialogueWrapperProps> = ({ 
  activeConversation,
  clearMessages,
  onUpdateConversation,
  models,
  onModelSelect,
  conversationContext,
  podcastContent,
  forceReloadMessages,
  onCreateNewPresentation
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { queryCount, limitExceeded, incrementQueryCount, isLoading, isSubscribed } = useQueryLimit();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const lastMessageContentRef = useRef<string>('');
  const [verifyingSubscription, setVerifyingSubscription] = useState(false);
  const [activeModel, setActiveModel] = useState<string>(models && models.length > 0 ? models[0].id : 'model1');
  
  // Check if we're on the personal page
  const isPersonalPage = location.pathname === '/personal';
  const isHomePage = location.pathname === '/';
  
  // Check for session_id in URL (from Stripe checkout redirect) and refresh page if subscription is active
  useEffect(() => {
    const checkSessionId = async () => {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session_id');
      
      if (sessionId && user && isPersonalPage) {
        try {
          setVerifyingSubscription(true);
          
          // Verify the payment session with Stripe through the edge function
          const isSuccessful = await verifyPaymentSession(sessionId);
          
          if (isSuccessful) {
            try {
              // Update subscription status in the database using the edge function
              await updateSubscriptionStatus(user.id, true);
              
              toast({
                title: "Subscription active",
                description: "Your subscription has been activated. You now have unlimited access!",
                variant: "default",
              });
              
              // Remove the session_id from the URL to prevent re-verification on refresh
              navigate(location.pathname, { replace: true });
              
              // Refresh the page to update quota limits
              window.location.reload();
            } catch (updateError) {
              console.error('Error updating subscription status:', updateError);
              
              toast({
                title: "Subscription active",
                description: "Your payment was verified, but we had trouble updating your account. Please contact support if you don't have full access.",
                variant: "default",
              });
              
              // Remove the session_id from the URL to prevent re-verification on refresh
              navigate(location.pathname, { replace: true });
              
              // Refresh the page to update quota limits
              window.location.reload();
            }
          }
        } catch (error) {
          console.error('Error in session verification process:', error);
        } finally {
          setVerifyingSubscription(false);
        }
      }
    };
    
    checkSessionId();
  }, [location, navigate, toast, user, isPersonalPage]);
  
  // Check for payment error in URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('payment_error');
    
    if (error) {
      setPaymentError(decodeURIComponent(error));
      // Clear the URL parameter to prevent showing the error again on refresh
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);
  
  // Handle clearing messages when clearMessages.current is true
  useEffect(() => {
    if (clearMessages.current) {
      setMessages([]);
      clearMessages.current = false;
      
      // If we have an active conversation, save the empty messages
      if (activeConversation && user) {
        const userPrefix = `user_${user.id}_`;
        localStorage.setItem(`${userPrefix}conversation_${activeConversation}`, JSON.stringify([]));
      }
    }
  }, [clearMessages, activeConversation, user]);
  
  // Load saved messages if activeConversation is provided
  useEffect(() => {
    if (clearMessages.current) {
      // Don't load messages if we're clearing them
      return;
    }
    
    if (activeConversation) {
      // Include user ID in the localStorage key to make conversations user-specific
      const userPrefix = user ? `user_${user.id}_` : '';
      const savedMessages = localStorage.getItem(`${userPrefix}conversation_${activeConversation}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversation, clearMessages, user]);
  
  // Force reload messages when forceReloadMessages changes
  useEffect(() => {
    if (forceReloadMessages && forceReloadMessages > 0 && activeConversation) {
      const userPrefix = user ? `user_${user.id}_` : '';
      const savedMessages = localStorage.getItem(`${userPrefix}conversation_${activeConversation}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  }, [forceReloadMessages, activeConversation, user]);
  
  // Function to generate a title from conversation messages
  const generateConversationTitle = (messages: { role: 'user' | 'assistant', content: string }[]) => {
    if (messages.length === 0) return "New Presentation";
    
    // Get the first few messages (up to 3) to generate a title
    const relevantMessages = messages.slice(0, 3);
    
    // Extract the main topic from the first user message
    const firstUserMessage = relevantMessages.find(m => m.role === 'user')?.content || '';
    
    // Clean up the message content
    let title = firstUserMessage
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim()
      .split(/\s+/) // Split into words
      .slice(0, 5) // Take first 5 words
      .join(' ');
    
    // If the title is too short, add more context from other messages
    if (title.length < 10 && messages.length > 1) {
      const secondMessage = messages[1].content
        .replace(/[^\w\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join(' ');
      title = `${title} ${secondMessage}`;
    }
    
    // If still too short, use a default title
    if (title.length < 5) {
      title = "New Presentation";
    }
    
    return title;
  };

  // Save messages when they change
  useEffect(() => {
    // Don't save empty messages when clearMessages is true
    if (clearMessages.current) {
      return;
    }
    
    if (activeConversation) {
      // Include user ID in the localStorage key to make conversations user-specific
      const userPrefix = user ? `user_${user.id}_` : '';
      localStorage.setItem(`${userPrefix}conversation_${activeConversation}`, JSON.stringify(messages));
      
      // Update conversation preview in parent component
      if (onUpdateConversation) {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
        const preview = lastUserMessage.length > 0 ? lastUserMessage : 'No user messages';
        const title = generateConversationTitle(messages);
        
        // Only update if the preview has changed
        if (preview !== lastMessageContentRef.current) {
          lastMessageContentRef.current = preview;
          onUpdateConversation(activeConversation, title, preview);
        }
      }
    }
  }, [messages, activeConversation, onUpdateConversation, clearMessages, user]);
  
  const handleQuery = async () => {
    // Skip query limit check if user is subscribed
    if (isSubscribed) {
      return true; // Allow the query to proceed without checking limits
    }
    
    const exceeded = await incrementQueryCount();
    if (exceeded) {
      // If on home page and not logged in, redirect to sign in
      if (isHomePage && !user) {
        toast({
          title: "Registration Required",
          description: "Please register first to subscribe to the Pro version.",
        });
        navigate('/signin');
        return false;
      }
      
      setPaymentModalOpen(true);
      return false; // Prevent the query from being processed
    }
    return true; // Allow the query to proceed
  };
  
  const handleNewMessage = (newMessages: { role: 'user' | 'assistant', content: string }[]) => {
    setMessages(newMessages);
  };
  
  const handleDismissError = () => {
    setPaymentError(null);
  };
  
  // Handle upgrade to premium button click
  const handleUpgradeClick = () => {
    setPaymentModalOpen(true);
  };

  // Handle model selection
  const handleModelChange = (modelId: string) => {
    setActiveModel(modelId);
    if (onModelSelect) {
      onModelSelect(modelId);
    }
  };
  
  // Show loading state while checking user status
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 p-6 bg-card rounded-lg border border-border">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-1/2 mx-auto" />
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Payment error notification */}
      {paymentError && (
        <Alert variant="destructive" className="mb-4 max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>
            {paymentError}
          </AlertDescription>
          <button 
            onClick={handleDismissError}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-accent"
            aria-label="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </Alert>
      )}
      
      {/* Main chat interface */}
      <div className="bg-card rounded-lg border border-border overflow-hidden flex-grow flex flex-col h-full">
        {models && models.length > 0 && (
          <div className="flex p-2 border-b border-border overflow-x-auto scrollbar-thin">
            {models.map((model) => (
              <button
                key={model.id}
                className={`flex items-center px-3 py-2 rounded-md mr-2 whitespace-nowrap transition-colors ${
                  activeModel === model.id 
                    ? 'bg-darkGreen-600 text-white' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => handleModelChange(model.id)}
              >
                {model.icon && <span className="mr-2">{model.icon}</span>}
                <span className="text-sm font-medium">{model.name}</span>
              </button>
            ))}
          </div>
        )}
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <DialogueInterface
            title="Chat"
            description="How can I help you today?"
            onSendQuery={handleQuery}
            messages={messages}
            onMessagesUpdate={handleNewMessage}
            showUpgradeButton={limitExceeded && !isSubscribed}
            onUpgradeClick={handleUpgradeClick}
            queryCount={queryCount}
            queryLimit={QUERY_LIMIT}
            showCounter={!isSubscribed}
            isSubscribed={isSubscribed}
            showFileUpload={!isHomePage}
            isNewTab={isPersonalPage && !activeConversation}
            conversationContext={conversationContext}
            podcastContent={podcastContent}
            onCreateNewPresentation={onCreateNewPresentation}
          />
        </div>
      </div>
      
      {/* Payment Modal */}
      <PaymentModal 
        open={paymentModalOpen} 
        onOpenChange={setPaymentModalOpen} 
      />
    </div>
  );
};

export default DialogueWrapper;
