import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidResetLink, setIsValidResetLink] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Check if we have a valid session from the password reset link
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        setIsValidResetLink(false);
        toast({
          variant: "destructive",
          title: "Invalid or expired link",
          description: "Please request a new password reset link.",
        });
      }
    };
    
    checkSession();
  }, [toast]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
      
      // Redirect to sign in page
      navigate('/signin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password update failed",
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidResetLink) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
              <p className="text-gray-600">
                This password reset link is invalid or has expired.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <Button asChild className="px-8 h-11 bg-darkGreen-600 hover:bg-darkGreen-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200">
              <Link to="/reset-password">Request a new reset link</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Update your password</h1>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">New Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      className="h-11 px-4 border-gray-300 focus:border-darkGreen-500 focus:ring-darkGreen-500" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Confirm New Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
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
              {isLoading ? "Updating password..." : "Update password"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default UpdatePassword; 