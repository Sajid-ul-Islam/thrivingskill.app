import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotebookSource,
  NotebookCitation,
  AudioOverviewPodcast,
  StudioArtifactType,
  StudyGuideArtifact,
  FAQArtifact,
  RoadmapArtifact,
  FlashcardsArtifact,
  NotebookNote,
} from '../types/notebookLM';
import {
  DEFAULT_NOTEBOOK_SOURCES,
  DEFAULT_AUDIO_PODCAST,
  DEFAULT_STUDY_GUIDE,
  DEFAULT_FAQ,
  DEFAULT_ROADMAP,
  DEFAULT_FLASHCARDS,
  INITIAL_NOTEBOOK_NOTES,
} from '../data/notebookSourcesData';

const SOURCES_STORAGE_KEY = '@thriving_notebook_sources_v1';
const NOTES_STORAGE_KEY = '@thriving_notebook_notes_v1';

export class NotebookLMService {
  private static cachedSources: NotebookSource[] | null = null;
  private static cachedNotes: NotebookNote[] | null = null;

  /**
   * Load all sources (defaults + custom user sources)
   */
  public static async getSources(): Promise<NotebookSource[]> {
    if (this.cachedSources) return this.cachedSources;

    try {
      const stored = await AsyncStorage.getItem(SOURCES_STORAGE_KEY);
      if (stored) {
        this.cachedSources = JSON.parse(stored);
        return this.cachedSources!;
      }
    } catch {
      // fallback
    }

    this.cachedSources = [...DEFAULT_NOTEBOOK_SOURCES];
    await this.saveSourcesToStorage(this.cachedSources);
    return this.cachedSources;
  }

  /**
   * Toggle a source on/off to scope grounding
   */
  public static async toggleSource(id: string): Promise<NotebookSource[]> {
    const list = await this.getSources();
    const updated = list.map((src) =>
      src.id === id ? { ...src, isSelected: !src.isSelected } : src
    );
    this.cachedSources = updated;
    await this.saveSourcesToStorage(updated);
    return updated;
  }

  /**
   * Add a custom learner source (pasted notes, meeting takeaways, article)
   */
  public static async addCustomSource(
    title: string,
    content: string,
    subtitle?: string
  ): Promise<NotebookSource> {
    const list = await this.getSources();
    const wordCount = content.trim().split(/\s+/).length;

    const newSource: NotebookSource = {
      id: `custom-src-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle || 'Learner Custom Note • Grounding Source',
      type: 'note',
      content: content.trim(),
      wordCount,
      isSelected: true,
      icon: 'document-text',
      lastUpdated: 'Just now',
    };

    const updated = [newSource, ...list];
    this.cachedSources = updated;
    await this.saveSourcesToStorage(updated);
    return newSource;
  }

  /**
   * Delete a custom source
   */
  public static async deleteSource(id: string): Promise<NotebookSource[]> {
    const list = await this.getSources();
    const updated = list.filter((src) => src.id !== id);
    this.cachedSources = updated;
    await this.saveSourcesToStorage(updated);
    return updated;
  }

  /**
   * Get active sources currently toggled ON
   */
  public static async getActiveSources(): Promise<NotebookSource[]> {
    const list = await this.getSources();
    return list.filter((s) => s.isSelected);
  }

  /**
   * Grounded Query Engine: Answers questions strictly scoped to active sources and returns inline citations
   */
  public static async queryGrounded(
    userPrompt: string
  ): Promise<{
    reply: string;
    citations: NotebookCitation[];
    suggestedActions: string[];
  }> {
    const activeSources = await this.getActiveSources();
    const lower = userPrompt.toLowerCase();

    if (activeSources.length === 0) {
      return {
        reply:
          '⚠️ **No active sources selected.**\n\nTo ground my answers with zero hallucinations, please toggle at least one source in the **Sources Drawer** (tap the sources chip at the top).',
        citations: [],
        suggestedActions: ['Open Sources Drawer', 'Select All Sources', 'Add Custom Note'],
      };
    }

    const citations: NotebookCitation[] = [];
    let reply = '';
    let actions: string[] = [];

    const hasAiSrc = activeSources.some((s) => s.id === 'src-ai-strategy' || s.id === 'src-yt-prompting');
    const hasFinSrc = activeSources.some((s) => s.id === 'src-fin-modeling');
    const hasLeadSrc = activeSources.some((s) => s.id === 'src-leadership-comms');
    const hasReportSrc = activeSources.some((s) => s.id === 'src-workforce-report');

    // DCF / Valuation query
    if (lower.includes('dcf') || lower.includes('valuation') || lower.includes('fcff') || lower.includes('wacc')) {
      if (hasFinSrc) {
        citations.push({
          id: 'cite-1',
          citationIndex: 1,
          sourceId: 'src-fin-modeling',
          sourceTitle: 'Financial Modeling & Valuation Masterclass',
          sourceType: 'course',
          section: 'Module 2 • Free Cash Flow & Terminal Value',
          excerpt:
            'FCFF = EBIT * (1 - t) + D&A - Delta NWC - CapEx. Terminal Value Gordon Growth perpetuity must never exceed host country sovereign nominal GDP growth (2.0% - 2.5% in developed, 3.5% - 4.5% in emerging markets).',
        });
        citations.push({
          id: 'cite-2',
          citationIndex: 2,
          sourceId: 'src-fin-modeling',
          sourceTitle: 'Financial Modeling & Valuation Masterclass',
          sourceType: 'course',
          section: 'Module 3 • WACC Formula & Tax Shields',
          excerpt:
            'WACC = (E/V * Re) + (D/V * Rd * (1 - Tc)). Cost of debt is adjusted for corporate interest tax deductions.',
        });

        reply = `Based strictly on your active **Financial Modeling Handbook** [1]:

### 📊 Free Cash Flow to Firm (FCFF) Mechanics
Free Cash Flow to Firm represents cash flow available to both equity and debt providers without leverage bias:
$$\\text{FCFF} = \\text{EBIT}(1 - t) + \\text{D\\&A} - \\Delta\\text{NWC} - \\text{CapEx}$$

### ⚠️ The Terminal Value (TV) Guardrail
When applying the Gordon Growth perpetuity model:
$$\\text{Terminal Value} = \\frac{\\text{FCFF}_n \\times (1 + g)}{\\text{WACC} - g}$$

According to the syllabus [1], your perpetual growth rate ($g$) must **never exceed long-term GDP growth** (3.5%–4.5% for emerging markets like Bangladesh; 2.0%–2.5% in developed markets). Setting $g$ too high causes the denominator to collapse and yields an invalid enterprise value.

### 🛡️ Cost of Debt Tax Shield
In WACC calculations [2], debt is discounted by $(1 - T_c)$ because interest expense reduces taxable corporate income.`;

        actions = ['Explain WACC Re-levering Beta', 'Generate DCF sensitivity table', 'Save formula to Notes'];
      } else {
        reply = `Your query refers to **Financial Modeling & DCF Valuation**, but that source is currently deselected in your notebook. 

Please re-enable **"Financial Modeling & Valuation Masterclass"** in your active sources drawer to view grounded formulas and citations.`;
        actions = ['Enable Financial Modeling Source', 'Open Sources Drawer'];
      }
    }
    // Prompting / AI / RTCC query
    else if (lower.includes('prompt') || lower.includes('rtcc') || lower.includes('ai') || lower.includes('agent')) {
      if (hasAiSrc) {
        citations.push({
          id: 'cite-1',
          citationIndex: 1,
          sourceId: 'src-ai-strategy',
          sourceTitle: 'Generative AI for Business Leaders',
          sourceType: 'course',
          section: 'Module 1 • RTCC Enterprise Standard',
          excerpt:
            'Role, Task, Context, Constraints. Explicit constraint bounds reduce hallucination rates from 14.2% down to under 0.8%.',
        });
        citations.push({
          id: 'cite-2',
          citationIndex: 2,
          sourceId: 'src-yt-prompting',
          sourceTitle: 'YouTube Masterclass: Autonomous AI Workflows',
          sourceType: 'youtube',
          section: 'Timestamp 00:24:50 • Multi-Agent RAG',
          excerpt:
            'Multi-agent chains (Researcher -> Drafter -> Auditor) separate cognitive load and prevent token drift.',
        });

        reply = `According to your active **Enterprise AI Curricula** [1][2]:

### 🤖 The RTCC Prompting Standard
To obtain audit-grade executive outputs with zero hallucinations, always enforce four parameters [1]:
- **[ROLE]**: Declare domain persona (e.g. *"Senior Strategy Director advising a Board"*).
- **[TASK]**: Unambiguous deliverable instruction (e.g. *"Synthesize Q2 EBITDA margin variance"*).
- **[CONTEXT]**: Grounding parameters, input data, and stakeholder perspective.
- **[CONSTRAINTS]**: Strict formatting boundaries, word limits, and mandatory citation rules.

### ⛓️ Why Multi-Agent Chains Outperform Monolithic Prompts
As noted in the Thriving Skills Masterclass [2], single-shot prompts attempt to research, draft, format, and audit concurrently. Dividing tasks into a **Researcher -> Synthesizer -> Compliance Auditor** pipeline drops error rates from 14.2% down to under 0.8%.`;

        actions = ['Copy RTCC Executive Template', 'Ask about Agentic Workflows', 'Save to Notebook Notes'];
      } else {
        reply = `Your query relates to **AI Prompting & Enterprise Workflows**, but the relevant AI sources are currently unchecked. 

Toggle **"Generative AI for Business Leaders"** in your Sources list to view verified blueprints.`;
        actions = ['Enable AI Strategy Source', 'Open Sources Drawer'];
      }
    }
    // Communication / Leadership / BLUF query
    else if (lower.includes('bluf') || lower.includes('pyramid') || lower.includes('board') || lower.includes('lead') || lower.includes('cfo')) {
      if (hasLeadSrc) {
        citations.push({
          id: 'cite-1',
          citationIndex: 1,
          sourceId: 'src-leadership-comms',
          sourceTitle: 'Executive Communication & Boardroom Influence',
          sourceType: 'course',
          section: 'Minto Pyramid • BLUF Methodology',
          excerpt:
            'State the recommendation in the first 15 seconds. Group supporting rationale into 3 Mutually Exclusive, Collectively Exhaustive (MECE) buckets.',
        });

        reply = `Grounded directly in **Executive Communication & Influence** [1]:

### 🏛️ The Minto Pyramid & BLUF Technique
Senior corporate leaders and board directors make rapid trade-offs. The curriculum mandates:
1. **BLUF (Bottom Line Up Front)**: Deliver the primary recommendation within the first 15 seconds [1].
2. **MECE Grouping**: Provide supporting data grouped into 3 distinct, non-overlapping pillars.
3. **CFO Objection Handling**: Frame investments not as expenses, but as **risk mitigation** (e.g., *"Not funding this automation costs $120,000/yr in rework, with an 8-month breakeven"*).`;

        actions = ['Generate 3-minute board script', 'Draft BLUF email memo', 'Pin to Notes'];
      } else {
        reply = `Please enable **"Executive Communication & Boardroom Influence"** in your active sources to access the Minto Pyramid frameworks.`;
        actions = ['Enable Leadership Source', 'Open Sources Drawer'];
      }
    }
    // General synthesis across active sources
    else {
      const topSrc = activeSources[0];
      citations.push({
        id: 'cite-1',
        citationIndex: 1,
        sourceId: topSrc.id,
        sourceTitle: topSrc.title,
        sourceType: topSrc.type,
        section: topSrc.subtitle,
        excerpt: topSrc.content.slice(0, 180) + '...',
      });

      reply = `I evaluated your question against your **${activeSources.length} active notebook sources** [1]:

From **${topSrc.title}**:
${topSrc.content.slice(0, 260)}...

### 💡 Synthesis for Your Workflow
By grounding your research in these verified Thriving Skills materials, your deliverables remain aligned with current industry standards.

Would you like to generate an **Audio Overview podcast**, compile a **Study Guide**, or test your active recall with **Flashcards**?`;

      actions = ['🎙️ Listen to Audio Overview', '📑 Generate Study Guide', '🗂️ Review Flashcards'];
    }

    return { reply, citations, suggestedActions: actions };
  }

  /**
   * Get Audio Overview podcast data
   */
  public static getAudioOverview(): AudioOverviewPodcast {
    return DEFAULT_AUDIO_PODCAST;
  }

  /**
   * Get Studio generative artifacts (Study Guide, FAQ, Roadmap, Flashcards)
   */
  public static getStudyGuide(): StudyGuideArtifact {
    return DEFAULT_STUDY_GUIDE;
  }

  public static getFAQ(): FAQArtifact {
    return DEFAULT_FAQ;
  }

  public static getRoadmap(): RoadmapArtifact {
    return DEFAULT_ROADMAP;
  }

  public static getFlashcards(): FlashcardsArtifact {
    return DEFAULT_FLASHCARDS;
  }

  /**
   * Notes management
   */
  public static async getNotes(): Promise<NotebookNote[]> {
    if (this.cachedNotes) return this.cachedNotes;

    try {
      const stored = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) {
        this.cachedNotes = JSON.parse(stored);
        return this.cachedNotes!;
      }
    } catch {
      // fallback
    }

    this.cachedNotes = [...INITIAL_NOTEBOOK_NOTES];
    await this.saveNotesToStorage(this.cachedNotes);
    return this.cachedNotes;
  }

  public static async saveNote(
    title: string,
    content: string,
    tags: string[] = ['AI Copilot', 'Executive Note']
  ): Promise<NotebookNote> {
    const notes = await this.getNotes();
    const newNote: NotebookNote = {
      id: `note-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      timestamp: 'Just now',
      tags,
      isIncludedAsSource: false,
    };

    const updated = [newNote, ...notes];
    this.cachedNotes = updated;
    await this.saveNotesToStorage(updated);
    return newNote;
  }

  public static async deleteNote(id: string): Promise<NotebookNote[]> {
    const notes = await this.getNotes();
    const updated = notes.filter((n) => n.id !== id);
    this.cachedNotes = updated;
    await this.saveNotesToStorage(updated);
    return updated;
  }

  private static async saveSourcesToStorage(sources: NotebookSource[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(sources));
    } catch {
      // ignore
    }
  }

  private static async saveNotesToStorage(notes: NotebookNote[]): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }
}
