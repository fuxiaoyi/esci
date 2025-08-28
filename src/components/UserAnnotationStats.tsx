import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserAnnotationStats } from '@/lib/annotation-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, BarChart3 } from 'lucide-react';

interface UserAnnotationStatsProps {
  totalQuestions: number;
  answeredCount: number;
  onRefresh?: () => void;
}

const UserAnnotationStats: React.FC<UserAnnotationStatsProps> = ({
  totalQuestions,
  answeredCount,
  onRefresh
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    totalAnnotations: number;
    answerDistribution: Record<string, number>;
    lastAnnotation: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, answeredCount]);

  const loadStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userStats = await getUserAnnotationStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const getAnswerLabel = (answer: string) => {
    switch (answer) {
      case 'both_correct': return '都正确';
      case 'a_better': return 'A更好';
      case 'b_better': return 'B更好';
      case 'not_sure': return '不确定';
      default: return answer;
    }
  };

  const getAnswerColor = (answer: string) => {
    switch (answer) {
      case 'both_correct': return 'bg-green-100 text-green-800 border-green-200';
      case 'a_better': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'b_better': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not_sure': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            标注统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            请登录以查看详细的标注统计信息
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          标注统计
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="ml-auto text-sm text-blue-600 hover:text-blue-800"
              disabled={loading}
            >
              {loading ? '刷新中...' : '刷新'}
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview 总体进度 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">总体进度</span>
            <span className="text-sm text-gray-500">
              {answeredCount} / {totalQuestions}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-gray-500">
            已完成 {progressPercentage.toFixed(1)}%
          </div>
        </div>

        {/* Answer Distribution 答案分布 */}
        {stats && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">答案分布</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats.answerDistribution).map(([answer, count]) => (
                <div key={answer} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <Badge variant="outline" className={getAnswerColor(answer)}>
                    {getAnswerLabel(answer)}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Activity 最近活动 */}
        {stats?.lastAnnotation && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">最近活动</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                最后标注时间: {new Date(stats.lastAnnotation.timestamp).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAnnotationStats; 