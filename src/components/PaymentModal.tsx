import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQueryLimit } from '@/hooks/useQueryLimit';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession, getDirectCheckoutUrl, verifyPaymentSession } from '@/lib/payment-service';
import { checkPaymentSystemStatus, getEstimatedRecoveryTime } from '@/lib/payment-status';
import { useAuth } from '@/lib/auth-context';
import { AlertCircle, RefreshCw, HelpCircle, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabase';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSubscribed } = useQueryLimit();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{available: boolean; message: string; lastChecked: Date} | null>(null);
  const [recoveryTime, setRecoveryTime] = useState<number | null>(null);

  // Redirect to dashboard if user is already subscribed
  useEffect(() => {
    if (open && isSubscribed) {
      toast({
        title: "Already subscribed",
        description: "You already have an active subscription. Redirecting to your dashboard.",
        variant: "default",
      });
      onOpenChange(false);
      navigate('/personal');
    }
  }, [open, isSubscribed, navigate, onOpenChange, toast]);

  // Check payment system status when modal opens or when there's a checkout session error
  useEffect(() => {
    if (open && (errorType === 'checkout_session' || !systemStatus)) {
      checkSystemStatus();
    }
  }, [open, errorType]);

  // Check if user is already subscribed when modal opens
  useEffect(() => {
    if (open && user) {
      checkUserSubscription();
    }
  }, [open, user]);

  // Check if the user already has an active subscription
  const checkUserSubscription = async () => {
    try {
      // Get the user's subscription status from Supabase
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('is_subscribed')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking subscription status:', error);
        return;
      }

      // If user has an active subscription, redirect to personal page
      if (data?.is_subscribed) {
        toast({
          title: "Already subscribed",
          description: "You already have an active subscription. Redirecting to your personal page.",
          variant: "default",
        });
        
        // Close the modal
        onOpenChange(false);
        
        // Redirect to personal page
        navigate('/personal');
      }
    } catch (error) {
      console.error('Error checking user subscription:', error);
    }
  };

  const checkSystemStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const status = await checkPaymentSystemStatus();
      setSystemStatus({
        available: status.isAvailable,
        message: status.message,
        lastChecked: status.lastChecked
      });
      
      // If system is not available, get estimated recovery time
      if (!status.isAvailable) {
        const estimatedTime = await getEstimatedRecoveryTime();
        setRecoveryTime(estimatedTime);
      }
      
      return status; // Return the status object
    } catch (error) {
      console.error('Error checking payment system status:', error);
      return { isAvailable: false, message: 'Error checking payment system', lastChecked: new Date() };
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Handle Stripe checkout
  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);
    setErrorType(null);
    
    try {
      // Check if the payment system is available
      const status = await checkSystemStatus();
      
      // If system is not available, don't proceed
      if (!status.isAvailable) {
        const estimatedTime = await getEstimatedRecoveryTime();
        setRecoveryTime(estimatedTime);
        
        throw new Error(`Payment system unavailable: ${status.message}`);
      }
      
      console.log('Payment system is available, creating checkout session...');
      
      try {
        // Create a Stripe checkout session
        const checkoutUrl = await createCheckoutSession();
        
        // Log success before redirecting
        console.log('Successfully created checkout session, redirecting to:', checkoutUrl);
        
        // Redirect to Stripe checkout
        window.location.href = checkoutUrl;
      } catch (checkoutError: any) {
        console.error('Detailed checkout error:', checkoutError);
        
        // Check if we have a direct checkout URL as fallback
        const directCheckoutUrl = getDirectCheckoutUrl();
        if (directCheckoutUrl) {
          console.log('Using direct checkout URL as fallback:', directCheckoutUrl);
          toast({
            title: "Redirecting to checkout",
            description: "Using alternative checkout method...",
          });
          window.location.href = directCheckoutUrl;
          return;
        }
        
        // Check if it's a network error
        if (checkoutError.message?.includes('net::ERR_FAILED') || 
            checkoutError.code === 'network_error') {
          
          // Log diagnostic information
          console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
          console.log('Function endpoint:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`);
          
          // Try a direct fetch to test connectivity
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/`, {
              method: 'GET',
            });
            console.log('Supabase functions base endpoint test:', response.status);
          } catch (fetchError) {
            console.error('Error testing Supabase functions endpoint:', fetchError);
          }
          
          throw new Error('Network error connecting to payment service. Please check your internet connection or try again later.');
        }
        
        // If it's a timeout error
        if (checkoutError.code === 'request_timeout') {
          throw new Error('Request timed out. The payment service might be experiencing high load. Please try again later.');
        }
        
        // If it's a server error
        if (checkoutError.code === 'server_error') {
          console.error('Server error details:', checkoutError.details);
          throw new Error(`Server error: ${checkoutError.details?.details || 'Internal server error'}`);
        }
        
        // If it's a configuration error
        if (checkoutError.code === 'config_error') {
          console.error('Configuration error details:', checkoutError.details);
          throw new Error(`Payment system configuration error. Please contact support with error code: ${checkoutError.details?.data?.error?.includes('STRIPE') ? 'STRIPE_CONFIG' : 'ENV_CONFIG'}`);
        }
        
        // If it's an authentication error
        if (checkoutError.code === 'authentication_error' || checkoutError.code === 'authentication_required') {
          // Redirect to sign in
          toast({
            title: "Authentication required",
            description: "Please sign in to continue with the payment.",
          });
          onOpenChange(false);
          navigate('/signin', { state: { returnTo: window.location.pathname } });
          return;
        }
        
        // If it's an invalid price ID
        if (checkoutError.code === 'invalid_price') {
          console.error('Invalid price ID details:', checkoutError.details);
          throw new Error(`Configuration error: Invalid price ID. Please contact support with error code: PRICE_CONFIG`);
        }
        
        // If it's an invalid request
        if (checkoutError.code === 'invalid_request') {
          throw new Error(`Invalid request: ${checkoutError.details?.details || 'Please check your payment details'}`);
        }
        
        // If it's an invalid response format
        if (checkoutError.code === 'invalid_response_format') {
          throw new Error('The payment service returned an invalid response format. Please try again later.');
        }
        
        throw checkoutError;
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      // Set specific error message and type based on the error
      let errorMessage = "There was an error processing your payment. Please try again.";
      let errorTypeValue = "general";
      
      if (error.message?.includes('network') || error.code === 'network_error' || error.code === 'network_timeout' || error.code === 'network_offline') {
        errorMessage = "Network error. Please check your internet connection and try again.";
        errorTypeValue = "network";
      } else if (error.message?.includes('timeout') || error.code === 'request_timeout') {
        errorMessage = "Request timed out. The payment service might be experiencing high load. Please try again later.";
        errorTypeValue = "timeout";
      } else if (
        error.message?.includes('checkout session') || 
        error.message?.includes('payment system unavailable') ||
        error.code === 'checkout_creation_failed' || 
        error.code === 'invalid_checkout_response' ||
        error.code === 'empty_response' ||
        error.code === 'service_not_found' ||
        error.code === 'server_error'
      ) {
        errorMessage = error.message || "Unable to create checkout session. Our payment system might be temporarily unavailable.";
        errorTypeValue = "checkout_session";
      } else if (error.code === 'config_error') {
        errorMessage = error.message || "Payment system configuration error. Please contact support.";
        errorTypeValue = "config_error";
        
        // Disable retry button for configuration errors
        setRetryCount(0);
      } else if (error.message?.includes('Supabase') || error.code === 'authorization_error' || error.code === 'authentication_error') {
        errorMessage = "Authentication error. Please try signing out and back in.";
        errorTypeValue = "authentication";
      } else if (error.code === 'cors_error') {
        errorMessage = "Browser security restriction prevented payment processing. Try using a different browser.";
        errorTypeValue = "browser";
      } else if (error.code === 'invalid_request' || error.code === 'invalid_price' || error.code === 'invalid_response_format') {
        errorMessage = error.message || "Invalid payment request. Please check your payment details.";
        errorTypeValue = "invalid_request";
      }
      
      setError(errorMessage);
      setErrorType(errorTypeValue);
      setRetryCount(prev => prev + 1);
      
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const retryPayment = () => {
    setError(null);
    setErrorType(null);
    handleCheckout();
  };

  const handleContactSupport = () => {
    window.open('mailto:support@internta.com?subject=Payment%20Issue&body=I%20encountered%20an%20error%20while%20trying%20to%20upgrade%20to%20premium:%20' + encodeURIComponent(error || ''), '_blank');
  };

  const renderSystemStatus = () => {
    if (!systemStatus) return null;
    
    const formattedTime = systemStatus.lastChecked.toLocaleTimeString();
    
    return (
      <div className="mb-4 text-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="font-medium mr-2">Payment System Status:</span>
            {systemStatus.available ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Available
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unavailable
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-500">Last checked: {formattedTime}</span>
        </div>
        
        {!systemStatus.available && (
          <div className="text-sm text-gray-600 mb-2">
            <p>{systemStatus.message}</p>
            {recoveryTime !== null && (
              <p className="mt-1">
                Estimated recovery time: {recoveryTime > 0 ? `~${recoveryTime} minutes` : 'Unknown'}
              </p>
            )}
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs mt-1 h-8"
          onClick={checkSystemStatus}
          disabled={isCheckingStatus}
        >
          {isCheckingStatus ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Check Again
            </>
          )}
        </Button>
      </div>
    );
  };

  const renderErrorHelp = () => {
    if (errorType === 'checkout_session') {
      return (
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="troubleshooting">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center">
                <HelpCircle className="h-4 w-4 mr-2" />
                Troubleshooting Steps
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="text-sm space-y-2 text-gray-600 list-disc pl-5">
                <li>Wait a few minutes and try again - our payment system might be experiencing temporary issues</li>
                <li>Check if you have any browser extensions that might be blocking the checkout</li>
                <li>Try using a different browser or device</li>
                <li>Make sure your browser is up to date</li>
                <li>If the problem persists, please contact our support team</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    } else if (errorType === 'config_error') {
      return (
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="configuration-error">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Configuration Error
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-sm space-y-2 text-gray-600">
                <p>There is a configuration issue with our payment system. This requires attention from our technical team.</p>
                <p className="font-medium">Please contact support and provide the error message shown above.</p>
                <Button 
                  className="w-full mt-2 flex items-center justify-center gap-2" 
                  variant="outline"
                  onClick={handleContactSupport}
                >
                  <HelpCircle className="h-4 w-4" />
                  Contact Support
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }
    return null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Upgrade to Pro</SheetTitle>
          <SheetDescription>
            Continue your learning journey without limits
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          {renderSystemStatus()}
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              {renderErrorHelp()}
            </Alert>
          )}
          
          <div className="rounded-lg border p-6 mb-6">
            <h3 className="text-xl font-medium mb-4">Edge Science Pro version</h3>
            <div className="flex items-baseline mb-4">
              <span className="text-3xl font-bold">USD 19.99</span>
              <span className="text-neutral-600 ml-2">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Advanced Agentic Dialogues</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Unlimited Presentations</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Join Presentation's Q&A Session</span>
              </li>
            </ul>
          </div>
          
          {error || (systemStatus && !systemStatus.available) ? (
            <div className="space-y-2">
              <Button 
                className="w-full flex items-center justify-center gap-2" 
                onClick={retryPayment}
                disabled={isProcessing || (systemStatus && !systemStatus.available)}
              >
                <RefreshCw className="h-4 w-4" />
                Try Again {retryCount > 1 ? `(${retryCount})` : ''}
              </Button>
              
              <Button 
                className="w-full flex items-center justify-center gap-2" 
                variant="outline"
                onClick={handleContactSupport}
              >
                <HelpCircle className="h-4 w-4" />
                Contact Support
              </Button>
              
              <Button 
                className="w-full" 
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              
              {(errorType === 'checkout_session' || (systemStatus && !systemStatus.available)) && (
                <div className="pt-2 text-xs text-center text-gray-500">
                  <p>You can also try again later when our payment system is back online.</p>
                </div>
              )}
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleCheckout}
              disabled={isProcessing || (systemStatus && !systemStatus.available)}
            >
              {isProcessing ? "Processing..." : "Proceed to Checkout"}
            </Button>
          )}
          
          <p className="text-center text-sm text-neutral-500 mt-4">
            Secure payment processed via Stripe
          </p>
        </div>
        
        <SheetFooter className="sm:justify-start">
          <div className="text-xs text-gray-500">
            <p>Having trouble? <button onClick={handleContactSupport} className="text-blue-600 hover:underline inline-flex items-center">Contact support <ExternalLink className="h-3 w-3 ml-1" /></button></p>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default PaymentModal;
