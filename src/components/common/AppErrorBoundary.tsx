import { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CacheManager } from '../../services/cache/cacheManager';
import { TelemetryService } from '../../services/telemetry/telemetryService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Production-grade Error Boundary for Thriving Skills.
 * Prevents full-app white screen crashes by catching uncaught React exceptions,
 * providing one-tap instant recovery and session preservation.
 */
export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] Uncaught React exception caught:', error);
    console.error('[AppErrorBoundary] Component stack trace:', errorInfo?.componentStack);
    TelemetryService.captureException(error, { componentStack: errorInfo?.componentStack });
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleClearCacheAndReset = async () => {
    try {
      await CacheManager.clearAll();
    } catch { }
    this.handleReset();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.content}>
            {/* Logo Wrap */}
            <View style={styles.logoWrap}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.wordmark}>
              Thriving <Text style={{ color: '#E34234' }}>Skills</Text>
            </Text>
            <Text style={styles.tagline}>
              জাতির দক্ষতা বিনির্মাণে • Building a Skilled Nation
            </Text>

            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="refresh-circle" size={40} color="#FFB606" />
              </View>
              <Text style={styles.cardTitle}>Workspace Interrupted</Text>
              <Text style={styles.cardSubtitle}>
                An unexpected UI layout issue occurred. Your courses, progress, and certificates remain 100% safe.
              </Text>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={this.handleReset}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Reload Learning Workspace"
              >
                <Ionicons name="reload" size={18} color="#102F53" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Reload Learning Workspace</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={this.handleClearCacheAndReset}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Clear Cache and Reload"
              >
                <Ionicons name="trash-outline" size={15} color="#94A3B8" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryBtnText}>Reset Cache & Reload</Text>
              </TouchableOpacity>
            </View>

            {/* Error Diagnostics in development mode */}
            {typeof __DEV__ !== 'undefined' && __DEV__ && this.state.error && (
              <ScrollView style={styles.debugScroll} contentContainerStyle={styles.debugContent}>
                <Text style={styles.debugText}>
                  {this.state.error.name}: {this.state.error.message}
                </Text>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102F53',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  wordmark: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB606',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#1F1F23',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 182, 6, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFB606',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#FFB606',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#102F53',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    width: '100%',
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  debugScroll: {
    marginTop: 16,
    maxHeight: 120,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    padding: 10,
  },
  debugContent: {
    paddingBottom: 4,
  },
  debugText: {
    color: '#F87171',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
