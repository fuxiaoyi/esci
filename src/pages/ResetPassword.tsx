import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import logo from '@/assets/logo.svg';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type FormValues = z.infer<typeof formSchema>;

const ResetPassword = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      // Request password reset with Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${import.meta.env.VITE_APP_URL}/update-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setIsSubmitted(true);
      
      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-darkGreen-50 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm">
        <div className="text-center">
          <Link 
            to="/" 
            className="mx-auto mb-6 inline-flex items-center space-x-2"
          >
            <img src={logo} alt="Edge Science Logo" className="h-10 w-10" />
            <span className="text-2xl font-bold tracking-tight relative inline-flex items-center">
              Edge Science
              <span className="text-darkGreen-600">.</span>
            </span>
          </Link>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset your password</h1>
            <p className="text-gray-600">
              Enter your email to receive a password reset link
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-6">
            <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-green-800">
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <p className="font-medium text-lg">Password reset email sent!</p>
              <p className="text-sm mt-2 text-green-700">Please check your email for a link to reset your password.</p>
            </div>
            <Button asChild className="px-8 h-11 bg-darkGreen-600 hover:bg-darkGreen-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200">
              <Link to="/signin">Return to sign in</Link>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Email address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="you@example.com" 
                        className="h-11 px-4 border-gray-300 focus:border-darkGreen-500 focus:ring-darkGreen-500" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-darkGreen-600 hover:bg-darkGreen-700 text-white font-medium text-base shadow-sm hover:shadow-md transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Sending reset link..." : "Send reset link"}
              </Button>
            </form>
          </Form>
        )}

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-600">
            Remember your password?{' '}
            <Link to="/signin" className="font-medium text-darkGreen-600 hover:text-darkGreen-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 
