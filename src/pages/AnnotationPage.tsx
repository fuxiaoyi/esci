import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useQueryLimit } from '@/hooks/useQueryLimit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarInset, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarSeparator, 
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Target, 
  CheckCircle, 
  Clock, 
  BarChart3,
  User,
  Plus
} from 'lucide-react';
import Header from '@/components/Header';
import AnnotationSystem from '@/components/AnnotationSystem';
import AnnotationProgress from '@/components/AnnotationProgress';
import { AnnotationProvider } from '@/contexts/AnnotationContext';
import { useAnnotation } from '@/contexts/AnnotationContext';
import { QuestionInputModal } from '@/components/QuestionInputModal';

// New child component for sidebar and dropdown logic
function AnnotationSidebarWithDropdown({ sidebarOpen, setSidebarOpen, user, isSubscribed, handleSignOut }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { data } = useAnnotation();

  // Compute matches for dropdown
  const matches =
    searchTerm.trim().length > 0
      ? data.filter((item) =>
          item.model_name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
      : [];

  // Unique part names for dropdown (if you want to show suggestions)
  const uniqueModelNames = Array.from(
    new Set(
      data
        .map((item) => item.model_name)
        .filter((name) =>
          name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
    )
  );

  return (
    <SidebarProvider defaultOpen={sidebarOpen} open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar className="mt-16 h-[calc(100vh-64px)]">
        <SidebarHeader className="px-4 py-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Practice</h2>
            <SidebarTrigger />
          </div>
          <div className="mt-2">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                placeholder="Search part ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className="w-full pl-9"
              />
              {/* Dropdown for part name search */}
              {showDropdown && searchTerm.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-60 overflow-auto">
                  <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b">
                    {matches.length > 0 ? (
                      <span>
                        {matches.length} item{matches.length > 1 ? 's' : ''} matched for <span className="font-mono bg-gray-100 px-1 rounded">{searchTerm}</span>
                      </span>
                    ) : (
                      <span>No matches for <span className="font-mono bg-gray-100 px-1 rounded">{searchTerm}</span></span>
                    )}
                  </div>
                  {uniqueModelNames.length > 0 && (
                    <ul>
                      {uniqueModelNames.slice(0, 10).map((name) => (
                        <li
                          key={name}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800"
                          onMouseDown={() => {
                            setSearchTerm(name);
                            setShowDropdown(false);
                          }}
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Actions section hidden - Add Question button removed */}
          {/* <SidebarGroup>
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <QuestionInputModal>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </QuestionInputModal>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator /> */}

          <SidebarGroup>
            <SidebarGroupLabel>Progress</SidebarGroupLabel>
            <SidebarGroupContent>
              <AnnotationProgress filterTerm={searchTerm} />
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

        </SidebarContent>

        <SidebarFooter className="px-4 py-2">
          <div className="flex items-center gap-2 p-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isSubscribed ? 'Pro Plan' : 'Free Plan'}
                </p>
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
      <SidebarInset>
        <AnnotationSystem filterTerm={searchTerm} />
      </SidebarInset>
    </SidebarProvider>
  );
}

const AnnotationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { isSubscribed } = useQueryLimit();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  return (
    <AnnotationProvider>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <AnnotationSidebarWithDropdown
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            user={user}
            isSubscribed={isSubscribed}
            handleSignOut={handleSignOut}
          />
        </div>
      </div>
    </AnnotationProvider>
  );
};

export default AnnotationPage; 