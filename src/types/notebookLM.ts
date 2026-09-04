export type SourceType = 'course' | 'youtube' | 'note' | 'workshop' | 'pdf';

export interface NotebookSource {
  id: string;
  title: string;
  subtitle: string;
  type: SourceType;
  content: string;
  wordCount: number;
  isSelected: boolean;
  icon: string;
  courseId?: string;
  videoId?: string;
  lastUpdated?: string;
}

export interface NotebookCitation {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: SourceType;
  excerpt: string;
  section: string;
  citationIndex: number;
}

export interface PodcastDialogueItem {
  speaker: 'Alex' | 'Maya';
  speakerRole: string;
  text: string;
  timestampSec: number;
  timestampFormatted: string;
}

export interface AudioOverviewPodcast {
  id: string;
  title: string;
  topic: string;
  durationSec: number;
  durationFormatted: string;
  speakers: {
    name: 'Alex' | 'Maya';
    role: string;
    avatarColor: string;
  }[];
  dialogue: PodcastDialogueItem[];
  keyTakeaways: string[];
}

export type StudioArtifactType =
  | 'audio_overview'
  | 'study_guide'
  | 'faq'
  | 'roadmap'
  | 'flashcards';

export interface StudyGuideSection {
  title: string;
  keyConcepts: string[];
  summary: string;
  formulasOrFrameworks?: string[];
  examReviewQuestions: {
    question: string;
    answer: string;
  }[];
}

export interface StudyGuideArtifact {
  title: string;
  subtitle: string;
  sections: StudyGuideSection[];
  glossary: { term: string; definition: string }[];
}

export interface FAQItem {
  question: string;
  answer: string;
  sourceCitation: string;
}

export interface FAQArtifact {
  title: string;
  items: FAQItem[];
}

export interface RoadmapMilestone {
  week: string;
  title: string;
  skills: string[];
  recommendedCourse: string;
  outcome: string;
}

export interface RoadmapArtifact {
  title: string;
  targetRole: string;
  milestones: RoadmapMilestone[];
}

export interface Flashcard {
  id: string;
  category: string;
  question: string;
  answer: string;
  hint?: string;
  sourceTitle: string;
}

export interface FlashcardsArtifact {
  title: string;
  cards: Flashcard[];
}

export interface NotebookNote {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  tags: string[];
  isIncludedAsSource: boolean;
}
