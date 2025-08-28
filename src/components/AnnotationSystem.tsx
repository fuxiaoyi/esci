import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, X, ChevronRight, ChevronLeft, Search, Mail } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAnnotation } from '@/contexts/AnnotationContext';
import UserAnnotationStats from '@/components/UserAnnotationStats';
import IgemSummary from './IgemSummary';
import { marked } from 'marked';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

// Add custom styles for markdown content
const markdownStyles = `
  .markdown-content {
    line-height: 1.8;
  }
  .markdown-content h1, .markdown-content h2, .markdown-content h3 {
    color: #2c3e50;
    margin-top: 20px;
    margin-bottom: 15px;
  }
  .markdown-content p {
    margin-bottom: 15px;
  }
  .markdown-content code {
    background: #f1f3f4;
    padding: 3px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
  .markdown-content .MathJax {
    font-size: 1.1em;
  }
  .markdown-content pre {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    overflow-x: auto;
  }
  .markdown-content blockquote {
    border-left: 4px solid #007bff;
    padding-left: 15px;
    margin: 15px 0;
    color: #6c757d;
  }
  .markdown-content ul, .markdown-content ol {
    margin-bottom: 15px;
    padding-left: 20px;
  }
  .markdown-content li {
    margin-bottom: 5px;
  }
`;

// Define the data structure
interface AnnotationData {
  question: string;
  answer_a: string;
  answer_b: string;
  model_name: string;
  id: number;
}

interface AnnotationSystemProps {
  filterTerm: string;
}

const AnnotationSystem: React.FC<AnnotationSystemProps> = ({ filterTerm }) => {
  const {
    data,
    loading,
    error,
    currentQuestionIndex,
    annotations,
    setCurrentQuestionIndex,
    addAnnotation,
    getAnnotation,
    jumpToQuestion: contextJumpToQuestion,
    goToPrevious: contextGoToPrevious,
    goToNext: contextGoToNext,
  } = useAnnotation();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [comments, setComments] = useState('');
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [markdownUrl, setMarkdownUrl] = useState<string | null>(null);
  const markdownUrlRef = useRef<string | null>(null);
  const [markdownBlob, setMarkdownBlob] = useState<Blob | null>(null);

  // State for web link modal
  const [webLink, setWebLink] = useState<string | null>(null);
  const [showWebLinkModal, setShowWebLinkModal] = useState(false);
  const webLinkInputRef = useRef<HTMLInputElement>(null);

  // Filtered data by model_name (partial, case-insensitive)
  const filteredData = filterTerm.trim().length > 0
    ? data.filter(q => q.model_name?.toLowerCase().includes(filterTerm.trim().toLowerCase()))
    : data;

  // Map from filtered index to original index
  const filteredIndexes = filteredData.map(q => data.findIndex(d => d.id === q.id));

  // Adjust currentQuestionIndex to filtered list
  const filteredCurrentIndex = filteredIndexes.indexOf(currentQuestionIndex);
  const currentFilteredQuestion = filteredData[filteredCurrentIndex] || filteredData[0];

  // Filtered annotations for stats
  const filteredAnnotations = Object.fromEntries(
    Object.entries(annotations).filter(([id]) =>
      filteredData.some(q => String(q.id) === id)
    )
  );

  const currentQuestion = data[currentQuestionIndex];

  // Load previous annotation when question changes
  useEffect(() => {
    if (currentQuestion) {
      const annotation = getAnnotation(currentQuestion.id);
      setSelectedAnswer(annotation?.answer || '');
      setComments(annotation?.comments || '');
    }
  }, [currentQuestionIndex, currentQuestion, getAnnotation]);

  // When selectedModel or data changes, ensure currentQuestionIndex is valid for filteredData
  useEffect(() => {
    if (filteredData.length === 0) return;
    // If currentQuestionIndex is not in filteredData, reset to first
    const isCurrentInFiltered = filteredData.some(q => q.id === data[currentQuestionIndex]?.id);
    const firstFilteredIndex = data.findIndex(q => q.id === filteredData[0].id);
    if (!isCurrentInFiltered && currentQuestionIndex !== firstFilteredIndex) {
      setCurrentQuestionIndex(firstFilteredIndex);
    }
  }, [filterTerm, data, currentQuestionIndex, filteredData]);

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const saveAnnotation = async () => {
    if (selectedAnswer && currentFilteredQuestion) {
      setIsSaving(true);
      try {
        await addAnnotation(currentFilteredQuestion.id, {
          answer: selectedAnswer,
          comments,
        });
      } catch (error) {
        console.error('Error saving annotation:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const saveAndNext = async () => {
    await saveAnnotation();
    if (filteredCurrentIndex < filteredData.length - 1) {
      setCurrentQuestionIndex(data.findIndex(q => q.id === filteredData[filteredCurrentIndex + 1].id));
      setSelectedAnswer('');
      setComments('');
    } else {
      setShowCompletion(true);
    }
  };

  const saveAndStay = async () => {
    await saveAnnotation();
  };

  const goToPrevious = () => {
    if (filteredCurrentIndex > 0) {
      setCurrentQuestionIndex(data.findIndex(q => q.id === filteredData[filteredCurrentIndex - 1].id));
    }
  };

  const jumpToQuestion = () => {
    const questionNumber = parseInt(jumpInput);
    if (questionNumber >= 1 && questionNumber <= filteredData.length) {
      setCurrentQuestionIndex(data.findIndex(q => q.id === filteredData[questionNumber - 1].id));
      setJumpInput('');
    }
  };

  const toggleQuestionList = () => {
    setShowQuestionList(!showQuestionList);
  };

  const finishAnnotation = async () => {
    await saveAnnotation();
    setShowCompletion(true);
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'annotation_results.json';
    link.click();
  };

  const downloadResultsCSV = () => {
    const csvContent = [
      'Question ID,Answer,Comments,Timestamp',
      ...Object.entries(annotations).map(([id, annotation]) => 
        `${id},"${annotation.answer}","${annotation.comments}",${annotation.timestamp}`
      )
    ].join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'annotation_results.csv';
    link.click();
  };

  // Generate and cache the markdown Blob URL
  const generateMarkdownUrl = () => {
    // Helper to escape markdown special characters in comments
    const escapeMd = (text: string) =>
      text?.replace(/([*_`~])/g, '\\$1') || '';

    const lines: string[] = [];
    filteredData.forEach((q, idx) => {
      const annotation = filteredAnnotations[q.id];
      if (!annotation) return;
      const { answer, comments } = annotation;
      lines.push(`# Q${idx + 1}:`);
      lines.push(`**Question:**`);
      lines.push(q.question);
      lines.push('');
      if (answer === 'both_correct') {
        lines.push('**Merged Solution:**');
        lines.push(q.answer_a);
        lines.push('');
        lines.push(q.answer_b);
        if (comments?.trim()) {
          lines.push('');
          lines.push('**Comments:**');
          lines.push(escapeMd(comments));
        }
      } else if (answer === 'a_better') {
        lines.push('**Selected Solution A:**');
        lines.push(q.answer_a);
        if (comments?.trim()) {
          lines.push('');
          lines.push('**Comments:**');
          lines.push(escapeMd(comments));
        }
      } else if (answer === 'b_better') {
        lines.push('**Selected Solution B:**');
        lines.push(q.answer_b);
        if (comments?.trim()) {
          lines.push('');
          lines.push('**Comments:**');
          lines.push(escapeMd(comments));
        }
      } else if (answer === 'not_sure') {
        if (comments?.trim()) {
          lines.push('**Comments:**');
          lines.push(escapeMd(comments));
        } else {
          lines.push('_No answer or comments provided._');
        }
      }
      lines.push('\n---\n');
    });
    const mdContent = lines.join('\n');
    const dataBlob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(dataBlob);
    setMarkdownBlob(dataBlob); // Store the blob for later use
    return url;
  };

  // Regenerate markdown URL when data or annotations change
  useEffect(() => {
    if (markdownUrlRef.current) {
      URL.revokeObjectURL(markdownUrlRef.current);
    }
    const url = generateMarkdownUrl();
    setMarkdownUrl(url);
    markdownUrlRef.current = url;
    // Cleanup on unmount
    return () => {
      if (markdownUrlRef.current) {
        URL.revokeObjectURL(markdownUrlRef.current);
        markdownUrlRef.current = null;
      }
    };
  }, [filteredData, annotations]);

  // Download markdown file
  const downloadResultsMarkdown = () => {
    if (Object.keys(filteredAnnotations).length === 0) {
      alert('No annotations to export. Please annotate at least one question.');
      return;
    }
    // Always generate a fresh Blob URL for download
    const escapeMd = (text: string) => text?.replace(/([*_`~])/g, '\$1') || '';
    const lines: string[] = [];
    filteredData.forEach((q, idx) => {
      const annotation = filteredAnnotations[q.id];
      if (!annotation) return;
      const { answer, comments } = annotation;
      lines.push(`# Q${idx + 1}:`);
      lines.push(`**Question:**`);
      lines.push(q.question);
      lines.push('');
      if (answer === 'both_correct') {
        lines.push('**Merged Solution:**');
        lines.push(q.answer_a);
        lines.push('');
        lines.push(q.answer_b);
        if (comments?.trim()) {
          lines.push('');
          lines.push('**Comments:**');
          lines.push(escapeMd(comments));
        }
      } else if (answer === 'a_better') {
        lines.push('**Selected Solution A:**');
        lines.push(q.answer_a);
        if (comments?.trim()) {
          lines.push('');
          lines.push('**Comments:**');
          lines.push(escapeMd(comments));
        }
      } else if (answer === 'b_better') {
        lines.push('**Selected Solution B:**');
        lines.push(q.answer_b);
        if (comments?.trim()) {
          lines.push('');
          lines.push('**Comments:**');
          lines.push(escapeMd(comments));
        }
      } else if (answer === 'not_sure') {
        if (comments?.trim()) {
          lines.push('**Comments:**');
          lines.push(escapeMd(comments));
        } else {
          lines.push('_No answer or comments provided._');
        }
      }
      lines.push('\n---\n');
    });
    if (lines.length === 0) {
      lines.push('# Annotation Results');
      lines.push('No annotations were made.');
    }
    const mdContent = lines.join('\n');
    const dataBlob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'annotation_results.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Copy markdown link to clipboard
  const copyMarkdownLink = async () => {
    if (!markdownUrl) return;
    try {
      await navigator.clipboard.writeText(markdownUrl);
      alert('Markdown download link copied to clipboard!');
    } catch (e) {
      alert('Failed to copy link.');
    }
  };

  // Generate persistent web link for preview
  const getWebLink = async () => {
    if (!markdownBlob) return;
    // Read the markdown content from the blob
    const md = await markdownBlob.text();
    const html = marked.parse(md);
    // Compose the same HTML as in the open-in-tab option
    const fullHtml = `<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n<meta charset=\"utf-8\">\n<title>Annotation Results</title>\n<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css\">\n<style>body{font-family:sans-serif;padding:2em;max-width:900px;margin:auto;} pre{background:#f8f9fa;padding:1em;border-radius:6px;overflow-x:auto;} .markdown-content{line-height:1.8;} .markdown-content h1, .markdown-content h2, .markdown-content h3{color:#2c3e50;margin-top:20px;margin-bottom:15px;} .markdown-content p{margin-bottom:15px;} .markdown-content code{background:#f1f3f4;padding:3px 6px;border-radius:4px;font-family:'Courier New',monospace;} .markdown-content blockquote{border-left:4px solid #007bff;padding-left:15px;margin:15px 0;color:#6c757d;} .markdown-content ul, .markdown-content ol{margin-bottom:15px;padding-left:20px;} .markdown-content li{margin-bottom:5px;} .markdown-content img{max-width:100%;height:auto;display:block;margin:auto;}\n</style>\n</head>\n<body>\n<div class=\"markdown-content\">` + html + `</div>\n<script src=\"https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js\"></script>\n<script src=\"https://cdn.jsdelivr.net/npm/marked/marked.min.js\"></script>\n</body>\n</html>`;
    // Generate a unique ID
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(`annotation_preview_${id}`, fullHtml);
    const link = `${window.location.origin}/annotation-preview/${id}`;
    setWebLink(link);
    setShowWebLinkModal(true);
    setTimeout(() => {
      webLinkInputRef.current?.focus();
      webLinkInputRef.current?.select();
    }, 100);
  };

  const handleCopyWebLink = async () => {
    if (!webLink) return;
    try {
      await navigator.clipboard.writeText(webLink);
    } catch (e) {}
  };

  // Dropdown menu state
  const [showMdMenu, setShowMdMenu] = useState(false);
  const mdBtnRef = useRef<HTMLButtonElement>(null);

  // Handle right click/context menu on markdown button
  const handleMdBtnContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMdMenu(true);
    // Optionally, position menu near mouse
  };

  // Hide menu on click outside
  useEffect(() => {
    if (!showMdMenu) return;
    const handler = (e: MouseEvent) => {
      setShowMdMenu(false);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [showMdMenu]);

  const returnToAnnotation = () => {
    setShowCompletion(false);
    setShowSummary(false);
  };

  const viewSummary = () => {
    setShowSummary(true);
  };

  const hideSummary = () => {
    setShowSummary(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || !e.shiftKey) return;
      
      switch (e.key) {
        case '1':
          handleAnswerSelect('both_correct');
          break;
        case '2':
          handleAnswerSelect('a_better');
          break;
        case '3':
          handleAnswerSelect('b_better');
          break;
        case '4':
          handleAnswerSelect('not_sure');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          await saveAndNext();
          break;
        case 'Enter':
          e.preventDefault();
          if (e.ctrlKey) {
            await saveAndStay();
          } else {
            await saveAndNext();
          }
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          document.getElementById('jumpInput')?.focus();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          toggleQuestionList();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          await finishAnnotation();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [filteredCurrentIndex, selectedAnswer, comments, annotations, isSaving, filteredData.length]);

  // Loading state
  if (loading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Loading...</h2>
          <p className="text-gray-500">Loading annotation data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Loading Failed</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            Reload
          </Button>
        </div>
      </div>
    );
  }

  // No data state
  if (filteredData.length === 0) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Data</h2>
          <p className="text-gray-500">No annotation data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: markdownStyles }} />
      {/* Navigation Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold">Reference: BBa_K2206006</span>
            {/* <a
              href="https://parts.igem.org/Part:BBa_K2206006"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              Open Original ↗
            </a> */}
          </div>
          <div className="flex items-center gap-4">
            <span>Jump to question:</span>
            <Input
              id="jumpInput"
              type="number"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="w-20 text-center text-black"
              min={1}
              max={filteredData.length}
              placeholder="Q#"
            />
            <Button onClick={() => {
              const questionNumber = parseInt(jumpInput);
              if (questionNumber >= 1 && questionNumber <= filteredData.length) {
                setCurrentQuestionIndex(data.findIndex(q => q.id === filteredData[questionNumber - 1].id));
                setJumpInput('');
              }
            }} variant="outline" size="sm" className="bg-white text-gray-800 hover:bg-gray-100">
              Jump
            </Button>
          </div>
        </div>
      </div>
      {/* Question List */}
      {showQuestionList && (
        <div className="bg-gray-50 p-4 border-b flex-shrink-0">
          <h4 className="mb-4 font-semibold">📋 Question List (Click to jump)</h4>
          <ScrollArea className="h-48">
            <div className="grid grid-cols-10 gap-2">
              {filteredData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentQuestionIndex(data.findIndex(q => q.id === filteredData[index].id));
                    setShowQuestionList(false);
                  }}
                  className={`
                    w-10 h-10 border-2 rounded-md flex items-center justify-center font-semibold text-sm transition-all
                    ${filteredCurrentIndex === index ? 'border-blue-500 bg-blue-500 text-white' : ''}
                    ${filteredAnnotations[filteredData[index].id] ? 'border-green-500 bg-green-100 text-green-700' : 'border-gray-300 bg-white'}
                    hover:scale-110
                  `}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      {/* Main Content - Two Column Layout */}
      <div className="flex flex-row flex-1 min-h-0">
        {/* Left: Annotation Content */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="flex-1 p-4 h-full">
            <div className="space-y-6">
              {/* Question Section */}
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
                <div className="prose max-w-none markdown-content">
                  {currentFilteredQuestion ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {currentFilteredQuestion.question || ''}
                    </ReactMarkdown>
                  ) : null}
                </div>
              </div>
              {/* Answers Container */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 font-semibold">
                    📝 Solution A
                  </div>
                  <div className="p-6">
                    <div className="prose max-w-none markdown-content">
                      {currentFilteredQuestion ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {currentFilteredQuestion.answer_a || ''}
                        </ReactMarkdown>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 font-semibold">
                    🤖 Solution B
                  </div>
                  <div className="p-6">
                    <div className="prose max-w-none markdown-content">
                      {currentFilteredQuestion ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {currentFilteredQuestion.answer_b || ''}
                        </ReactMarkdown>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              {/* Evaluation Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <div className="text-xl font-semibold mb-6 text-blue-800">
                  📝 Please evaluate the correctness of the answers based on the reasoning process:
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { value: 'both_correct', label: '✅ Both Correct' },
                    { value: 'a_better', label: '✅ A Better than ❌ B' },
                    { value: 'b_better', label: '✅ B Better than ❌ A' },
                    { value: 'not_sure', label: '❓ Too Difficult' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswerSelect(option.value)}
                      className={`
                        flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                        ${selectedAnswer === option.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="is_correct"
                        value={option.value}
                        checked={selectedAnswer === option.value}
                        onChange={() => handleAnswerSelect(option.value)}
                        className="scale-125"
                      />
                      <label className="font-medium cursor-pointer">{option.label}</label>
                    </button>
                  ))}
                </div>

                {/* Comments Section */}
                <div className="mb-6">
                  <label className="block mb-2 font-semibold text-gray-700">
                    💬 Detailed Comments (Optional):
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full min-h-[100px] p-4 border-2 border-gray-300 rounded-lg resize-y focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Please enter your detailed comments, suggestions, or issues found..."
                  />
                </div>

                {/* Keyboard Shortcuts */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-center text-sm text-gray-600">
                  <div className="mb-2">
                    💡 <strong>Keyboard Shortcuts (hold <kbd className='bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs'>Shift</kbd>):</strong>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Shift+1</kbd> Both Correct | 
                      <kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Shift+2</kbd> A Better | 
                      <kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Shift+3</kbd> B Better | 
                      <kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Shift+4</kbd> Not Sure
                    </div>
                    <div>
                      <kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Shift+←</kbd>/<kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Shift+→</kbd> Previous/Next | 
                      <kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Shift+Enter</kbd> Save & Next | 
                      <kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Ctrl+Shift+Enter</kbd> Save Only
                    </div>
                    <div>
                      <kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Shift+J</kbd> Jump | 
                      <kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Shift+L</kbd> Question List | 
                      <kbd className="bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs">Shift+F</kbd> Finish
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button onClick={goToPrevious} variant="outline" disabled={filteredCurrentIndex === 0 || isSaving} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    ⬅️ Previous
                  </Button>
                  <Button onClick={saveAndStay} variant="outline" disabled={isSaving} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    {isSaving ? '💾 Saving...' : '💾 Save Current'}
                  </Button>
                  <Button onClick={saveAndNext} disabled={filteredCurrentIndex === filteredData.length - 1 || isSaving} className="bg-green-700 hover:bg-green-800 text-white">
                    {isSaving ? 'Saving...' : 'Save & Next ➡️'}
                  </Button>
                  <Button onClick={finishAnnotation} disabled={isSaving} className="bg-green-700 hover:bg-green-800 text-white">
                    {isSaving ? 'Saving...' : '🏁 Finish Annotation'}
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
        {/* Right: External Content Reader */}
        <div className="w-[450px] min-w-[350px] max-w-[600px] border-l border-gray-200 bg-gray-50 flex flex-col">
          <IgemSummary partId={currentFilteredQuestion?.model_name || "BBa_K2206006"} />
        </div>
      </div>

      {/* Annotation Complete Dialog */}
      <Dialog open={showCompletion} onOpenChange={setShowCompletion}>
         <DialogContent className="w-[80vw] max-w-[900px] my-8 max-h-[80vh]">
            <DialogTitle asChild>
              <VisuallyHidden>Annotation Complete</VisuallyHidden>
            </DialogTitle>
            {/* Custom header row: text left, share button right */}
            <div className="flex items-center justify-between mt-6 mb-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-green-600">🎉 Complete!</span>
                <span className="text-base text-gray-700 mt-1">You have processed {Object.keys(filteredAnnotations).length} / {filteredData.length} questions</span>
              </div>
              <Button onClick={getWebLink} variant="outline" className="flex items-center gap-2 p-2 text-sm">
                <Mail className="w-5 h-5" /> Share
              </Button>
            </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            {/* User Stats */}
            <div className="p-2">
              <UserAnnotationStats 
                totalQuestions={filteredData.length}
                answeredCount={Object.keys(filteredAnnotations).length}
                onRefresh={() => window.location.reload()}
              />
            </div>
            {/* Action Buttons */}
            <div className="space-y-2 p-2">
              <h3 className="text-base font-semibold mb-2">📊 Export Results</h3>
              <Button onClick={downloadResults} className="w-full p-2 text-sm">
                📥 Download JSON Results
              </Button>
              <Button onClick={downloadResultsCSV} className="w-full p-2 text-sm">
                📊 Download CSV Results
              </Button>
              <div className="relative">
                <Button
                  ref={mdBtnRef}
                  onClick={downloadResultsMarkdown}
                  onContextMenu={handleMdBtnContextMenu}
                  className="w-full p-2 text-sm"
                >
                  📝 Download Markdown Results
                </Button>
                {showMdMenu && (
                  <div
                    className="absolute z-50 bg-white border rounded shadow-lg mt-2 right-0 left-0"
                    style={{ minWidth: 200 }}
                  >
                    <button
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        copyMarkdownLink();
                        setShowMdMenu(false);
                      }}
                    >
                      📋 Copy Download Link
                    </button>
                    <a
                      href={markdownUrl || '#'}
                      download="annotation_results.md"
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => setShowMdMenu(false)}
                    >
                      ⬇️ Direct Download
                    </a>
                    <button
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        if (markdownUrl) {
                          // Fetch the markdown content and render as HTML in a new tab
                          fetch(markdownUrl)
                            .then(res => res.text())
                            .then(md => {
                              const html = marked.parse(md);
                              const win = window.open('', '_blank');
                              if (win) {
                                win.document.write(`<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n<meta charset=\"utf-8\">\n<title>Annotation Results</title>\n<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css\">\n<style>body{font-family:sans-serif;padding:2em;max-width:900px;margin:auto;} pre{background:#f8f9fa;padding:1em;border-radius:6px;overflow-x:auto;} .markdown-content{line-height:1.8;} .markdown-content h1, .markdown-content h2, .markdown-content h3{color:#2c3e50;margin-top:20px;margin-bottom:15px;} .markdown-content p{margin-bottom:15px;} .markdown-content code{background:#f1f3f4;padding:3px 6px;border-radius:4px;font-family:'Courier New',monospace;} .markdown-content blockquote{border-left:4px solid #007bff;padding-left:15px;margin:15px 0;color:#6c757d;} .markdown-content ul, .markdown-content ol{margin-bottom:15px;padding-left:20px;} .markdown-content li{margin-bottom:5px;} .markdown-content img{max-width:100%;height:auto;display:block;margin:auto;}\n</style>\n</head>\n<body>\n<div class=\"markdown-content\">` + html + `</div>\n<script src=\"https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js\"></script>\n<script src=\"https://cdn.jsdelivr.net/npm/marked/marked.min.js\"></script>\n</body>\n</html>`);
                                win.document.close();
                              }
                            });
                        }
                        setShowMdMenu(false);
                      }}
                    >
                      🌐 Open in New Tab
                    </button>
                  </div>
                )}
              </div>
              <Button onClick={viewSummary} variant="outline" className="w-full p-2 text-sm">
                📈 View Detailed Statistics
              </Button>
              <Button onClick={returnToAnnotation} variant="outline" className="w-full p-2 text-sm">
                🔄 Return to Questions 
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shareable Web Link Dialog (unchanged) */}
      <Dialog open={showWebLinkModal} onOpenChange={setShowWebLinkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shareable Web Link</DialogTitle>
            <DialogDescription>
              This link will open your compiled annotation as a web page (valid on this device/browser).
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={webLinkInputRef}
              type="text"
              value={webLink || ''}
              readOnly
              className="flex-1 border rounded px-2 py-1 text-sm bg-gray-100"
              onFocus={e => e.target.select()}
            />
            <Button onClick={handleCopyWebLink} type="button">Copy</Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog (unchanged) */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200 shadow-lg">
            <h3 className="text-2xl font-bold mb-6">📈 Annotation Statistics</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{Object.values(filteredAnnotations).filter(a => a.answer === 'both_correct').length}</div>
                  <div className="text-sm text-blue-800">Both Correct</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{Object.values(filteredAnnotations).filter(a => a.answer === 'a_better').length}</div>
                  <div className="text-sm text-green-800">A Better</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{Object.values(filteredAnnotations).filter(a => a.answer === 'b_better').length}</div>
                  <div className="text-sm text-yellow-800">B Better</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{Object.values(filteredAnnotations).filter(a => a.answer === 'not_sure').length}</div>
                  <div className="text-sm text-gray-800">Not Sure</div>
                </div>
              </div>
              <Button onClick={hideSummary} className="w-full">
                Back
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationSystem; 