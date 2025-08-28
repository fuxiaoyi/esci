import React, { useState } from 'react';
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
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      // Register user with Supabase
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Check if email confirmation is required
      if (authData?.user && authData.session) {
        // User is already confirmed and logged in
        toast({
          title: "Account created!",
          description: "You have been successfully signed up and logged in.",
        });
        
        // Redirect to personal page with active session
        navigate('/personal');
      } else {
        // Email confirmation is required
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account. You'll be redirected to your personal page after confirmation.",
        });
        
        // Set up a listener for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            // User has confirmed email and is now signed in
            toast({
              title: "Email confirmed!",
              description: "You are now logged in.",
            });
            
            // Redirect to personal page
            navigate('/personal');
            
            // Clean up listener
            authListener.subscription.unsubscribe();
          }
        });
        
        // Redirect to sign in page for now
        navigate('/signin');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-600">
              Join Edge Science and start your enzyme design journey
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
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
                  <FormLabel className="text-sm font-medium text-gray-700">Confirm Password</FormLabel>
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
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-darkGreen-600 hover:text-darkGreen-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
