import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { progressApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressContextType {
  completedVideos: number[];
  completedTasks: number[];
  loading: boolean;
  markVideoCompleted: (videoId: string | number) => Promise<void>;
  markTaskCompleted: (taskId: string | number) => Promise<void>;
  isVideoCompleted: (videoId: string | number) => boolean;
  isTaskCompleted: (taskId: string | number) => boolean;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [completedVideos, setCompletedVideos] = useState<number[]>([]);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const fetchProgress = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCompletedVideos([]);
      setCompletedTasks([]);
      setLoading(false);
      return;
    }

    try {
      const response = await progressApi.getMyProgress();
      const videos = response?.completed_videos || [];
      const tasks = response?.completed_tasks || [];
      
      // Ensure all IDs are numbers
      setCompletedVideos(videos.map((id: any) => Number(id)));
      setCompletedTasks(tasks.map((id: any) => Number(id)));
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const markVideoCompleted = async (videoId: string | number) => {
    const numericId = Number(videoId);
    
    // Optimistically update
    if (!completedVideos.includes(numericId)) {
      setCompletedVideos(prev => [...prev, numericId]);
    }

    try {
      await progressApi.completeVideo(String(videoId));
    } catch (error) {
      console.error('Failed to mark video as completed:', error);
      // Revert on error
      setCompletedVideos(prev => prev.filter(id => id !== numericId));
    }
  };

  const markTaskCompleted = async (taskId: string | number) => {
    const numericId = Number(taskId);
    
    // Optimistically update
    if (!completedTasks.includes(numericId)) {
      setCompletedTasks(prev => [...prev, numericId]);
    }

    try {
      await progressApi.completeTask(String(taskId));
    } catch (error) {
      console.error('Failed to mark task as completed:', error);
      // Revert on error
      setCompletedTasks(prev => prev.filter(id => id !== numericId));
    }
  };

  const isVideoCompleted = (videoId: string | number): boolean => {
    const numericId = Number(videoId);
    return completedVideos.includes(numericId);
  };

  const isTaskCompleted = (taskId: string | number): boolean => {
    const numericId = Number(taskId);
    return completedTasks.includes(numericId);
  };

  const refreshProgress = async () => {
    await fetchProgress();
  };

  return (
    <ProgressContext.Provider value={{ 
      completedVideos,
      completedTasks,
      loading,
      markVideoCompleted, 
      markTaskCompleted, 
      isVideoCompleted, 
      isTaskCompleted,
      refreshProgress
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
