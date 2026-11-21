import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
  Polygon,
  Line,
} from 'react-native-svg';

export type CategoryDepartmentId =
  | 'design'
  | 'software'
  | 'networking'
  | 'marketing'
  | 'hacking'
  | 'development'
  | 'fitness'
  | 'business';

interface CategoryIllustrationIconProps {
  category: CategoryDepartmentId | string;
  size?: number;
  style?: ViewStyle;
}

export const CategoryIllustrationIcon: React.FC<CategoryIllustrationIconProps> = ({
  category,
  size = 52,
  style,
}) => {
  const normCat = (category || '').toLowerCase().trim();

  // 1. DESIGN: Stylized Pen Tool with Cyan Bezier Handles and Golden Nib
  if (normCat === 'design' || normCat.includes('design') || normCat.includes('ui') || normCat.includes('ux')) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="penGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FDE68A" />
              <Stop offset="50%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#D97706" />
            </LinearGradient>
            <LinearGradient id="cyanArc" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#06B6D4" />
              <Stop offset="100%" stopColor="#0891B2" />
            </LinearGradient>
          </Defs>

          {/* Cyan Bezier Arc Curve */}
          <Path
            d="M12 28 C 18 14, 46 14, 52 28"
            stroke="url(#cyanArc)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Left Handle Node */}
          <Line x1="12" y1="28" x2="18" y2="28" stroke="#0891B2" strokeWidth="2.5" />
          <Rect x="8" y="24" width="8" height="8" rx="2" fill="#06B6D4" stroke="#0E7490" strokeWidth="1.5" />

          {/* Right Handle Node */}
          <Line x1="46" y1="28" x2="52" y2="28" stroke="#0891B2" strokeWidth="2.5" />
          <Rect x="48" y="24" width="8" height="8" rx="2" fill="#06B6D4" stroke="#0E7490" strokeWidth="1.5" />

          {/* Golden Pen Tool Body / Nib */}
          <Path
            d="M32 16 L40 32 L36 46 L32 54 L28 46 L24 32 Z"
            fill="url(#penGold)"
            stroke="#B45309"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Nib Center Slit & Ink Hole */}
          <Line x1="32" y1="36" x2="32" y2="52" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
          <Circle cx="32" cy="35" r="2.2" fill="#78350F" />

          {/* Bevel highlights */}
          <Path d="M32 16 L40 32 L32 35 Z" fill="rgba(255, 255, 255, 0.35)" />
        </Svg>
      </View>
    );
  }

  // 2. SOFTWARE: Monitor Screen with Cyan Display and Golden Cog/Gear
  if (normCat === 'software' || normCat.includes('software') || normCat.includes('excel') || normCat.includes('tool')) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="screenTeal" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#2DD4BF" />
              <Stop offset="100%" stopColor="#0D9488" />
            </LinearGradient>
            <LinearGradient id="gearGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FCD34D" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
          </Defs>

          {/* Monitor Stand */}
          <Path d="M28 46 L36 46 L38 54 L26 54 Z" fill="#94A3B8" />
          <Rect x="22" y="53" width="20" height="3" rx="1.5" fill="#64748B" />

          {/* Monitor Outer Frame */}
          <Rect x="10" y="16" width="38" height="30" rx="4" fill="#0F766E" />
          <Rect x="12" y="18" width="34" height="24" rx="2.5" fill="url(#screenTeal)" />

          {/* Software Window Header */}
          <Rect x="14" y="20" width="30" height="5" rx="1" fill="#115E59" />
          <Circle cx="17" cy="22.5" r="1.2" fill="#F87171" />
          <Circle cx="21" cy="22.5" r="1.2" fill="#FBBF24" />
          <Circle cx="25" cy="22.5" r="1.2" fill="#34D399" />

          {/* Code/Layout Blocks inside monitor */}
          <Rect x="15" y="28" width="12" height="3" rx="1" fill="#FFFFFF" fillOpacity="0.85" />
          <Rect x="15" y="33" width="18" height="3" rx="1" fill="#CCFBF1" />
          <Rect x="15" y="38" width="8" height="2.5" rx="1" fill="#FFFFFF" fillOpacity="0.7" />

          {/* Golden Gear on top-right */}
          <G transform="translate(42, 12)">
            <Circle cx="9" cy="9" r="6" fill="url(#gearGold)" stroke="#D97706" strokeWidth="1.2" />
            {/* Gear teeth */}
            <Rect x="7.5" y="0.5" width="3" height="3" rx="0.8" fill="#F59E0B" />
            <Rect x="7.5" y="14.5" width="3" height="3" rx="0.8" fill="#F59E0B" />
            <Rect x="0.5" y="7.5" width="3" height="3" rx="0.8" fill="#F59E0B" />
            <Rect x="14.5" y="7.5" width="3" height="3" rx="0.8" fill="#F59E0B" />
            {/* Center hole */}
            <Circle cx="9" cy="9" r="2.5" fill="#FFFFFF" stroke="#D97706" strokeWidth="1" />
          </G>
        </Svg>
      </View>
    );
  }

  // 3. NETWORKING: Light Blue Globe with Interconnected Pink/Coral Nodes
  if (normCat === 'networking' || normCat.includes('network') || normCat.includes('cloud')) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="globeBlue" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#BAE6FD" />
              <Stop offset="70%" stopColor="#7DD3FC" />
              <Stop offset="100%" stopColor="#38BDF8" />
            </LinearGradient>
            <LinearGradient id="nodePink" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FDA4AF" />
              <Stop offset="100%" stopColor="#F43F5E" />
            </LinearGradient>
          </Defs>

          {/* Globe Sphere */}
          <Circle cx="32" cy="32" r="18" fill="url(#globeBlue)" fillOpacity="0.8" stroke="#0284C7" strokeWidth="1.5" />

          {/* Latitude / Longitude Curvature Lines */}
          <Path d="M14 32 Q 32 24 50 32" stroke="#0284C7" strokeWidth="1" strokeDasharray="2 2" fill="none" />
          <Path d="M14 32 Q 32 40 50 32" stroke="#0284C7" strokeWidth="1" strokeDasharray="2 2" fill="none" />
          <Path d="M32 14 Q 24 32 32 50" stroke="#0284C7" strokeWidth="1" strokeDasharray="2 2" fill="none" />
          <Path d="M32 14 Q 40 32 32 50" stroke="#0284C7" strokeWidth="1" strokeDasharray="2 2" fill="none" />

          {/* Network Connection Lines */}
          <Line x1="20" y1="24" x2="32" y2="20" stroke="#E11D48" strokeWidth="1.5" />
          <Line x1="32" y1="20" x2="44" y2="26" stroke="#E11D48" strokeWidth="1.5" />
          <Line x1="20" y1="24" x2="24" y2="40" stroke="#E11D48" strokeWidth="1.5" />
          <Line x1="24" y1="40" x2="38" y2="42" stroke="#E11D48" strokeWidth="1.5" />
          <Line x1="38" y1="42" x2="44" y2="26" stroke="#E11D48" strokeWidth="1.5" />
          <Line x1="32" y1="20" x2="24" y2="40" stroke="#E11D48" strokeWidth="1.2" strokeOpacity="0.7" />

          {/* Interconnected Node Dots */}
          <Circle cx="20" cy="24" r="3.2" fill="url(#nodePink)" stroke="#FFFFFF" strokeWidth="1.2" />
          <Circle cx="32" cy="20" r="3.6" fill="url(#nodePink)" stroke="#FFFFFF" strokeWidth="1.2" />
          <Circle cx="44" cy="26" r="3.4" fill="url(#nodePink)" stroke="#FFFFFF" strokeWidth="1.2" />
          <Circle cx="24" cy="40" r="3.2" fill="url(#nodePink)" stroke="#FFFFFF" strokeWidth="1.2" />
          <Circle cx="38" cy="42" r="3.6" fill="url(#nodePink)" stroke="#FFFFFF" strokeWidth="1.2" />
        </Svg>
      </View>
    );
  }

  // 4. MARKETING: 3D Red & Gold Megaphone / Speaker with Sound Waves
  if (normCat === 'marketing' || normCat.includes('market') || normCat.includes('sales')) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="hornRed" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#F87171" />
              <Stop offset="50%" stopColor="#EF4444" />
              <Stop offset="100%" stopColor="#B91C1C" />
            </LinearGradient>
            <LinearGradient id="hornGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FDE68A" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
          </Defs>

          {/* Megaphone Handle */}
          <Path d="M22 36 L18 48 L22 49 L26 39 Z" fill="#64748B" stroke="#475569" strokeWidth="1.2" />

          {/* Megaphone Red Cone Body */}
          <Path
            d="M16 28 L36 18 L38 46 L16 36 Z"
            fill="url(#hornRed)"
            stroke="#991B1B"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Back Cap (Grey/Dark) */}
          <Path d="M14 28 C 12 28, 12 36, 14 36 Z" fill="#475569" stroke="#334155" strokeWidth="1.2" />

          {/* Golden Mouth Ellipse/Rim */}
          <Path
            d="M36 18 C 40 18, 43 24, 43 32 C 43 40, 40 46, 36 46 Z"
            fill="url(#hornGold)"
            stroke="#D97706"
            strokeWidth="1.5"
          />

          {/* Inner dark speaker hole */}
          <Path
            d="M37 22 C 39 22, 40 26, 40 32 C 40 38, 39 42, 37 42 Z"
            fill="#78350F"
          />

          {/* Sound Waves radiating to the right */}
          <Path
            d="M47 24 C 50 28, 50 36, 47 40"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Path
            d="M52 20 C 56 26, 56 38, 52 44"
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  // 5. HACKING: Hacker in Dark Hoodie Silhouette with Glowing Laptop
  if (normCat === 'hacking' || normCat.includes('hack') || normCat.includes('cyber') || normCat.includes('security')) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="hoodieDark" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#334155" />
              <Stop offset="100%" stopColor="#0F172A" />
            </LinearGradient>
            <LinearGradient id="screenGlow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#67E8F9" />
              <Stop offset="100%" stopColor="#06B6D4" />
            </LinearGradient>
          </Defs>

          {/* Hood Shape (Head & Shoulders) */}
          <Path
            d="M32 12 C 22 12, 20 22, 20 28 C 16 32, 12 40, 12 46 L 52 46 C 52 40, 48 32, 44 28 C 44 22, 42 12, 32 12 Z"
            fill="url(#hoodieDark)"
            stroke="#1E293B"
            strokeWidth="1.5"
          />

          {/* Shadowed Face Opening */}
          <Path
            d="M32 17 C 27 17, 26 23, 26 27 C 26 31, 29 33, 32 33 C 35 33, 38 31, 38 27 C 38 23, 37 17, 32 17 Z"
            fill="#020617"
          />

          {/* Mask / Eyes Glow */}
          <Path d="M28 26 L31 26 M33 26 L36 26" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" />

          {/* Laptop Open Screen */}
          <Polygon points="22,38 42,38 45,46 19,46" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <Polygon points="24,39 40,39 43,45 21,45" fill="url(#screenGlow)" />

          {/* Glowing Code / Terminal Prompt on screen */}
          <Line x1="26" y1="42" x2="34" y2="42" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
          <Line x1="26" y1="44" x2="31" y2="44" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />

          {/* Laptop Base */}
          <Rect x="16" y="46" width="32" height="3" rx="1.5" fill="#64748B" />
        </Svg>
      </View>
    );
  }

  // 6. DEVELOPMENT: Monitor Screen with Dual Interlocking Metallic Gears
  if (normCat === 'development' || normCat.includes('dev') || normCat.includes('python') || normCat.includes('code') || normCat.includes('programming')) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="gearSilver" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#E2E8F0" />
              <Stop offset="50%" stopColor="#94A3B8" />
              <Stop offset="100%" stopColor="#64748B" />
            </LinearGradient>
            <LinearGradient id="gearSlate" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#94A3B8" />
              <Stop offset="100%" stopColor="#475569" />
            </LinearGradient>
          </Defs>

          {/* Monitor Stand */}
          <Path d="M28 44 L36 44 L38 52 L26 52 Z" fill="#64748B" />
          <Rect x="22" y="51" width="20" height="3" rx="1.5" fill="#475569" />

          {/* Monitor Outer Frame */}
          <Rect x="12" y="16" width="40" height="28" rx="4" fill="#334155" />
          <Rect x="14" y="18" width="36" height="24" rx="2" fill="#F1F5F9" />

          {/* Left Gear (Interlocking) */}
          <G transform="translate(20, 20)">
            <Circle cx="8" cy="8" r="6.5" fill="url(#gearSilver)" stroke="#475569" strokeWidth="1.2" />
            {/* Teeth */}
            <Rect x="6.5" y="0" width="3" height="2.5" rx="0.6" fill="#64748B" />
            <Rect x="6.5" y="13.5" width="3" height="2.5" rx="0.6" fill="#64748B" />
            <Rect x="0" y="6.5" width="2.5" height="3" rx="0.6" fill="#64748B" />
            <Rect x="13.5" y="6.5" width="2.5" height="3" rx="0.6" fill="#64748B" />
            {/* Center Hole */}
            <Circle cx="8" cy="8" r="2.8" fill="#F1F5F9" stroke="#475569" strokeWidth="1" />
          </G>

          {/* Right Gear (Interlocking, smaller) */}
          <G transform="translate(32, 26)">
            <Circle cx="6" cy="6" r="5" fill="url(#gearSlate)" stroke="#334155" strokeWidth="1.2" />
            {/* Teeth */}
            <Rect x="5" y="0" width="2" height="2" rx="0.5" fill="#334155" />
            <Rect x="5" y="10" width="2" height="2" rx="0.5" fill="#334155" />
            <Rect x="0" y="5" width="2" height="2" rx="0.5" fill="#334155" />
            <Rect x="10" y="5" width="2" height="2" rx="0.5" fill="#334155" />
            {/* Center Hole */}
            <Circle cx="6" cy="6" r="2.2" fill="#F1F5F9" stroke="#334155" strokeWidth="1" />
          </G>
        </Svg>
      </View>
    );
  }

  // 7. FITNESS: Vibrant Red 3D Heart with Workout Dumbbell / Barbell
  if (normCat === 'fitness' || normCat.includes('fitness') || normCat.includes('health') || normCat.includes('wellness')) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="heartRed" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FB7185" />
              <Stop offset="40%" stopColor="#EF4444" />
              <Stop offset="100%" stopColor="#BE123C" />
            </LinearGradient>
            <LinearGradient id="metalBar" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#94A3B8" />
              <Stop offset="50%" stopColor="#E2E8F0" />
              <Stop offset="100%" stopColor="#64748B" />
            </LinearGradient>
          </Defs>

          {/* Heart Shape */}
          <Path
            d="M32 48 C 32 48, 14 36, 14 24 C 14 17, 20 13, 26 15 C 29 16, 31 18, 32 20 C 33 18, 35 16, 38 15 C 44 13, 50 17, 50 24 C 50 36, 32 48, 32 48 Z"
            fill="url(#heartRed)"
            stroke="#9F1239"
            strokeWidth="1.5"
          />

          {/* Heart Highlight */}
          <Path
            d="M20 20 C 18 24, 18 28, 20 30"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Pulse ECG Line across Heart */}
          <Path
            d="M22 28 L 26 28 L 28 23 L 31 33 L 34 26 L 36 28 L 42 28"
            stroke="#FEF08A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dumbbell Metal Bar passing horizontally in front */}
          <G transform="translate(0, 10)">
            <Rect x="16" y="27" width="32" height="3" rx="1.5" fill="url(#metalBar)" stroke="#475569" strokeWidth="0.8" />

            {/* Left Weight Plates */}
            <Rect x="14" y="24" width="3" height="9" rx="1" fill="#334155" stroke="#1E293B" strokeWidth="0.8" />
            <Rect x="11" y="22" width="3" height="13" rx="1" fill="#475569" stroke="#1E293B" strokeWidth="0.8" />

            {/* Right Weight Plates */}
            <Rect x="47" y="24" width="3" height="9" rx="1" fill="#334155" stroke="#1E293B" strokeWidth="0.8" />
            <Rect x="50" y="22" width="3" height="13" rx="1" fill="#475569" stroke="#1E293B" strokeWidth="0.8" />
          </G>
        </Svg>
      </View>
    );
  }

  // 8. BUSINESS: Multi-Colored Ascending Bar Chart with Rising Red Arrow
  // (normCat === 'business' or default)
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Defs>
          <LinearGradient id="redArrow" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor="#F87171" />
            <Stop offset="100%" stopColor="#DC2626" />
          </LinearGradient>
        </Defs>

        {/* Base Axis Line */}
        <Line x1="12" y1="50" x2="52" y2="50" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

        {/* Bar 1: Cyan/Sky Blue */}
        <Rect x="16" y="38" width="6" height="12" rx="1.5" fill="#38BDF8" />

        {/* Bar 2: Golden Amber */}
        <Rect x="25" y="30" width="6" height="20" rx="1.5" fill="#FBBF24" />

        {/* Bar 3: Emerald Green */}
        <Rect x="34" y="22" width="6" height="28" rx="1.5" fill="#34D399" />

        {/* Bar 4: Orange / Coral */}
        <Rect x="43" y="16" width="6" height="34" rx="1.5" fill="#FB923C" />

        {/* Ascending Red Growth Curve Arrow */}
        <Path
          d="M14 42 Q 28 32, 48 14"
          stroke="url(#redArrow)"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Arrowhead pointing Top-Right */}
        <Polygon
          points="44,12 51,13 49,20"
          fill="#DC2626"
        />
      </Svg>
    </View>
  );
};
