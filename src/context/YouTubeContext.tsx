import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { YouTubeVideo, YOUTUBE_VIDEOS } from '../data/youtubeVideos';
import {
  syncLatestYouTubeVideos,
  getSavedVideoIds,
  saveVideoIds,
} from '../services/youtubeService';

export type PlayerMode = 'modal' | 'mini' | 'closed';

interface YouTubeContextType {
  videos: YouTubeVideo[];
  activeVideo: YouTubeVideo | null;
  playerMode: PlayerMode;
  savedVideoIds: string[];
  savedVideos: YouTubeVideo[];
  isLoading: boolean;
  playVideo: (video: YouTubeVideo, mode?: 'modal' | 'mini') => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
  closePlayer: () => void;
  toggleSaveVideo: (videoId: string) => void;
  isSaved: (videoId: string) => boolean;
  refreshVideos: () => Promise<void>;
}

const YouTubeContext = createContext<YouTubeContextType | undefined>(undefined);

export const YouTubeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>(YOUTUBE_VIDEOS);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('closed');
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize saved videos & background RSS sync
  useEffect(() => {
    getSavedVideoIds().then((ids) => {
      setSavedVideoIds(ids);
    });

    // Initial background sync
    syncLatestYouTubeVideos().then((synced) => {
      if (synced && synced.length > 0) {
        setVideos(synced);
      }
    });
  }, []);

  const refreshVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const synced = await syncLatestYouTubeVideos();
      if (synced && synced.length > 0) {
        setVideos(synced);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const playVideo = useCallback((video: YouTubeVideo, mode: 'modal' | 'mini' = 'modal') => {
    setActiveVideo(video);
    setPlayerMode(mode);
  }, []);

  const minimizePlayer = useCallback(() => {
    setPlayerMode('mini');
  }, []);

  const maximizePlayer = useCallback(() => {
    if (activeVideo) {
      setPlayerMode('modal');
    }
  }, [activeVideo]);

  const closePlayer = useCallback(() => {
    setPlayerMode('closed');
    setActiveVideo(null);
  }, []);

  const toggleSaveVideo = useCallback(
    (videoId: string) => {
      setSavedVideoIds((prev) => {
        const next = prev.includes(videoId)
          ? prev.filter((id) => id !== videoId)
          : [...prev, videoId];
        saveVideoIds(next);
        return next;
      });
    },
    []
  );

  const isSaved = useCallback(
    (videoId: string) => {
      return savedVideoIds.includes(videoId);
    },
    [savedVideoIds]
  );

  // Derive saved videos list
  const savedVideos = videos.filter((v) => savedVideoIds.includes(v.id));

  return (
    <YouTubeContext.Provider
      value={{
        videos,
        activeVideo,
        playerMode,
        savedVideoIds,
        savedVideos,
        isLoading,
        playVideo,
        minimizePlayer,
        maximizePlayer,
        closePlayer,
        toggleSaveVideo,
        isSaved,
        refreshVideos,
      }}
    >
      {children}
    </YouTubeContext.Provider>
  );
};

export const useYouTube = (): YouTubeContextType => {
  const context = useContext(YouTubeContext);
  if (!context) {
    throw new Error('useYouTube must be used within a YouTubeProvider');
  }
  return context;
};
