import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initialStudentProgress, StudentProgress } from '@/data/demoData';

interface ProgressContextType {
  progress: StudentProgress;
  markVideoCompleted: (videoId: string) => void;
  markTaskCompleted: (taskId: string, score: number, total: number) => void;
  isVideoCompleted: (videoId: string) => boolean;
  isTaskCompleted: (taskId: string) => boolean;
  getTaskScore: (taskId: string) => { score: number; total: number } | null;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<StudentProgress>(() => {
    const saved = localStorage.getItem('abdiyev_progress');
    return saved ? JSON.parse(saved) : initialStudentProgress;
  });

  useEffect(() => {
    localStorage.setItem('abdiyev_progress', JSON.stringify(progress));
  }, [progress]);

  const markVideoCompleted = (videoId: string) => {
    setProgress(prev => {
      if (prev.completedVideos.includes(videoId)) return prev;
      return {
        ...prev,
        completedVideos: [...prev.completedVideos, videoId],
      };
    });
  };

  const markTaskCompleted = (taskId: string, score: number, total: number) => {
    setProgress(prev => {
      const existingIndex = prev.taskScores.findIndex(t => t.taskId === taskId);
      const newTaskScores = existingIndex >= 0
        ? prev.taskScores.map((t, i) => i === existingIndex ? { taskId, score, total } : t)
        : [...prev.taskScores, { taskId, score, total }];
      
      return {
        ...prev,
        completedTasks: prev.completedTasks.includes(taskId) 
          ? prev.completedTasks 
          : [...prev.completedTasks, taskId],
        taskScores: newTaskScores,
      };
    });
  };

  const isVideoCompleted = (videoId: string) => progress.completedVideos.includes(videoId);
  const isTaskCompleted = (taskId: string) => progress.completedTasks.includes(taskId);
  const getTaskScore = (taskId: string) => progress.taskScores.find(t => t.taskId === taskId) || null;

  return (
    <ProgressContext.Provider value={{ 
      progress, 
      markVideoCompleted, 
      markTaskCompleted, 
      isVideoCompleted, 
      isTaskCompleted,
      getTaskScore 
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
