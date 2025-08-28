// Service for managing questions in the annotation system

export interface NewQuestion {
  question: string;
  answer_a: string;
  answer_b: string;
  model_name: string;
  figure?: File;
}

export interface QuestionData {
  question: string;
  answer_a: string;
  answer_b: string;
  model_name: string;
  id: number;
}

// Function to generate a new unique ID
const generateNewId = (existingData: QuestionData[]): number => {
  if (existingData.length === 0) return 0;
  
  // Find the minimum ID (which should be the most negative number)
  const minId = Math.min(...existingData.map(item => item.id));
  return minId - 1;
};

// Function to add a new question to the data
export const addNewQuestion = async (
  newQuestion: NewQuestion,
  existingData: QuestionData[]
): Promise<QuestionData> => {
  // Generate new ID
  const newId = generateNewId(existingData);
  
  // Create the new question object
  const questionData: QuestionData = {
    question: newQuestion.question,
    answer_a: newQuestion.answer_a,
    answer_b: newQuestion.answer_b,
    model_name: newQuestion.model_name,
    id: newId
  };

  // Handle file upload if provided
  if (newQuestion.figure) {
    try {
      // For now, we'll just log the file info
      // In a real application, you'd upload this to a server
      console.log('File to upload:', {
        name: newQuestion.figure.name,
        size: newQuestion.figure.size,
        type: newQuestion.figure.type
      });
      
      // You could add the figure filename to the question if needed
      // questionData.figure = newQuestion.figure.name;
    } catch (error) {
      console.error('Error handling file upload:', error);
    }
  }

  // Add to existing data
  const updatedData = [questionData, ...existingData];
  
  // Save to localStorage for persistence
  try {
    localStorage.setItem('internta-questions-data', JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }

  return questionData;
};

// Function to get all questions (combines localStorage with original data.json)
export const getAllQuestions = async (): Promise<QuestionData[]> => {
  try {
    // First, try to get the original data.json
    const response = await fetch('/data.json');
    let originalData: QuestionData[] = [];
    
    if (response.ok) {
      originalData = await response.json();
    }
    
    // Then get any additional questions from localStorage
    const localData = localStorage.getItem('internta-questions-data');
    let additionalData: QuestionData[] = [];
    
    if (localData) {
      try {
        additionalData = JSON.parse(localData);
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
      }
    }
    
    // Combine the data, ensuring no duplicates by ID
    const combinedData = [...additionalData, ...originalData];
    
    // Remove duplicates by ID (keep the first occurrence)
    const uniqueData = combinedData.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    return uniqueData;
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
};

// Function to save questions to a file (for development/testing purposes)
export const exportQuestionsToFile = (questions: QuestionData[]): void => {
  const dataStr = JSON.stringify(questions, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'updated-data.json';
  link.click();
  
  URL.revokeObjectURL(link.href);
};
