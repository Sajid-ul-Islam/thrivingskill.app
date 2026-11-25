import { StyleSheet } from 'react-native';
import { shape } from '../../theme/shapes';

export const lessonPlayerStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoPlayerWrapper: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  fullscreenWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commuteToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBanner: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 2,
    borderRadius: shape.medium,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  adminBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  adminBannerTitle: {
    color: '#E34234',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adminBannerSub: {
    color: '#F8FAFC',
    fontSize: 10.5,
  },
  previewBanner: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 2,
    borderRadius: shape.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  previewBannerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lowerLearningArea: {
    flex: 1,
  },
  tabsStrip: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minWidth: 0,
    minHeight: 44,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 12,
  },
  horizontalPagingScroll: {
    flex: 1,
  },
  tabContentScroll: {
    padding: 16,
  },
  notesFAB: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E34234',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  notesFABText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  playbackToolbar: {
    paddingHorizontal: 8,
  },
  playbackLeftControls: {
    gap: 8,
    flexShrink: 0,
  },
  playbackRightControls: {
    gap: 6,
  },
});
