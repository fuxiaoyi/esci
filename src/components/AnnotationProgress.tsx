import React from 'react';
import { useAnnotation } from '@/contexts/AnnotationContext';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Target } from 'lucide-react';

interface AnnotationProgressProps {
  filterTerm: string;
}

const AnnotationProgress: React.FC<AnnotationProgressProps> = ({ filterTerm }) => {
  const {
    data,
    annotations,
    currentQuestionIndex,
    loading,
    error
  } = useAnnotation();

  // Filtered data by model_name (partial, case-insensitive)
  const filteredData = filterTerm.trim().length > 0
    ? data.filter(q => q.model_name?.toLowerCase().includes(filterTerm.trim().toLowerCase()))
    : data;

  const filteredAnnotations = Object.fromEntries(
    Object.entries(annotations).filter(([id]) =>
      filteredData.some(q => String(q.id) === id)
    )
  );

  const answeredCount = Object.keys(filteredAnnotations).length;
  const totalCount = filteredData.length;
  const remainingCount = totalCount - answeredCount;
  const progressPercentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  // Find the current question index in the filtered list
  const filteredIndexes = filteredData.map(q => data.findIndex(d => d.id === q.id));
  const filteredCurrentIndex = filteredIndexes.indexOf(currentQuestionIndex);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 text-sm">
          <div className="font-semibold mb-1">Error loading data</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="p-4">
        <div className="text-gray-500 text-sm text-center">
          No annotation data available
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-700">Practice Progress</h3>
      </div>

      {/* Current Question */}
      <div className="text-center">
        <div className="text-lg font-bold text-blue-600">
          {filteredCurrentIndex + 1} / {totalCount}
        </div>
        <div className="text-xs text-gray-500">Current Question</div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Progress</span>
          <span>{progressPercentage.toFixed(1)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <Separator />

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <span className="text-sm font-semibold text-green-600">{answeredCount}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-gray-600">Remaining</span>
          </div>
          <span className="text-sm font-semibold text-orange-600">{remainingCount}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-600">Total</span>
          </div>
          <span className="text-sm font-semibold text-blue-600">{totalCount}</span>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-xs text-blue-800 text-center">
          {answeredCount === totalCount ? (
            <span className="font-semibold">🎉 All questions completed!</span>
          ) : (
            <span>
              {answeredCount} of {totalCount} questions annotated
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnotationProgress; 