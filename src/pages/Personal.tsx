import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DialogueWrapper from '@/components/DialogueWrapper';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  MessageSquare, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  MoreHorizontal, 
  ChevronDown,
  Plus,
  Target,
  Volume2
} from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import NewConversationModal from '@/components/NewConversationModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { verifyPaymentSession, updateSubscriptionStatus } from '@/lib/payment-service';
import { supabase } from '@/lib/supabase';
import { useQueryLimit } from '@/hooks/useQueryLimit';
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarProvider, 
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AnnotationProvider } from '@/contexts/AnnotationContext';
import AudioBox from '@/components/AudioBox';
import { getCozePodcastContent } from '@/lib/coze-api';

// Define conversation type
interface Conversation {
  id: string;
  title: string;
  date: string;
  preview: string;
  contextUrl?: string;
}

const Personal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { isSubscribed } = useQueryLimit();
  
  // State for conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Ref to track if we're switching conversations to clear messages
  const clearMessagesRef = useRef(false);
  // State for payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [subscriptionVerified, setSubscriptionVerified] = useState(false);
  const [verifyingSubscription, setVerifyingSubscription] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  // Add state to control subscription alert visibility
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(true);
  // Add state for search filter
  const [searchTerm, setSearchTerm] = useState('');
  // Add state to control audio box visibility
  const [showAudioBox, setShowAudioBox] = useState(true);
  // Add state for new presentation modal
  const [newConversationModalOpen, setNewConversationModalOpen] = useState(false);
  // Add state for generated audio URL
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  // Add state for podcast content
  const [PODCAST_CONTENT, setPODCAST_CONTENT] = useState<string | null>(null);
  // Add state to force reload messages when podcast content is added
  const [forceReloadMessages, setForceReloadMessages] = useState(0);

  // Check for session_id in URL (from Stripe checkout redirect)
  useEffect(() => {
    const checkSessionId = async () => {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session_id');
      
      if (sessionId && user) {
        try {
          setVerifyingSubscription(true);
          setVerificationError(null);
          
          // Verify the payment session with Stripe through the edge function
          const isSuccessful = await verifyPaymentSession(sessionId);
          
          if (isSuccessful) {
            try {
              // Update subscription status in the database using the edge function
              await updateSubscriptionStatus(user.id, true);
              
              setSubscriptionVerified(true);
              setShowSubscriptionAlert(true);
              toast({
                title: "Subscription active",
                description: "Your subscription has been activated. You now have unlimited access!",
                variant: "default",
              });
            } catch (updateError) {
              console.error('Error updating subscription status:', updateError);
              
              // Even if the update fails, if verification was successful, we can still show success
              setSubscriptionVerified(true);
              setShowSubscriptionAlert(true);
              toast({
                title: "Subscription active",
                description: "Your payment was verified, but we had trouble updating your account. Please contact support if you don't have full access.",
                variant: "default",
              });
            }
          } else {
            setVerificationError("Payment verification failed. The payment may not have been completed successfully.");
            toast({
              title: "Verification failed",
              description: "We couldn't verify your payment. Please contact support.",
              variant: "destructive",
            });
          }
          
          // Remove the session_id from the URL to prevent re-verification on refresh
          navigate(location.pathname, { replace: true });
        } catch (error) {
          console.error('Error in session verification process:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setVerificationError(errorMessage);
          
          // Check if it's a server error from the Edge Function
          if (errorMessage.includes('Server error when updating subscription')) {
            toast({
              title: "Server error",
              description: "There was a server error updating your subscription. Please try again later or contact support.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Verification error",
              description: "There was an error verifying your payment. Please contact support.",
              variant: "destructive",
            });
          }
        } finally {
          setVerifyingSubscription(false);
        }
      }
    };
    
    checkSessionId();
  }, [location, navigate, toast, user]);

  // Function to manually retry payment verification
  const retryVerification = async () => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    
    if (sessionId && user) {
      try {
        setVerifyingSubscription(true);
        setVerificationError(null);
        
        // Verify the payment session with Stripe through the edge function
        const isSuccessful = await verifyPaymentSession(sessionId);
        
        if (isSuccessful) {
          try {
            // Update subscription status in the database using the edge function
            await updateSubscriptionStatus(user.id, true);
            
            setSubscriptionVerified(true);
            setShowSubscriptionAlert(true);
            toast({
              title: "Subscription active",
              description: "Your subscription has been activated. You now have unlimited access!",
              variant: "default",
            });
          } catch (updateError) {
            console.error('Error updating subscription status:', updateError);
            
            // Even if the update fails, if verification was successful, we can still show success
            setSubscriptionVerified(true);
            setShowSubscriptionAlert(true);
            toast({
              title: "Subscription active",
              description: "Your payment was verified, but we had trouble updating your account. Please contact support if you don't have full access.",
              variant: "default",
            });
          }
        } else {
          setVerificationError("Payment verification failed. The payment may not have been completed successfully.");
          toast({
            title: "Verification failed",
            description: "We couldn't verify your payment. Please contact support.",
            variant: "destructive",
          });
        }
        
        // Remove the session_id from the URL to prevent re-verification on refresh
        navigate(location.pathname, { replace: true });
      } catch (error) {
        console.error('Error in session verification process:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setVerificationError(errorMessage);
        
        // Check if it's a server error from the Edge Function
        if (errorMessage.includes('Server error when updating subscription')) {
          toast({
            title: "Server error",
            description: "There was a server error updating your subscription. Please try again later or contact support.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Verification error",
            description: "There was an error verifying your payment. Please contact support.",
            variant: "destructive",
          });
        }
      } finally {
        setVerifyingSubscription(false);
      }
    } else if (!sessionId) {
      // If no session_id, open payment modal
      setPaymentModalOpen(true);
    }
  };

  // Show subscription status message when component loads
  useEffect(() => {
    if (isSubscribed) {
      setSubscriptionVerified(true);
      setShowSubscriptionAlert(true);
    }
  }, [isSubscribed]);

  // Check if we should open the payment modal (e.g., when redirected from payment success page)
  useEffect(() => {
    if (location.state && location.state.openPaymentModal) {
      setPaymentModalOpen(true);
      // Clear the state to prevent reopening the modal on page refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Open sidebar by default on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load conversations from localStorage on component mount
  useEffect(() => {
    if (user) {
      const userPrefix = `user_${user.id}_`;
      
      // First check if we have user-specific conversations
      const savedConversations = localStorage.getItem(`${userPrefix}conversations`);
      
      if (savedConversations) {
        setConversations(JSON.parse(savedConversations));
      } else {
        // Check for legacy conversations without user prefixes (for migration)
        const legacyConversations = localStorage.getItem('conversations');
        if (legacyConversations) {
          // Migrate legacy conversations to user-specific format
          const parsedConversations = JSON.parse(legacyConversations);
          setConversations(parsedConversations);
          
          // Migrate individual conversation messages
          parsedConversations.forEach((conv: Conversation) => {
            const legacyMessages = localStorage.getItem(`conversation_${conv.id}`);
            if (legacyMessages) {
              localStorage.setItem(`${userPrefix}conversation_${conv.id}`, legacyMessages);
            }
          });
          
          // Save migrated conversations
          localStorage.setItem(`${userPrefix}conversations`, legacyConversations);
          
          console.log('Migrated legacy conversations to user-specific format');
        }
      }
    }
  }, [user]);

  // Save conversations to localStorage when they change
  useEffect(() => {
    if (user) {
      const userPrefix = `user_${user.id}_`;
      localStorage.setItem(`${userPrefix}conversations`, JSON.stringify(conversations));
    }
  }, [conversations, user]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  // Function to create a new presentation
  const createNewConversation = () => {
    // Clear any previously generated audio URL
    setGeneratedAudioUrl(null);
    setIsGeneratingAudio(false);
    setNewConversationModalOpen(true);
  };

  // Function to handle new presentation confirmation from modal
  const handleNewConversationConfirm = async (url?: string) => {
    // Close the modal immediately
    setNewConversationModalOpen(false);
    
    const newId = crypto.randomUUID();
    const newConversation = {
      id: newId,
      title: 'New Presentation',
      date: new Date().toISOString(),
      preview: 'Start a new presentation',
      contextUrl: url,
    };
    
    // Add to the beginning of the array
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newId);
    
    // Clear messages by setting clearMessagesRef to true
    clearMessagesRef.current = true;
    
    // Ensure the sidebar is open when creating a new presentation on mobile
    if (!sidebarOpen) {
      setSidebarOpen(true);
    }
    
    // Save empty messages for the new presentation
    if (user) {
      const userPrefix = `user_${user.id}_`;
      localStorage.setItem(`${userPrefix}conversation_${newId}`, JSON.stringify([]));
    }

    // Generate podcast content if URL is provided
    if (url) {
      setIsGeneratingAudio(true);
      try {
        const userId = user?.id || 'anonymous_user';
        const podcastContent = await getCozePodcastContent(
          `${url}`,
          userId,
          url
        );
        
        // Save the podcast content to PODCAST_CONTENT variable
        setPODCAST_CONTENT(podcastContent);
        
        if (podcastContent) {
          // Extract audio URL from the podcast content
          const audioUrlMatch = podcastContent.match(/https?:\/\/[^\s<>"']+\.(mp3|wav|m4a|ogg|aac)(\?[^\s<>"']*)?/i);
          if (audioUrlMatch) {
            setGeneratedAudioUrl(audioUrlMatch[0]);
            toast({
              title: "Audio generated successfully",
              description: "Your presentation audio is ready to play!",
            });
          } else {
            toast({
              title: "Audio generation completed",
              description: "Podcast content generated, but no audio URL found.",
            });
          }
        } else {
          toast({
            title: "Audio generation failed",
            description: "Could not generate podcast content.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error generating podcast content:', error);
        toast({
          title: "Audio generation failed",
          description: "An error occurred while generating the podcast content.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingAudio(false);
      }
    }
    
    toast({
      title: "New presentation started",
      description: url ? "Generating audio presentation..." : "You can start chatting now!",
    });
  };

  // Function to delete a conversation
  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Remove conversation from localStorage - use user-specific key
    if (user) {
      const userPrefix = `user_${user.id}_`;
      localStorage.removeItem(`${userPrefix}conversation_${id}`);
    }
    
    setConversations(conversations.filter(conv => conv.id !== id));
    
    if (activeConversation === id) {
      setActiveConversation(null);
      clearMessagesRef.current = true;
    }
    
    toast({
      title: "Conversation deleted",
      description: "The conversation has been removed.",
    });
  };
  
  // Function to update conversation details
  const updateConversation = (id: string, title: string, preview: string) => {
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === id 
          ? { ...conv, title, preview, date: new Date().toLocaleDateString() } 
          : conv
      )
    );
  };

  // Function to handle conversation selection
  const handleConversationSelect = (id: string) => {
    // Save current conversation if it exists
    if (activeConversation && user) {
      const userPrefix = `user_${user.id}_`;
      const currentMessages = localStorage.getItem(`${userPrefix}conversation_${activeConversation}`);
      
      // Update the conversation preview with the last user message
      if (currentMessages) {
        const messages = JSON.parse(currentMessages);
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
        const conversationTitle = messages.length > 0 ? messages[0].content.split(' ').slice(0, 5).join(' ') : 'New Presentation';
        updateConversation(activeConversation, conversationTitle, lastUserMessage || 'No user messages');
      }
    }

    // Only set clearMessages if switching to a different conversation
    if (activeConversation !== id) {
      clearMessagesRef.current = false;
      // Clear generated audio URL when switching conversations
      setGeneratedAudioUrl(null);
      setIsGeneratingAudio(false);
    }
    setActiveConversation(id);
    
    // On mobile, automatically close the sidebar after selecting a conversation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // If no active conversation and we have conversations, set the first one as active
  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0].id);
    }
  }, [activeConversation, conversations]);

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.preview.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to handle podcast content generation from AudioBox
  const handlePodcastContentGenerated = (podcastContent: string) => {
    // Update the PODCAST_CONTENT state
    setPODCAST_CONTENT(podcastContent);
    
    // Add the podcast content to the chat history
    if (activeConversation && user) {
      const userPrefix = `user_${user.id}_`;
      const currentMessages = localStorage.getItem(`${userPrefix}conversation_${activeConversation}`);
      
      if (currentMessages) {
        const messages = JSON.parse(currentMessages);
        
        // Add the podcast content as an assistant message
        const newMessages = [
          ...messages,
          {
            role: 'assistant' as const,
            content: `${podcastContent}`
          }
        ];
        
        // Save the updated messages
        localStorage.setItem(`${userPrefix}conversation_${activeConversation}`, JSON.stringify(newMessages));
        
        // Update conversation preview
        const lastUserMessage = [...newMessages].reverse().find(m => m.role === 'user')?.content || '';
        updateConversation(activeConversation, 'Customized Audio Generated', lastUserMessage || 'Audio customization completed');
        
        // Force a reload of messages in DialogueWrapper
        setForceReloadMessages(prev => prev + 1);
        
        toast({
          title: "Podcast content added",
          description: "The customized podcast content has been added to your chat history.",
        });
      }
    }
  };

  return (
    <AnnotationProvider>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Improved Sidebar using the UI component */}
          <SidebarProvider defaultOpen={sidebarOpen} open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <Sidebar className="mt-16 h-[calc(100vh-64px)]">
              <SidebarHeader className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Learn</h2>
                  <SidebarTrigger />
                </div>
                <div className="mt-2">
                  <Button 
                    onClick={createNewConversation} 
                    className="w-full bg-darkGreen-600 hover:bg-darkGreen-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" /> New Presentation
                  </Button>
                </div>
                <div className="mt-2">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      placeholder="Search presentations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9" 
                    />
                  </div>
                </div>
              </SidebarHeader>
              
              <SidebarContent className="px-2">
                {/* Conversations Section */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                    Presentations 
                  </h3>
                  <ScrollArea className="h-[calc(100vh-320px)]">
                    <div className="space-y-1 py-2">
                      {filteredConversations.length > 0 ? (
                        filteredConversations.map((convo) => (
                          <div
                            key={convo.id}
                            className={`
                              flex items-center justify-between rounded-md p-2 cursor-pointer
                              ${activeConversation === convo.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}
                            `}
                            onClick={() => handleConversationSelect(convo.id)}
                          >
                            <div className="flex items-center space-x-3 truncate">
                              <MessageSquare className="h-5 w-5 shrink-0 text-muted-foreground" />
                              <div className="truncate">
                                <p className="text-sm font-medium leading-none">{convo.title}</p>
                                <p className="text-xs text-muted-foreground truncate mt-1">{convo.preview}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100"
                              onClick={(e) => deleteConversation(convo.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
                          <h3 className="mt-2 text-sm font-medium text-foreground">No presentations</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {searchTerm ? 'No prentations match your search' : 'Start a new presentation to begin'}
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </SidebarContent>
              
              <SidebarFooter className="px-4 py-2">
                <div className="flex flex-col space-y-2">
                  <Separator />
                  {!isSubscribed && (
                    <Button 
                      variant="outline" 
                      onClick={() => setPaymentModalOpen(true)}
                      className="w-full"
                    >
                      Upgrade Plan
                    </Button>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-darkGreen-600/20 flex items-center justify-center">
                        {user?.email?.[0].toUpperCase() || 'U'}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleSignOut}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SidebarFooter>
            </Sidebar>
            
            {/* Floating sidebar toggle button that appears when sidebar is collapsed */}
            {!sidebarOpen && (
              <Button
                variant="outline"
                size="icon"
                className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 rounded-full h-10 w-10 shadow-md bg-background hover:bg-accent"
                onClick={() => setSidebarOpen(true)}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
            
            {/* Main content */}
            <div className="flex flex-col overflow-hidden mt-16 w-full h-[calc(100vh-64px)]">
              {/* Content container with max width and auto margins for centering */}
              <div className="w-full max-w-[1000px] mx-auto flex flex-col h-full">
                {/* Mobile sidebar toggle button */}
                <div className="md:hidden p-2 flex items-center justify-between">
                  <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <Menu className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setShowAudioBox(!showAudioBox)}
                    className="ml-2"
                  >
                    <Volume2 className="h-6 w-6" />
                  </Button>
                </div>
                

                
                {/* Notifications section */}
                <div className="mb-4">
                  {/* Subscription alert if verified */}
                  {subscriptionVerified && showSubscriptionAlert && (
                    <Alert className="m-4 mx-auto bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Subscription Activated</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Your subscription is now active. You have unlimited access to all features.
                      </AlertDescription>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2"
                        onClick={() => setShowSubscriptionAlert(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </Alert>
                  )}
                  
                  {/* Error alert if verification failed */}
                  {verificationError && showSubscriptionAlert && (
                    <Alert className="m-4 mx-auto bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-800">Verification Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {verificationError}
                        <Button 
                          className="ml-2 h-8 text-red-700 bg-white hover:bg-red-50"
                          onClick={retryVerification}
                          disabled={verifyingSubscription}
                        >
                          {verifyingSubscription ? "Retrying..." : "Retry"}
                        </Button>
                      </AlertDescription>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2"
                        onClick={() => setShowSubscriptionAlert(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </Alert>
                  )}
                </div>
                
                {/* Main dialogue interface - flex-1 makes it fill available space and flex flex-col makes it stack vertically */}
                <div className="flex-1 px-4 pb-4 flex flex-col h-full overflow-hidden relative">
                  {/* Audio Box - Fixed above chat */}
                  {showAudioBox && (
                    <div className="mb-4">
                      {isGeneratingAudio ? (
                        <div className="max-w-[1000px] mx-auto bg-card border border-border rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-darkGreen-600"></div>
                            <span className="text-sm text-muted-foreground">Generating presentation audio...</span>
                          </div>
                        </div>
                      ) : (
                        <AudioBox 
                          className="max-w-[1000px] mx-auto" 
                          audioUrl={generatedAudioUrl || undefined}
                          onPodcastContentGenerated={handlePodcastContentGenerated}
                          podcastContent={PODCAST_CONTENT}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Chat Interface */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <DialogueWrapper 
                      activeConversation={activeConversation}
                      clearMessages={clearMessagesRef}
                      onUpdateConversation={updateConversation}
                      models={[]}
                      conversationContext={
                        activeConversation 
                          ? conversations.find(c => c.id === activeConversation) 
                          : undefined
                      }
                      podcastContent={PODCAST_CONTENT}
                      forceReloadMessages={forceReloadMessages}
                      onCreateNewPresentation={createNewConversation}
                    />
                  </div>
                  

                </div>
              </div>
            </div>
          </SidebarProvider>
        </div>
        
        {/* Payment modal */}
        <PaymentModal 
          open={paymentModalOpen} 
          onOpenChange={setPaymentModalOpen} 
        />
        
        {/* New presentation modal */}
        <NewConversationModal 
          open={newConversationModalOpen} 
          onOpenChange={setNewConversationModalOpen} 
          onConfirm={handleNewConversationConfirm}
        />
      </div>
    </AnnotationProvider>
  );
};

export default Personal;