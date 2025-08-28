/**
 * Coze API integration utilities
 */

// Default Coze API configuration
export const COZE_API_CONFIG = {
  apiUrl: import.meta.env.VITE_COZE_API_URL || 'https://api.coze.cn/v3/chat',
  botId: import.meta.env.VITE_COZE_BOT_ID || '7490552815795191827',
  apiToken: import.meta.env.VITE_COZE_API_TOKEN || ''
};

// Default Coze API configuration
export const COZE_PODCAST_CONFIG = {
  apiUrl: import.meta.env.VITE_COZE_API_URL || 'https://api.coze.cn/v3/chat',
  botId: import.meta.env.VITE_COZE_PODCAST_ID || '7425916599011917833',
  apiToken: import.meta.env.VITE_COZE_API_TOKEN || ''
};

/**
 * Calls the Coze API with the given input
 * @param input User's message
 * @param userId Unique identifier for the user
 * @param additionalContext Optional URL or context to include
 * @param useStream Whether to use streaming mode (default: false)
 * @param extractOnlyAnswer When streaming, whether to extract only content with type "answer" and event "conversation.message.completed" (default: false)
 * @param onContentCallback Optional callback function to process content as it arrives (used with extractOnlyAnswer)
 * @param config Optional configuration object (default: COZE_API_CONFIG)
 * @returns For non-streaming: Promise with response text; 
 *          For streaming with extractOnlyAnswer=false: A readable stream reader;
 *          For streaming with extractOnlyAnswer=true: Promise with extracted content
 */
export const callCozeAPI = async (
  input: string, 
  userId: string,
  additionalContext?: string,
  useStream: boolean = false,
  extractOnlyAnswer: boolean = false,
  onContentCallback?: (content: string) => void,
  config: typeof COZE_API_CONFIG = COZE_API_CONFIG
): Promise<ReadableStreamDefaultReader<Uint8Array> | string | null> => {
  try {
    const { apiUrl, botId, apiToken } = config;
    
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
      const data = await response.json();
      // Extract the content from the response
      if (data && data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content || '';
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
          
          const parsedData = JSON.parse(jsonStr);
          
          // Check if this is an answer message with the completed event
          if (
            parsedData.type === 'answer' && 
            //parsedData.event === 'conversation.message.completed' &&
            parsedData.content
          ) {
            const content = parsedData.content;
            console.log('Content:', parsedData);

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
 * @param config Optional configuration object (default: COZE_API_CONFIG)
 * @returns Promise with the content of the message with type "answer" and event "conversation.message.completed"
 */
export const getCozeAnswerContent = async (
  input: string,
  userId: string,
  additionalContext?: string,
  onContentCallback?: (content: string) => void,
  config: typeof COZE_API_CONFIG = COZE_API_CONFIG
): Promise<string | null> => {
  return callCozeAPI(
    input,
    userId,
    additionalContext,
    true, // Use streaming
    true, // Extract only answer
    onContentCallback,
    config
  ) as Promise<string | null>;
}; 

/**
 * Processes stream data and extracts only content from messages with type "podcast" and event "conversation.message.completed"
 * @param reader The stream reader from callCozeAPI
 * @param onContentCallback Optional callback function to process content as it arrives
 * @returns Promise with the extracted podcast content
 */
export const extractPodcastContent = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onContentCallback?: (content: string) => void
): Promise<string> => {
  let completeContent = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = decodeStreamChunk(value);
      const lines = chunkText.split('\n').filter(line => line.trim().startsWith('data:'));
      for (const line of lines) {
        try {
          const jsonStr = line.substring(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          const parsedData = JSON.parse(jsonStr);
          console.log('Parsed data:', parsedData);
          if (
            parsedData.type === 'answer' &&
            // parsedData.event === 'conversation.message.completed' &&
            parsedData.content
          ) {
            const content = parsedData.content;
            if (content.length > 0 && content !== completeContent) {
              completeContent += content;
            }
            if (onContentCallback) {
              onContentCallback(completeContent);
            }
          }
        } catch (err) {
          console.error('Error parsing streaming podcast data chunk:', err);
        }
      }
    }
    return completeContent;
  } catch (error) {
    console.error('Error processing podcast stream:', error);
    return completeContent;
  } finally {
    reader.releaseLock();
  }
};

/**
 * Extracts audio player URL from podcast content
 * @param podcastContent The podcast content string
 * @returns The audio URL if found, null otherwise
 */
export const extractAudioUrl = (podcastContent: string): string | null => {
  console.log('Extracting audio URL from podcast content:', podcastContent);
  if (!podcastContent) return null;
  
  // Common patterns for audio URLs in podcast responses
  const urlPatterns = [
    // HTML audio player src attribute
    /<audio[^>]*src=["']([^"']+)["'][^>]*>/i,
    // Direct audio file URLs
    /https?:\/\/[^\s<>"']+\.(mp3|wav|m4a|ogg|aac)(\?[^\s<>"']*)?/i,
    // Audio player iframe src
    /<iframe[^>]*src=["']([^"']+)["'][^>]*>/i,
    // Audio player embed patterns
    /audio-player["']?\s*:\s*["']([^"']+)["']/i,
    /player-url["']?\s*:\s*["']([^"']+)["']/i
  ];
  
  for (const pattern of urlPatterns) {
    const match = podcastContent.match(pattern);
    if (match) {
      // Always return the full match, not the captured group
      return match[0];
    }
  }
  
  // If no specific patterns match, try to find any URL that might be audio
  const genericUrlMatch = podcastContent.match(/https?:\/\/[^\s<>"']+/i);
  if (genericUrlMatch) {
    return genericUrlMatch[0];
  }
  
  return null;
};

/**
 * Processes stream data and extracts only the audio URL from podcast messages
 * @param reader The stream reader from callCozeAPI
 * @param onContentCallback Optional callback function to process content as it arrives
 * @returns Promise with the extracted audio URL
 */
export const extractPodcastAudioUrl = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onContentCallback?: (content: string) => void
): Promise<string | null> => {
  const podcastContent = await extractPodcastContent(reader, onContentCallback);
  const url = extractAudioUrl(podcastContent);
  console.log("Extracted audio URL:", url);
  return url;
};

/**
 * Convenience function that gets only the completed podcast content from the Coze API
 * @param input User's message
 * @param userId Unique identifier for the user
 * @param additionalContext Optional URL or context to include
 * @param onContentCallback Optional callback function to process content as it arrives
 * @param config Optional configuration object (default: COZE_PODCAST_CONFIG)
 * @returns Promise with the content of the message with type "podcast" and event "conversation.message.completed"
 */
export const getCozePodcastContent = async (
  input: string,
  userId: string,
  additionalContext?: string,
  onContentCallback?: (content: string) => void,
  config: typeof COZE_PODCAST_CONFIG = COZE_PODCAST_CONFIG
): Promise<string | null> => {
  // We need to call callCozeAPI with a custom extract function for podcast
  return callCozeAPI(
    input,
    userId,
    additionalContext,
    true, // Use streaming
    false, // Don't use extractOnlyAnswer, we'll handle podcast extraction
    undefined, // No onContentCallback for callCozeAPI, handled in extractPodcastContent
    config
  ).then(async (readerOrString) => {
    if (readerOrString && typeof (readerOrString as any).read === 'function') {
      // It's a stream reader
      return extractPodcastContent(readerOrString as ReadableStreamDefaultReader<Uint8Array>, onContentCallback);
    } else if (typeof readerOrString === 'string') {
      // Fallback: just return the string
      return readerOrString;
    }
    return null;
  });
};

/**
 * Convenience function that gets only the audio URL from the podcast API response
 * @param input User's message
 * @param userId Unique identifier for the user
 * @param additionalContext Optional URL or context to include
 * @param onContentCallback Optional callback function to process content as it arrives
 * @param config Optional configuration object (default: COZE_PODCAST_CONFIG)
 * @returns Promise with the audio URL from the podcast response
 */
export const getCozePodcastAudioUrl = async (
  input: string,
  userId: string,
  additionalContext?: string,
  onContentCallback?: (content: string) => void,
  config: typeof COZE_PODCAST_CONFIG = COZE_PODCAST_CONFIG
): Promise<string | null> => {
  // We need to call callCozeAPI with a custom extract function for podcast
  return callCozeAPI(
    input,
    userId,
    additionalContext,
    true, // Use streaming
    false, // Don't use extractOnlyAnswer, we'll handle podcast extraction
    undefined, // No onContentCallback for callCozeAPI, handled in extractPodcastAudioUrl
    config
  ).then(async (readerOrString) => {
    if (readerOrString && typeof (readerOrString as any).read === 'function') {
      console.log('It\'s a stream reader');// It's a stream reader
      return extractPodcastAudioUrl(readerOrString as ReadableStreamDefaultReader<Uint8Array>, onContentCallback);
    } else if (typeof readerOrString === 'string') {
      console.log('Fallback: try to extract audio URL from string');// Fallback: try to extract audio URL from string
      return extractAudioUrl(readerOrString);
    }
    return null;
  });
}; 