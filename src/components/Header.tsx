import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import logo from '@/assets/logo.svg';
import { User, Target } from 'lucide-react';

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
  onSignOut?: () => void;
}

const Header = ({ onSignOut }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine if user is logged in based on auth context
  const isLoggedIn = !!user;
  
  // Get user's display name or email
  const userDisplayName = user?.user_metadata?.name || user?.email || '';
  
  // Get user's initials for the avatar
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split('@')[0] // Remove email domain if it's an email
      .split(/\s+/) // Split by whitespace
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2) // Take first two initials
      .join('');
  };
  
  const userInitials = getInitials(userDisplayName);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      // Use auth context's signOut function
      signOut();
    }
  };

  const handleAvatarClick = () => {
    navigate('/personal');
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-6 h-16 transition-all duration-300 ease-in-out flex items-center",
        scrolled ? "bg-background/80 shadow-sm backdrop-blur-md" : "bg-background border-b border-border"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
        <Link 
          to="/" 
          className="group flex items-center space-x-2"
        >
          <img 
            src={logo} 
            alt="Edge Science Logo" 
            className="w-8 h-8 transition-transform group-hover:scale-105"
          />
          <span className="text-xl font-medium tracking-tight relative inline-flex items-center">
            Edge Science
            <span className="text-primary">.</span>
          </span>
        </Link>
        
        {!isLoggedIn && (
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#about">About</NavLink>
            <NavLink href="#dialogues">Dialogues</NavLink>
          </nav>
        )}
        
        {isLoggedIn && (
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/personal"
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === '/personal'
                  ? "bg-darkGreen-100 text-darkGreen-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <User className="h-4 w-4" />
              <span>Learn</span>
            </Link>
            <Link
              to="/annotation"
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === '/annotation'
                  ? "bg-darkGreen-100 text-darkGreen-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Target className="h-4 w-4" />
              <span>Practice</span>
            </Link>
          </nav>
        )}
        
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <div className="flex items-center space-x-3">
              <div 
                className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAvatarClick}
              >
                <div className="w-8 h-8 rounded-full bg-darkGreen-600 flex items-center justify-center text-white font-medium">
                  {userInitials}
                </div>
                <span className="text-sm font-medium text-foreground hidden md:inline">
                  {userDisplayName.split('@')[0]}
                </span>
              </div>
              <button 
                onClick={handleSignOut}
                className="px-4 py-2 bg-darkGreen-600 text-white rounded-full text-sm font-medium transition-all hover:bg-darkGreen-700"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              {/* <Link to="/signin" className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-accent">
                Sign In
              </Link>
              <Link to="/signup" className="px-4 py-2 bg-darkGreen-600 text-white rounded-full text-sm font-medium transition-all hover:bg-darkGreen-700">
                Sign Up
              </Link> */}
              <Link to="/signin" className="px-4 py-2 bg-darkGreen-600 text-white rounded-full text-sm font-medium transition-all hover:bg-darkGreen-700">
                Sign In 
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a 
      href={href} 
      className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm font-medium"
    >
      {children}
    </a>
  );
};

export default Header;
