import { StyleSheet } from 'react-native';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

export const courseDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  notFoundCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBookmark: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    paddingHorizontal: 16,
  },
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
    minWidth: '100%',
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 80,
  },
  tabLabel: {
    fontSize: 12.5,
  },
  curriculumTab: {
    paddingBottom: 8,
  },
  devBypassBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: shape.medium,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  devBypassHeader: {
    gap: 2,
  },
  devBypassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  devBypassTitle: {
    color: '#E34234',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  devBypassSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
  },
  devActionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  devActionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E34234',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 6,
  },
  devActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 6,
  },
  devActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
