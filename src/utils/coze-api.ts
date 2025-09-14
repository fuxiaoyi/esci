/**
 * Coze API integration utilities
 */

// Type definitions for API responses
interface CozeMessage {
  content: string;
  role?: string;
}

interface CozeChoice {
  message: CozeMessage;
}

interface CozeResponse {
  choices: CozeChoice[];
}

interface CozeStreamData {
  type: string;
  event?: string;
  content: string;
}

// Default Coze API configuration
export const COZE_API_CONFIG = {
  apiUrl: 'https://api.coze.cn/v3/chat',
  botId: '7425916599011917833',
  apiToken: 'pat_jMVZutQb7SELmZciFWEEypDGMuFcZbxifyH50AGJjONBpRwQoYolc347BHRbsSgG'
};

/**
 * Calls the Coze API with the given input
 * @param input User's message
 * @param userId Unique identifier for the user
 * @param additionalContext Optional URL or context to include
 * @param useStream Whether to use streaming mode (default: false)
 * @param extractOnlyAnswer When streaming, whether to extract only content with type "answer" and event "conversation.message.completed" (default: false)
 * @param onContentCallback Optional callback function to process content as it arrives (used with extractOnlyAnswer)
 * @returns For non-streaming: Promise with response text; 
 *          For streaming with extractOnlyAnswer=false: A readable stream reader;
 *          For streaming with extractOnlyAnswer=true: Promise with extracted content
 */
export const callCozeAPI = async (
  input: string, 
  userId: string,
  additionalContext?: string,
  useStream = false,
  extractOnlyAnswer = false,
  onContentCallback?: (content: string) => void
): Promise<ReadableStreamDefaultReader<Uint8Array> | string | null> => {
  try {
    const { apiUrl, botId, apiToken } = COZE_API_CONFIG;
    
    if (!apiUrl || !botId || !apiToken) {
      console.error('Coze API configuration is missing.');
      return null;
    }
    
    // Prepare the additional messages array
    const additionalMessages = [
      {
        role: 'user',
        content: input,
        content_type: 'text'
      }
    ];
    
    // Add context URL if provided
    if (additionalContext) {
      additionalMessages.unshift({
        role: 'user',
        content: additionalContext,
        content_type: 'text'
      });
    }
    
    const payload = {
      bot_id: botId,
      user_id: userId || 'anonymous_user',
      stream: useStream,
      auto_save_history: true,
      additional_messages: additionalMessages
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    // Handle streaming response
    if (useStream) {
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();

      // If we want to extract only answer content, process the stream
      if (extractOnlyAnswer) {
        return extractAnswerContent(reader, onContentCallback);
      }
      
      // Otherwise return the reader as before
      return reader;
    } 
    // Handle non-streaming response
    else {
      const data = await response.json() as CozeResponse;
      // Extract the content from the response
      if (data && data.choices && data.choices.length > 0 && data.choices[0]?.message) {
        return data.choices[0].message?.content || '';
      }
      return '';
    }
  } catch (error) {
    console.error('Error calling Coze API:', error);
    return null;
  }
};

/**
 * Decodes a stream chunk into a string
 * @param chunk The chunk from the stream
 * @returns The decoded string
 */
export const decodeStreamChunk = (chunk: Uint8Array): string => {
  const decoder = new TextDecoder();
  return decoder.decode(chunk, { stream: true });
}; 

/**
 * Processes stream data and extracts only content from messages with type "answer" and event "conversation.message.completed"
 * @param reader The stream reader from callCozeAPI
 * @param onContentCallback Optional callback function to process content as it arrives
 * @returns Promise with the extracted content
 */
export const extractAnswerContent = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onContentCallback?: (content: string) => void
): Promise<string> => {
  let completeContent = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      const chunkText = decodeStreamChunk(value);
      
      // Split by newlines to process each chunk separately
      const lines = chunkText.split('\n').filter(line => line.trim().startsWith('data:'));
      
      for (const line of lines) {
        try {
          // Extract the JSON part after 'data: '
          const jsonStr = line.substring(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          
          const parsedData = JSON.parse(jsonStr) as CozeStreamData;
          
          // Check if this is an answer message with the completed event
          if (
            parsedData.type === 'answer' && 
            //parsedData.event === 'conversation.message.completed' &&
            parsedData.content
          ) {
            const content = parsedData.content;
            //console.log('Content:', parsedData);

            if (content.length > 0 && content !== completeContent) {
              completeContent += content;
            }

            if (onContentCallback) {
              onContentCallback(completeContent);
            }
          }
        } catch (err) {
          console.error('Error parsing streaming data chunk:', err);
        }
      }
    }
    
    return completeContent;
  } catch (error) {
    console.error('Error processing stream:', error);
    return completeContent;
  } finally {
    reader.releaseLock();
  }
}; 

/**
 * Convenience function that gets only the completed answer content from the Coze API
 * @param input User's message
 * @param userId Unique identifier for the user
 * @param additionalContext Optional URL or context to include
 * @param onContentCallback Optional callback function to process content as it arrives
 * @returns Promise with the content of the message with type "answer" and event "conversation.message.completed"
 */
export const getCozeAnswerContent = async (
  input: string,
  userId: string,
  additionalContext?: string,
  onContentCallback?: (content: string) => void
): Promise<string | null> => {
  return callCozeAPI(
    input,
    userId,
    additionalContext,
    true, // Use streaming
    true, // Extract only answer
    onContentCallback
  ) as Promise<string | null>;
}; 