import { CATEGORY_LESSON_PLAYLISTS, resolveLessonVideoData } from '../data/lessonVideosRegistry';

describe('resolveLessonVideoData', () => {
  it('preserves direct Vimeo videoIntro URLs and extracts the video ID', () => {
    const data = resolveLessonVideoData(
      { id: '999', title: 'Any Course' },
      {
        id: 'l1',
        title: 'Custom Vimeo Lesson',
        videoIntro: '<iframe src="https://player.vimeo.com/video/987654321"></iframe>',
      },
      0
    );

    expect(data.videoType).toBe('vimeo');
    expect(data.videoUrl).toBe('https://player.vimeo.com/video/987654321');
    expect(data.title).toBe('Custom Vimeo Lesson');
  });

  it('preserves direct lesson.videoUrl containing vimeo and wraps it in an iframe', () => {
    const data = resolveLessonVideoData(
      { id: '999', title: 'Any Course' },
      {
        id: 'l2',
        title: 'Direct Vimeo URL',
        videoUrl: 'https://player.vimeo.com/video/555111222',
      },
      0
    );

    expect(data.videoType).toBe('vimeo');
    expect(data.videoUrl).toBe('https://player.vimeo.com/video/555111222');
    expect(data.videoIntro).toContain('https://player.vimeo.com/video/555111222');
  });

  it('resolves course-specific playlist by course ID (e.g. 88180 -> generative-ai)', () => {
    const data = resolveLessonVideoData({ id: '88180', title: 'Unmatched Title' }, undefined, 1);

    expect(data).toEqual(CATEGORY_LESSON_PLAYLISTS['generative-ai'][1]);
  });

  it('falls back to keyword category matching and wraps lessonIndex cleanly', () => {
    const data = resolveLessonVideoData(
      { id: 'unknown-1', title: 'Corporate Excel & Power BI Reporting' },
      undefined,
      10
    );

    const expectedPlaylist = CATEGORY_LESSON_PLAYLISTS.excel;
    expect(data).toEqual(expectedPlaylist[10 % expectedPlaylist.length]);
  });

  it('falls back to leadership playlist when no course or keyword matches', () => {
    const data = resolveLessonVideoData(
      { id: 'misc', title: 'General Workshop', category: 'other' },
      undefined,
      -2
    );

    const expectedPlaylist = CATEGORY_LESSON_PLAYLISTS.leadership;
    expect(data).toEqual(expectedPlaylist[2 % expectedPlaylist.length]);
  });
});
