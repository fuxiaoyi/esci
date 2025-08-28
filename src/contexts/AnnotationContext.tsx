import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  saveUserAnnotation, 
  getUserAnnotations, 
  getUserAnnotation,
  type UserAnnotation,
  type AnnotationInput 
} from '@/lib/annotation-service';
import { 
  addNewQuestion, 
  getAllQuestions, 
  type NewQuestion, 
  type QuestionData 
} from '@/lib/question-service';

// Define the data structure
interface AnnotationData {
  question: string;
  answer_a: string;
  answer_b: string;
  model_name: string;
  id: number;
}

interface AnnotationContextType {
  // Data
  data: AnnotationData[];
  loading: boolean;
  error: string | null;
  
  // Progress
  currentQuestionIndex: number;
  annotations: Record<number, any>;
  answeredCount: number;
  totalCount: number;
  remainingCount: number;
  progressPercentage: number;
  
  // Actions
  setCurrentQuestionIndex: (index: number) => void;
  addAnnotation: (questionId: number, annotation: any) => void;
  getAnnotation: (questionId: number) => any;
  jumpToQuestion: (questionNumber: number) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  loadUserAnnotations: () => Promise<void>;
  saveAnnotationsToDatabase: () => Promise<void>;
  addNewQuestion: (newQuestion: NewQuestion) => Promise<void>;
}

const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined);

export const useAnnotation = () => {
  const context = useContext(AnnotationContext);
  if (context === undefined) {
    throw new Error('useAnnotation must be used within an AnnotationProvider');
  }
  return context;
};

interface AnnotationProviderProps {
  children: ReactNode;
}

export const AnnotationProvider: React.FC<AnnotationProviderProps> = ({ children }) => {
  const [data, setData] = useState<AnnotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [annotations, setAnnotations] = useState<Record<number, any>>({});
  const { user } = useAuth();

  // Load data from JSON file
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data.json');
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load user annotations when user changes or data loads
  useEffect(() => {
    if (data.length > 0) {
      loadUserAnnotations();
    }
  }, [user, data]);

  // Load user annotations from database or localStorage
  const loadUserAnnotations = async () => {
    if (user) {
      // Load from database for authenticated users
      try {
        const userAnnotations = await getUserAnnotations(user.id);
        const annotationsMap: Record<number, any> = {};
        
        userAnnotations.forEach((annotation: UserAnnotation) => {
          annotationsMap[annotation.question_id] = {
            answer: annotation.answer,
            comments: annotation.comments || '',
            timestamp: annotation.timestamp
          };
        });
        
        setAnnotations(annotationsMap);
      } catch (error) {
        console.error('Error loading user annotations:', error);
      }
    } else {
      // Load from localStorage for non-authenticated users
      try {
        const savedAnnotations = localStorage.getItem('internta-annotations');
        if (savedAnnotations) {
          setAnnotations(JSON.parse(savedAnnotations));
        }
      } catch (error) {
        console.error('Error loading annotations from localStorage:', error);
      }
    }
  };

  // Save annotations to database or localStorage
  const saveAnnotationsToDatabase = async () => {
    if (user) {
      // Save to database for authenticated users
      try {
        const annotationPromises = Object.entries(annotations).map(([questionId, annotation]) => {
          const annotationInput: AnnotationInput = {
            question_id: parseInt(questionId),
            answer: annotation.answer,
            comments: annotation.comments
          };
          return saveUserAnnotation(user.id, annotationInput);
        });
        
        await Promise.all(annotationPromises);
        console.log('Annotations saved to database successfully');
      } catch (error) {
        console.error('Error saving annotations to database:', error);
      }
    } else {
      // Save to localStorage for non-authenticated users
      try {
        localStorage.setItem('internta-annotations', JSON.stringify(annotations));
      } catch (error) {
        console.error('Error saving annotations to localStorage:', error);
      }
    }
  };

  // Calculate derived values
  const answeredCount = Object.keys(annotations).length;
  const totalCount = data.length;
  const remainingCount = totalCount - answeredCount;
  const progressPercentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  // Actions
  const addAnnotation = async (questionId: number, annotation: any) => {
    const newAnnotation = {
      ...annotation,
      timestamp: new Date().toISOString()
    };

    setAnnotations(prev => ({
      ...prev,
      [questionId]: newAnnotation
    }));

    // Save to database immediately for authenticated users
    if (user) {
      try {
        const annotationInput: AnnotationInput = {
          question_id: questionId,
          answer: annotation.answer,
          comments: annotation.comments
        };
        await saveUserAnnotation(user.id, annotationInput);
      } catch (error) {
        console.error('Error saving annotation to database:', error);
      }
    } else {
      // Save to localStorage for non-authenticated users
      try {
        const updatedAnnotations = {
          ...annotations,
          [questionId]: newAnnotation
        };
        localStorage.setItem('internta-annotations', JSON.stringify(updatedAnnotations));
      } catch (error) {
        console.error('Error saving annotation to localStorage:', error);
      }
    }
  };

  const getAnnotation = (questionId: number) => {
    return annotations[questionId];
  };

  const jumpToQuestion = (questionNumber: number) => {
    if (questionNumber >= 1 && questionNumber <= data.length) {
      setCurrentQuestionIndex(questionNumber - 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < data.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Add new question to the data
  const addNewQuestionToContext = async (newQuestion: NewQuestion) => {
    try {
      const questionData = await addNewQuestion(newQuestion, data);
      
      // Update the local data state
      setData(prevData => [questionData, ...prevData]);
      
      // Reset to the first question (the newly added one)
      setCurrentQuestionIndex(0);
      
      console.log('New question added successfully:', questionData);
    } catch (error) {
      console.error('Error adding new question:', error);
      throw error;
    }
  };

  const value: AnnotationContextType = {
    data,
    loading,
    error,
    currentQuestionIndex,
    annotations,
    answeredCount,
    totalCount,
    remainingCount,
    progressPercentage,
    setCurrentQuestionIndex,
    addAnnotation,
    getAnnotation,
    jumpToQuestion,
    goToPrevious,
    goToNext,
    loadUserAnnotations,
    saveAnnotationsToDatabase,
    addNewQuestion: addNewQuestionToContext,
  };

  return (
    <AnnotationContext.Provider value={value}>
      {children}
    </AnnotationContext.Provider>
  );
}; 