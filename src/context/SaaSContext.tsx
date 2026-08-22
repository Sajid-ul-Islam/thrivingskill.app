import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SubscriptionTier,
  BillingInterval,
  Workspace,
  TeamMember,
  SaaSNotification,
  CopilotMessage,
  SkillAssessmentResult,
  PlanFeature,
} from '../types';

const SAAS_STORAGE_KEY = '@thriving_skill_saas_state_v1';

export const SAAS_PLAN_FEATURES: PlanFeature[] = [
  { id: '1', title: 'Full Course Library Access', starter: '3 Previews', pro: 'Unlimited 24+ Courses', enterprise: 'Unlimited + Custom Tracks' },
  { id: '2', title: 'Executive AI Skill Copilot', starter: false, pro: 'Unlimited Queries', enterprise: 'Team Shared + Org Context' },
  { id: '3', title: 'Verifiable Digital Credentials', starter: 'Basic Badge', pro: 'LinkedIn Verified + QR', enterprise: 'Corporate Branded + API' },
  { id: '4', title: 'Live Cohort Masterclasses', starter: 'Pay per seat', pro: 'Included (Free RSVP)', enterprise: 'Dedicated Private Sessions' },
  { id: '5', title: 'Team Admin & Skill Gap Radar', starter: false, pro: false, enterprise: 'Full Analytics Dashboard' },
  { id: '6', title: 'Course Assignment & Deadlines', starter: false, pro: false, enterprise: 'Automated Reminders & Reports' },
  { id: '7', title: 'Offline Mobile Downloads', starter: false, pro: true, enterprise: true },
  { id: '8', title: 'Enterprise SSO & Dedicated SLA', starter: false, pro: false, enterprise: '24/7 Dedicated Support' },
];

const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-personal',
    name: 'Alex Rahman (Personal)',
    type: 'personal',
    role: 'learner',
    companyName: 'Personal Account',
  },
  {
    id: 'ws-apex',
    name: 'Apex Corp Enterprise',
    type: 'enterprise',
    role: 'admin',
    companyName: 'Apex Corp Technologies',
    activeSeats: 18,
    totalSeats: 25,
  },
];

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.m@apexcorp.com',
    department: 'Financial Strategy',
    role: 'FP&A Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assignedCourseIds: ['course-1', 'course-2'],
    completedCoursesCount: 1,
    progressPercent: 85,
    lastActive: '2 hours ago',
    skillsMastered: ['DCF Valuation', 'Prompt Engineering'],
  },
  {
    id: 'tm-2',
    name: 'Samira Chowdhury',
    email: 'samira.c@apexcorp.com',
    department: 'Operations & Tech',
    role: 'Senior Product Operations',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    assignedCourseIds: ['course-1', 'course-3'],
    completedCoursesCount: 2,
    progressPercent: 100,
    lastActive: 'Yesterday',
    skillsMastered: ['Generative AI', 'PowerBI Analytics', 'SQL'],
  },
  {
    id: 'tm-3',
    name: 'Nadim Hossain',
    email: 'nadim.h@apexcorp.com',
    department: 'People & Culture',
    role: 'HR Business Partner',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    assignedCourseIds: ['course-4'],
    completedCoursesCount: 0,
    progressPercent: 45,
    lastActive: '3 days ago',
    skillsMastered: ['9-Box Talent Grid'],
  },
  {
    id: 'tm-4',
    name: 'Farhana Yasmin',
    email: 'farhana.y@apexcorp.com',
    department: 'Growth & Commercial',
    role: 'Growth Marketing Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedCourseIds: ['course-6', 'course-1'],
    completedCoursesCount: 1,
    progressPercent: 70,
    lastActive: 'Today',
    skillsMastered: ['Growth Funnels', 'CAC/LTV Modeling'],
  },
];

const INITIAL_NOTIFICATIONS: SaaSNotification[] = [
  {
    id: 'notif-1',
    title: 'New Team Course Assigned 🎯',
    message: 'Apex Corp Admin assigned you "Generative AI for Business Leaders". Target completion: Sep 15, 2026.',
    type: 'assignment',
    timestamp: '10m ago',
    isRead: false,
    actionRoute: { tab: 'Courses', courseId: 'course-1' },
  },
  {
    id: 'notif-2',
    title: 'Live Workshop Reminder 📅',
    message: 'Your registered masterclass "AI Agents for Operations" starts in 48 hours.',
    type: 'workshop',
    timestamp: '2h ago',
    isRead: false,
    actionRoute: { tab: 'Workshops' },
  },
  {
    id: 'notif-3',
    title: 'Verified Credential Issued 🏆',
    message: 'Your certificate for "Generative AI for Business Leaders" is ready and published to your wallet.',
    type: 'certificate',
    timestamp: '1d ago',
    isRead: true,
    actionRoute: { tab: 'MyLearning' },
  },
  {
    id: 'notif-4',
    title: 'AI Copilot Upgrade ⚡',
    message: 'Executive Financial Auditing mode is now available in your AI Skill Copilot.',
    type: 'ai',
    timestamp: '3d ago',
    isRead: true,
    actionRoute: { tab: 'Copilot' },
  },
];

const INITIAL_COPILOT_MESSAGES: CopilotMessage[] = [
  {
    id: 'copilot-init',
    sender: 'assistant',
    text: 'Hello Alex! I am your Executive AI Skill Copilot. I can help you analyze financial models, craft enterprise AI prompts, diagnose organizational skill gaps, or practice high-stakes boardroom negotiations. How can I assist your executive workflow today?',
    timestamp: 'Just now',
    suggestedActions: [
      'Audit my DCF model assumptions',
      'Generate an RTCC enterprise AI prompt',
      'Explain WACC calculation with case study',
      'Recommend an executive upskilling roadmap',
    ],
  },
];

interface SaaSContextType {
  subscriptionTier: SubscriptionTier;
  billingInterval: BillingInterval;
  activeWorkspace: Workspace;
  workspaces: Workspace[];
  teamMembers: TeamMember[];
  notifications: SaaSNotification[];
  copilotMessages: CopilotMessage[];
  assessmentResult: SkillAssessmentResult | null;
  unreadNotificationsCount: number;
  // Actions
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  setBillingInterval: (interval: BillingInterval) => void;
  switchWorkspace: (workspaceId: string) => void;
  inviteTeamMember: (name: string, email: string, department: string, role: string) => void;
  assignCourseToMember: (memberId: string, courseId: string) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  sendCopilotMessage: (text: string) => Promise<void>;
  clearCopilotHistory: () => void;
  saveAssessmentResult: (result: SkillAssessmentResult) => void;
}

const SaaSContext = createContext<SaaSContextType>({} as SaaSContextType);

export const SaaSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptionTier, setSubscriptionTierState] = useState<SubscriptionTier>('pro');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('annual');
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(INITIAL_WORKSPACES[0]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [notifications, setNotifications] = useState<SaaSNotification[]>(INITIAL_NOTIFICATIONS);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>(INITIAL_COPILOT_MESSAGES);
  const [assessmentResult, setAssessmentResult] = useState<SkillAssessmentResult | null>({
    completedAt: '2026-08-18',
    overallScore: 84,
    domainScores: [
      { domain: 'Generative AI & Tech', score: 90, maxScore: 100 },
      { domain: 'Financial Strategy', score: 85, maxScore: 100 },
      { domain: 'Data Analytics & BI', score: 75, maxScore: 100 },
      { domain: 'People Analytics & HR', score: 80, maxScore: 100 },
      { domain: 'Executive Communication', score: 90, maxScore: 100 },
    ],
    levelName: 'Executive Strategist (Level IV)',
    recommendedCourseIds: ['course-1', 'course-2', 'course-3'],
    keyInsight: 'Strong executive communication and AI adoption potential. Recommended focus on Data Analytics & Python to complete end-to-end automation.',
  });

  // Load from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SAAS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.subscriptionTier) setSubscriptionTierState(parsed.subscriptionTier);
          if (parsed.billingInterval) setBillingInterval(parsed.billingInterval);
          if (parsed.teamMembers) setTeamMembers(parsed.teamMembers);
          if (parsed.notifications) setNotifications(parsed.notifications);
          if (parsed.assessmentResult) setAssessmentResult(parsed.assessmentResult);
          if (parsed.activeWorkspaceId) {
            const found = INITIAL_WORKSPACES.find((w) => w.id === parsed.activeWorkspaceId);
            if (found) setActiveWorkspace(found);
          }
        }
      } catch {}
    })();
  }, []);

  const saveToStorage = async (updates: any) => {
    try {
      const current = await AsyncStorage.getItem(SAAS_STORAGE_KEY);
      const parsed = current ? JSON.parse(current) : {};
      await AsyncStorage.setItem(SAAS_STORAGE_KEY, JSON.stringify({ ...parsed, ...updates }));
    } catch {}
  };

  const setSubscriptionTier = (tier: SubscriptionTier) => {
    setSubscriptionTierState(tier);
    saveToStorage({ subscriptionTier: tier });
  };

  const switchWorkspace = (workspaceId: string) => {
    const target = workspaces.find((w) => w.id === workspaceId);
    if (target) {
      setActiveWorkspace(target);
      saveToStorage({ activeWorkspaceId: workspaceId });
    }
  };

  const inviteTeamMember = (name: string, email: string, department: string, role: string) => {
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name,
      email,
      department: department || 'Operations',
      role: role || 'Member',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      assignedCourseIds: ['course-1'],
      completedCoursesCount: 0,
      progressPercent: 0,
      lastActive: 'Just invited',
      skillsMastered: [],
    };
    const updated = [newMember, ...teamMembers];
    setTeamMembers(updated);
    saveToStorage({ teamMembers: updated });

    // Update workspace active seats count
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === 'ws-apex'
          ? { ...w, activeSeats: Math.min((w.activeSeats || 18) + 1, w.totalSeats || 25) }
          : w
      )
    );
  };

  const assignCourseToMember = (memberId: string, courseId: string) => {
    const updated = teamMembers.map((tm) => {
      if (tm.id === memberId && !tm.assignedCourseIds.includes(courseId)) {
        return {
          ...tm,
          assignedCourseIds: [...tm.assignedCourseIds, courseId],
        };
      }
      return tm;
    });
    setTeamMembers(updated);
    saveToStorage({ teamMembers: updated });
  };

  const markNotificationRead = (notifId: string) => {
    const updated = notifications.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
    setNotifications(updated);
    saveToStorage({ notifications: updated });
  };

  const markAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveToStorage({ notifications: updated });
  };

  const saveAssessmentResult = (result: SkillAssessmentResult) => {
    setAssessmentResult(result);
    saveToStorage({ assessmentResult: result });
  };

  const sendCopilotMessage = async (userText: string) => {
    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCopilotMessages((prev) => [...prev, userMsg]);

    // Generate intelligent contextual response
    setTimeout(() => {
      let reply = '';
      let actions: string[] = [];
      const lower = userText.toLowerCase();

      if (lower.includes('dcf') || lower.includes('valuation') || lower.includes('financial')) {
        reply = `### 📊 DCF Model Audit & Key Drivers
When auditing an enterprise Discounted Cash Flow model, evaluate three non-negotiable vectors:

1. **Free Cash Flow to Firm (FCFF)**:
   $$\\text{FCFF} = \\text{EBIT}(1 - t) + \\text{D\\&A} - \\Delta\\text{NWC} - \\text{CapEx}$$
2. **Terminal Value Sensitivity**: Ensure terminal growth does NOT exceed long-term GDP growth (maintain 2.0% - 2.5%).
3. **WACC Unlevering**: Re-lever Beta using $\\beta_L = \\beta_U \\times [1 + (1-t) \\times (D/E)]$.

*Recommended Next Step:* Review Lecture 3.1 in **Financial Modeling & Valuation Masterclass**.`;
        actions = ['Explore Sensitivity Table templates', 'Download DCF Excel Sheet', 'Ask about WACC'];
      } else if (lower.includes('prompt') || lower.includes('rtcc') || lower.includes('ai') || lower.includes('llm')) {
        reply = `### 🤖 Executive RTCC Prompt Blueprint
To instruct enterprise AI models for strategic deliverables with zero hallucination, apply the **RTCC Framework**:

\`\`\`markdown
[ROLE]: You are a Senior Strategy Director advising a Fortune 500 Board.
[TASK]: Synthesize Q2 earnings into a 3-bullet executive summary focusing on EBITDA margin expansion.
[CONTEXT]: Our revenue grew 14% YoY while OPEX contracted by 3.2% due to automation.
[CONSTRAINTS]: Strict bullet format, executive tone, cite percentage variance, under 150 words.
\`\`\`

This standard eliminates ambiguous responses and ensures board-ready formatting.`;
        actions = ['Generate board presentation prompt', 'Create HR analytics prompt', 'Test with your data'];
      } else if (lower.includes('roadmap') || lower.includes('team') || lower.includes('upskill') || lower.includes('analytics')) {
        reply = `### 🗺️ 30-Day Executive Upskilling Plan
For your department to reach operational excellence:

- **Week 1-2: Generative AI Foundations**: Master RTCC prompt framework and workflow automation agents (Course 1).
- **Week 3: Financial & Data Modeling**: Build automated KPI tracking and 3-statement forecast models (Course 2 & 3).
- **Week 4: Executive Storytelling & Change Leadership**: Present top-down recommendations with Pyramid Principle structure (Course 5).

Your team completion is currently tracking at **78%** across Apex Corp.`;
        actions = ['Assign roadmap to team', 'Schedule Live Clinic RSVP', 'View Skill Gap Benchmark'];
      } else {
        reply = `I have analyzed your query based on the Thriving Skills Executive curriculum. 

For maximum impact in your organization, align this objective with our core modules in **Generative AI Strategy**, **Financial Modeling**, and **Evidence-Based People Analytics**.

Would you like a step-by-step framework, a downloadable template, or a targeted masterclass recommendation?`;
        actions = ['Recommend specific course', 'Generate executive template', 'Assess my skill gaps'];
      }

      const assistantMsg: CopilotMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: actions,
      };

      setCopilotMessages((prev) => [...prev, assistantMsg]);
    }, 600);
  };

  const clearCopilotHistory = () => {
    setCopilotMessages(INITIAL_COPILOT_MESSAGES);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SaaSContext.Provider
      value={{
        subscriptionTier,
        billingInterval,
        activeWorkspace,
        workspaces,
        teamMembers,
        notifications,
        copilotMessages,
        assessmentResult,
        unreadNotificationsCount,
        setSubscriptionTier,
        setBillingInterval,
        switchWorkspace,
        inviteTeamMember,
        assignCourseToMember,
        markNotificationRead,
        markAllNotificationsRead,
        sendCopilotMessage,
        clearCopilotHistory,
        saveAssessmentResult,
      }}
    >
      {children}
    </SaaSContext.Provider>
  );
};

export const useSaaS = () => useContext(SaaSContext);
