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
  | 'generative-ai'
  | 'excel'
  | 'finance-accounting-legal'
  | 'human-resource-management'
  | 'leadership-management'
  | 'personal-development'
  | 'supply-chain-management'
  | 'data-science'
  | 'job-seekers-skills'
  | 'research-courses'
  | 'business-strategy'
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

  // 1. SUPPLY CHAIN MANAGEMENT & LOGISTICS (Cargo Delivery Truck & Global Flow)
  if (
    normCat === 'supply-chain-management' ||
    normCat === 'supply-chain' ||
    normCat.includes('supply') ||
    normCat.includes('logistics') ||
    normCat.includes('procurement')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="scmBox" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#0284C7" />
            </LinearGradient>
            <LinearGradient id="scmCab" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#1E293B" />
              <Stop offset="100%" stopColor="#0F172A" />
            </LinearGradient>
          </Defs>

          {/* Road / Speed Trail Lines */}
          <Line
            x1="8"
            y1="52"
            x2="56"
            y2="52"
            stroke="#CBD5E1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Line
            x1="14"
            y1="56"
            x2="42"
            y2="56"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Logistics Loop Circular Arrow (Top-Right) */}
          <Path
            d="M38 12 A 10 10 0 1 1 52 24"
            stroke="#10B981"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <Polygon points="54,20 54,27 48,25" fill="#10B981" />

          {/* Truck Cargo Box */}
          <Rect
            x="12"
            y="22"
            width="28"
            height="22"
            rx="3"
            fill="url(#scmBox)"
            stroke="#0369A1"
            strokeWidth="1.5"
          />
          {/* Cargo Container Ridges */}
          <Line
            x1="19"
            y1="26"
            x2="19"
            y2="40"
            stroke="#BAE6FD"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <Line
            x1="26"
            y1="26"
            x2="26"
            y2="40"
            stroke="#BAE6FD"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <Line
            x1="33"
            y1="26"
            x2="33"
            y2="40"
            stroke="#BAE6FD"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Truck Cabin */}
          <Path
            d="M40 28 L48 28 L53 35 L53 44 L40 44 Z"
            fill="url(#scmCab)"
            stroke="#0F172A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Windshield */}
          <Path d="M43 31 L47 31 L50 35 L43 35 Z" fill="#67E8F9" />
          {/* Headlight */}
          <Rect x="51.5" y="39" width="2" height="3" rx="1" fill="#FBBF24" />

          {/* Wheels */}
          <Circle cx="20" cy="45" r="5" fill="#334155" stroke="#1E293B" strokeWidth="1.5" />
          <Circle cx="20" cy="45" r="2" fill="#94A3B8" />

          <Circle cx="45" cy="45" r="5" fill="#334155" stroke="#1E293B" strokeWidth="1.5" />
          <Circle cx="45" cy="45" r="2" fill="#94A3B8" />
        </Svg>
      </View>
    );
  }

  // 2. GENERATIVE AI & 4IR (Neural Brain with Quantum Sparkle & Synaptic Nodes)
  if (
    normCat === 'generative-ai' ||
    normCat === 'ai' ||
    normCat.includes('generative') ||
    normCat.includes('4ir') ||
    /\bai\b/i.test(normCat) ||
    normCat.includes('artificial')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="aiPurple" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#A855F7" />
              <Stop offset="50%" stopColor="#8B5CF6" />
              <Stop offset="100%" stopColor="#6366F1" />
            </LinearGradient>
            <LinearGradient id="aiCyan" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#06B6D4" />
            </LinearGradient>
            <LinearGradient id="aiGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
          </Defs>

          {/* Left Brain Hemisphere Silhouette */}
          <Path
            d="M30 18 C22 18 16 23 16 30 C16 34 18 37 20 40 C18 43 19 48 24 50 C27 51 30 49 30 49 Z"
            fill="url(#aiPurple)"
            fillOpacity="0.85"
            stroke="#7C3AED"
            strokeWidth="1.5"
          />

          {/* Right Brain Hemisphere Silhouette */}
          <Path
            d="M34 18 C42 18 48 23 48 30 C48 34 46 37 44 40 C46 43 45 48 40 50 C37 51 34 49 34 49 Z"
            fill="url(#aiCyan)"
            fillOpacity="0.85"
            stroke="#0891B2"
            strokeWidth="1.5"
          />

          {/* Synaptic Network Connections */}
          <Line x1="22" y1="28" x2="28" y2="24" stroke="#EDE9FE" strokeWidth="1.5" />
          <Line x1="28" y1="24" x2="32" y2="32" stroke="#EDE9FE" strokeWidth="1.5" />
          <Line x1="22" y1="28" x2="25" y2="42" stroke="#EDE9FE" strokeWidth="1.5" />
          <Line x1="25" y1="42" x2="32" y2="32" stroke="#EDE9FE" strokeWidth="1.5" />

          <Line x1="42" y1="28" x2="36" y2="24" stroke="#CFFAFE" strokeWidth="1.5" />
          <Line x1="36" y1="24" x2="32" y2="32" stroke="#CFFAFE" strokeWidth="1.5" />
          <Line x1="42" y1="28" x2="39" y2="42" stroke="#CFFAFE" strokeWidth="1.5" />
          <Line x1="39" y1="42" x2="32" y2="32" stroke="#CFFAFE" strokeWidth="1.5" />

          {/* Neural Synapse Nodes */}
          <Circle cx="22" cy="28" r="2.5" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="1.2" />
          <Circle cx="28" cy="24" r="2.5" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="1.2" />
          <Circle cx="25" cy="42" r="2.5" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="1.2" />

          <Circle cx="42" cy="28" r="2.5" fill="#FFFFFF" stroke="#06B6D4" strokeWidth="1.2" />
          <Circle cx="36" cy="24" r="2.5" fill="#FFFFFF" stroke="#06B6D4" strokeWidth="1.2" />
          <Circle cx="39" cy="42" r="2.5" fill="#FFFFFF" stroke="#06B6D4" strokeWidth="1.2" />

          {/* Central AI Quantum Spark Star (4-Point Diamond Burst) */}
          <Path
            d="M32 20 L35 30 L45 32 L35 34 L32 44 L29 34 L19 32 L29 30 Z"
            fill="url(#aiGold)"
            stroke="#D97706"
            strokeWidth="1.2"
          />
          <Circle cx="32" cy="32" r="2.2" fill="#FFFFFF" />

          {/* Top Orbiting Quantum Sparkles */}
          <Circle cx="32" cy="11" r="1.8" fill="#FBBF24" />
          <Circle cx="12" cy="24" r="1.5" fill="#A855F7" />
          <Circle cx="52" cy="24" r="1.5" fill="#38BDF8" />
        </Svg>
      </View>
    );
  }

  // 3. MICROSOFT EXCEL & SPREADSHEETS (Emerald Spreadsheet Workbook with Formulas)
  if (
    normCat === 'excel' ||
    normCat.includes('excel') ||
    normCat.includes('spreadsheet') ||
    normCat.includes('sheet')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="excelGreen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#16A34A" />
              <Stop offset="50%" stopColor="#15803D" />
              <Stop offset="100%" stopColor="#166534" />
            </LinearGradient>
            <LinearGradient id="excelTab" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#22C55E" />
              <Stop offset="100%" stopColor="#15803D" />
            </LinearGradient>
          </Defs>

          {/* Background Workbook Shadow / Binder */}
          <Rect x="16" y="14" width="36" height="42" rx="4" fill="#052E16" fillOpacity="0.15" />

          {/* Main Excel Sheet Body */}
          <Rect
            x="14"
            y="12"
            width="38"
            height="40"
            rx="4"
            fill="#FFFFFF"
            stroke="#16A34A"
            strokeWidth="2"
          />

          {/* Header Bar */}
          <Path
            d="M14 16 C14 13.8 15.8 12 18 12 L50 12 C52.2 12 54 13.8 54 16 L54 22 L14 22 Z"
            fill="url(#excelGreen)"
          />
          {/* Header Text / fx symbol */}
          <Line
            x1="18"
            y1="17"
            x2="30"
            y2="17"
            stroke="#DCFCE7"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Circle cx="48" cy="17" r="2" fill="#FBBF24" />

          {/* Grid Rows & Columns */}
          <Line x1="14" y1="28" x2="54" y2="28" stroke="#DCFCE7" strokeWidth="1.2" />
          <Line x1="14" y1="34" x2="54" y2="34" stroke="#DCFCE7" strokeWidth="1.2" />
          <Line x1="14" y1="40" x2="54" y2="40" stroke="#DCFCE7" strokeWidth="1.2" />
          <Line x1="14" y1="46" x2="54" y2="46" stroke="#DCFCE7" strokeWidth="1.2" />

          <Line x1="28" y1="22" x2="28" y2="52" stroke="#DCFCE7" strokeWidth="1.2" />
          <Line x1="41" y1="22" x2="41" y2="52" stroke="#DCFCE7" strokeWidth="1.2" />

          {/* Highlighted Excel Cell */}
          <Rect
            x="28"
            y="34"
            width="13"
            height="6"
            fill="#86EFAC"
            fillOpacity="0.6"
            stroke="#16A34A"
            strokeWidth="1.2"
          />

          {/* Floating Excel "X" Iconic Brand Badge (Top-Left 3D Offset) */}
          <G transform="translate(8, 18)">
            <Rect
              x="0"
              y="0"
              width="16"
              height="18"
              rx="3"
              fill="url(#excelTab)"
              stroke="#14532D"
              strokeWidth="1.2"
            />
            {/* Bold Stylized 'X' */}
            <Line
              x1="4"
              y1="4"
              x2="12"
              y2="14"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <Line
              x1="12"
              y1="4"
              x2="4"
              y2="14"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </G>
        </Svg>
      </View>
    );
  }

  // 4. FINANCE, ACCOUNTING & LEGAL (Golden Balance Scale of Justice & Finance Ledger)
  if (
    normCat === 'finance-accounting-legal' ||
    normCat === 'finance' ||
    normCat.includes('finance') ||
    normCat.includes('account') ||
    normCat.includes('legal') ||
    normCat.includes('tax')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="scaleGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FDE68A" />
              <Stop offset="50%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#B45309" />
            </LinearGradient>
            <LinearGradient id="coinGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="100%" stopColor="#D97706" />
            </LinearGradient>
          </Defs>

          {/* Scale Base Pedestal */}
          <Rect
            x="20"
            y="52"
            width="24"
            height="4"
            rx="2"
            fill="#334155"
            stroke="#1E293B"
            strokeWidth="1.2"
          />
          <Rect x="26" y="48" width="12" height="4" rx="1.5" fill="#64748B" />

          {/* Central Vertical Pillar */}
          <Line
            x1="32"
            y1="18"
            x2="32"
            y2="48"
            stroke="url(#scaleGold)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Circle
            cx="32"
            cy="18"
            r="3.5"
            fill="url(#scaleGold)"
            stroke="#B45309"
            strokeWidth="1.2"
          />

          {/* Crossbeam Beam (Balanced horizontal) */}
          <Path
            d="M14 20 L50 20"
            stroke="url(#scaleGold)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Left Pan Chains & Bowl (Finance Stack) */}
          <Line x1="15" y1="20" x2="11" y2="34" stroke="#94A3B8" strokeWidth="1.2" />
          <Line x1="15" y1="20" x2="19" y2="34" stroke="#94A3B8" strokeWidth="1.2" />
          <Path
            d="M9 34 Q 15 41 21 34 Z"
            fill="url(#scaleGold)"
            stroke="#B45309"
            strokeWidth="1.2"
          />
          {/* Stacked Currency Coins inside Left Pan */}
          <Rect
            x="12"
            y="29"
            width="6"
            height="2.5"
            rx="1"
            fill="url(#coinGold)"
            stroke="#B45309"
            strokeWidth="0.8"
          />
          <Rect
            x="11.5"
            y="26"
            width="7"
            height="2.5"
            rx="1"
            fill="url(#coinGold)"
            stroke="#B45309"
            strokeWidth="0.8"
          />

          {/* Right Pan Chains & Bowl (Legal Compliance Scroll / Ledger) */}
          <Line x1="49" y1="20" x2="45" y2="34" stroke="#94A3B8" strokeWidth="1.2" />
          <Line x1="49" y1="20" x2="53" y2="34" stroke="#94A3B8" strokeWidth="1.2" />
          <Path
            d="M43 34 Q 49 41 55 34 Z"
            fill="url(#scaleGold)"
            stroke="#B45309"
            strokeWidth="1.2"
          />
          {/* Legal Scroll / Document in Right Pan */}
          <Rect
            x="46"
            y="24"
            width="6"
            height="8"
            rx="1.5"
            fill="#F8FAFC"
            stroke="#64748B"
            strokeWidth="1"
          />
          <Line x1="48" y1="27" x2="50" y2="27" stroke="#0284C7" strokeWidth="1" />
          <Line x1="48" y1="29" x2="50" y2="29" stroke="#0284C7" strokeWidth="1" />
        </Svg>
      </View>
    );
  }

  // 5. HUMAN RESOURCE MANAGEMENT (HR People Hierarchy & Talent Discovery)
  if (
    normCat === 'human-resource-management' ||
    normCat === 'hrm' ||
    normCat.includes('human-resource') ||
    normCat.includes('recruitment') ||
    normCat.includes('talent') ||
    /\bhr\b/i.test(normCat)
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="hrLeader" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#1E3A8A" />
              <Stop offset="100%" stopColor="#102F53" />
            </LinearGradient>
            <LinearGradient id="hrGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FDE68A" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
          </Defs>

          {/* Org Tree Branching Hierarchy Lines */}
          <Line x1="32" y1="30" x2="32" y2="38" stroke="#94A3B8" strokeWidth="2" />
          <Path
            d="M18 42 L18 38 L46 38 L46 42"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />

          {/* TOP CENTER: Lead Professional Avatar */}
          <Circle cx="32" cy="18" r="6" fill="#FCD34D" stroke="#D97706" strokeWidth="1.2" />
          <Path d="M22 32 C22 26 42 26 42 32 Z" fill="url(#hrLeader)" />
          {/* Golden Tie */}
          <Polygon points="31,26 33,26 32.5,31 31.5,31" fill="#F59E0B" />

          {/* BOTTOM LEFT: Team Member Avatar (Cyan) */}
          <Circle cx="18" cy="40" r="4.5" fill="#FED7AA" stroke="#EA580C" strokeWidth="1" />
          <Path d="M10 52 C10 47 26 47 26 52 Z" fill="#0284C7" />

          {/* BOTTOM RIGHT: Team Member Avatar (Coral) */}
          <Circle cx="46" cy="40" r="4.5" fill="#FED7AA" stroke="#EA580C" strokeWidth="1" />
          <Path d="M38 52 C38 47 54 47 54 52 Z" fill="#E11D48" />

          {/* Golden Search Talent / Checkmark Badge (Floating Top-Right) */}
          <G transform="translate(42, 10)">
            <Circle cx="8" cy="8" r="7" fill="url(#hrGold)" stroke="#D97706" strokeWidth="1.2" />
            <Path
              d="M5 8 L7 10 L11 6"
              stroke="#15803D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        </Svg>
      </View>
    );
  }

  // 6. LEADERSHIP & EXECUTIVE MANAGEMENT (Golden Compass of Vision & Guiding Star)
  if (
    normCat === 'leadership-management' ||
    normCat === 'leadership' ||
    normCat.includes('leadership') ||
    normCat.includes('management')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="compassGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="50%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#B45309" />
            </LinearGradient>
            <LinearGradient id="needleRed" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#F87171" />
              <Stop offset="100%" stopColor="#DC2626" />
            </LinearGradient>
          </Defs>

          {/* Outer Compass Graduated Ring */}
          <Circle
            cx="32"
            cy="32"
            r="21"
            fill="#FFFFFF"
            stroke="url(#compassGold)"
            strokeWidth="3"
          />
          <Circle
            cx="32"
            cy="32"
            r="17"
            fill="#F8FAFC"
            stroke="#CBD5E1"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* 4 Cardinal Direction Ticks */}
          <Line
            x1="32"
            y1="12"
            x2="32"
            y2="16"
            stroke="#B45309"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Line
            x1="32"
            y1="48"
            x2="32"
            y2="52"
            stroke="#64748B"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Line
            x1="12"
            y1="32"
            x2="16"
            y2="32"
            stroke="#64748B"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Line
            x1="48"
            y1="32"
            x2="52"
            y2="32"
            stroke="#64748B"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* North Star Indicator at top */}
          <Path
            d="M32 6 L33.5 10 L37 11.5 L33.5 13 L32 17 L30.5 13 L27 11.5 L30.5 10 Z"
            fill="#F59E0B"
          />

          {/* North Needle (Red Coral) */}
          <Polygon
            points="32,16 35.5,32 32,30 28.5,32"
            fill="url(#needleRed)"
            stroke="#B91C1C"
            strokeWidth="0.8"
          />

          {/* South Needle (Silver Slate) */}
          <Polygon
            points="32,48 35.5,32 32,34 28.5,32"
            fill="#94A3B8"
            stroke="#475569"
            strokeWidth="0.8"
          />

          {/* Central Pivot Hub */}
          <Circle
            cx="32"
            cy="32"
            r="4"
            fill="url(#compassGold)"
            stroke="#B45309"
            strokeWidth="1.2"
          />
          <Circle cx="32" cy="32" r="1.5" fill="#FFFFFF" />
        </Svg>
      </View>
    );
  }

  // 7. PERSONAL DEVELOPMENT & SOFT SKILLS (Mind Growth Lightbulb with Sprouting Leaf)
  if (
    normCat === 'personal-development' ||
    normCat.includes('personal') ||
    normCat.includes('soft-skill') ||
    normCat.includes('habit') ||
    normCat.includes('productivity')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="bulbGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="60%" stopColor="#FBBF24" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
            <LinearGradient id="leafGreen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#34D399" />
              <Stop offset="100%" stopColor="#059669" />
            </LinearGradient>
          </Defs>

          {/* Radiating Rays of Wisdom / Insight */}
          <Line
            x1="32"
            y1="6"
            x2="32"
            y2="11"
            stroke="#F59E0B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <Line
            x1="16"
            y1="14"
            x2="20"
            y2="18"
            stroke="#F59E0B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <Line
            x1="48"
            y1="14"
            x2="44"
            y2="18"
            stroke="#F59E0B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <Line
            x1="10"
            y1="28"
            x2="15"
            y2="28"
            stroke="#F59E0B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <Line
            x1="54"
            y1="28"
            x2="49"
            y2="28"
            stroke="#F59E0B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Lightbulb Dome */}
          <Path
            d="M20 28 C20 21.4 25.4 16 32 16 C38.6 16 44 21.4 44 28 C44 32.5 41.5 36.5 38 39 L38 45 L26 45 L26 39 C22.5 36.5 20 32.5 20 28 Z"
            fill="url(#bulbGold)"
            stroke="#D97706"
            strokeWidth="1.8"
          />

          {/* Lightbulb Screw Base */}
          <Rect x="27" y="45" width="10" height="3" rx="1" fill="#94A3B8" />
          <Rect x="28" y="48" width="8" height="3" rx="1" fill="#64748B" />
          <Path d="M29 51 Q 32 54 35 51 Z" fill="#475569" />

          {/* Fresh Sprouting Leaf of Growth emerging from within */}
          <Path
            d="M32 38 Q 32 26 39 24 Q 40 32 32 38 Z"
            fill="url(#leafGreen)"
            stroke="#047857"
            strokeWidth="1.2"
          />
          <Path
            d="M32 38 Q 30 29 25 27 Q 24 35 32 38 Z"
            fill="#6EE7B7"
            stroke="#047857"
            strokeWidth="1"
          />
          <Line
            x1="32"
            y1="38"
            x2="32"
            y2="28"
            stroke="#047857"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  // 8. DATA SCIENCE & ANALYTICS (Analytics Donut Chart with Metric Trends)
  if (
    normCat === 'data-science' ||
    normCat === 'data_science' ||
    normCat.includes('data') ||
    normCat.includes('analytics') ||
    normCat.includes('bi')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="dsCyan" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#0284C7" />
            </LinearGradient>
            <LinearGradient id="dsCoral" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FB7185" />
              <Stop offset="100%" stopColor="#E11D48" />
            </LinearGradient>
            <LinearGradient id="dsGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FDE68A" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
          </Defs>

          {/* Grid Platform Base */}
          <Line
            x1="10"
            y1="52"
            x2="54"
            y2="52"
            stroke="#CBD5E1"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Analytics Donut Chart Segment 1 (Cyan - 50%) */}
          <Path
            d="M32 10 A 16 16 0 0 1 48 26 L41 26 A 9 9 0 0 0 32 17 Z"
            fill="url(#dsCyan)"
            stroke="#0369A1"
            strokeWidth="1"
          />
          {/* Donut Chart Segment 2 (Coral - 30%) */}
          <Path
            d="M48 26 A 16 16 0 0 1 32 42 L32 35 A 9 9 0 0 0 41 26 Z"
            fill="url(#dsCoral)"
            stroke="#BE123C"
            strokeWidth="1"
          />
          {/* Donut Chart Segment 3 (Gold - 20%) */}
          <Path
            d="M32 42 A 16 16 0 0 1 32 10 L32 17 A 9 9 0 0 0 32 35 Z"
            fill="url(#dsGold)"
            stroke="#D97706"
            strokeWidth="1"
          />

          {/* Ascending Metric Bar Pillars (Foreground) */}
          <Rect x="14" y="40" width="5" height="12" rx="1.5" fill="#38BDF8" />
          <Rect x="22" y="34" width="5" height="18" rx="1.5" fill="#818CF8" />
          <Rect x="30" y="28" width="5" height="24" rx="1.5" fill="#F43F5E" />
          <Rect x="38" y="22" width="5" height="30" rx="1.5" fill="#FBBF24" />
          <Rect x="46" y="16" width="5" height="36" rx="1.5" fill="#10B981" />

          {/* Curved Polynomial Trendline Curve */}
          <Path
            d="M16 38 Q 30 28, 48 14"
            stroke="#102F53"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx="48" cy="14" r="3" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.2" />
        </Svg>
      </View>
    );
  }

  // 9. JOB SEEKERS SKILLS & CAREER (Professional CV Resume & Certified Candidate Badge)
  if (
    normCat === 'job-seekers-skills' ||
    normCat === 'career' ||
    normCat.includes('job') ||
    normCat.includes('seeker') ||
    normCat.includes('resume') ||
    normCat.includes('career') ||
    normCat.includes('interview')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="cvHeader" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#1E3A8A" />
              <Stop offset="100%" stopColor="#102F53" />
            </LinearGradient>
            <LinearGradient id="badgeGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
          </Defs>

          {/* Resume Document Sheet */}
          <Rect
            x="14"
            y="10"
            width="36"
            height="46"
            rx="4"
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="1.8"
          />
          {/* Folded Top-Right Corner */}
          <Path d="M42 10 L50 18 L42 18 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />

          {/* Header Banner */}
          <Rect x="18" y="15" width="22" height="4" rx="2" fill="url(#cvHeader)" />

          {/* Profile Photo Thumbnail */}
          <Rect x="18" y="22" width="10" height="10" rx="2" fill="#E2E8F0" />
          <Circle cx="23" cy="26" r="2.5" fill="#64748B" />
          <Path d="M19 32 C19 29.5 27 29.5 27 32 Z" fill="#64748B" />

          {/* Candidate Experience Lines */}
          <Line
            x1="31"
            y1="24"
            x2="44"
            y2="24"
            stroke="#0284C7"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Line
            x1="31"
            y1="28"
            x2="41"
            y2="28"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Skills / Achievements Bullet Rows */}
          <Line
            x1="18"
            y1="36"
            x2="44"
            y2="36"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <Line
            x1="18"
            y1="40"
            x2="40"
            y2="40"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <Line
            x1="18"
            y1="44"
            x2="36"
            y2="44"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <Line
            x1="18"
            y1="48"
            x2="30"
            y2="48"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Verified Candidate Seal Badge (Floating Bottom-Right) */}
          <G transform="translate(36, 36)">
            <Circle
              cx="10"
              cy="10"
              r="8"
              fill="url(#badgeGold)"
              stroke="#D97706"
              strokeWidth="1.2"
            />
            <Path
              d="M7 10 L9 12 L13 8"
              stroke="#15803D"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Ribbon tails */}
            <Polygon points="7,17 10,14 13,17 10,12" fill="#D97706" />
          </G>
        </Svg>
      </View>
    );
  }

  // 10. RESEARCH & ACADEMIC (Scientific Research Microscope & Discovery Atom)
  if (
    normCat === 'research-courses' ||
    normCat === 'research' ||
    normCat.includes('research') ||
    normCat.includes('academic') ||
    normCat.includes('thesis')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="microscopeMetal" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#94A3B8" />
              <Stop offset="50%" stopColor="#64748B" />
              <Stop offset="100%" stopColor="#334155" />
            </LinearGradient>
            <LinearGradient id="lensCyan" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#67E8F9" />
              <Stop offset="100%" stopColor="#0891B2" />
            </LinearGradient>
          </Defs>

          {/* Heavy Microscope Base */}
          <Path
            d="M14 54 L50 54 L46 48 L18 48 Z"
            fill="url(#microscopeMetal)"
            stroke="#1E293B"
            strokeWidth="1.2"
          />

          {/* Specimen Stage Plate */}
          <Rect x="20" y="38" width="22" height="3" rx="1.5" fill="#1E293B" />
          {/* Glass Slide on Stage */}
          <Rect x="26" y="36.5" width="10" height="2" rx="0.5" fill="url(#lensCyan)" />

          {/* Curved Arm of Microscope */}
          <Path
            d="M42 48 C42 32 38 24 32 20"
            stroke="url(#microscopeMetal)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Optical Eyepiece & Tube */}
          <Line
            x1="26"
            y1="12"
            x2="31"
            y2="24"
            stroke="url(#microscopeMetal)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Eyepiece Cap */}
          <Rect x="23" y="10" width="7" height="3" rx="1" fill="#0EA5E9" />
          {/* Objective Lens Turret pointing to stage */}
          <Path d="M30 24 L27 34 L33 34 Z" fill="#0F172A" />
          <Circle cx="30" cy="35" r="1.5" fill="#38BDF8" />

          {/* Focus Adjustment Wheel Knobs */}
          <Circle cx="38" cy="30" r="3.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />

          {/* Orbiting Atomic Particle of Discovery (Top-Left) */}
          <G transform="translate(10, 8)">
            <Circle cx="8" cy="8" r="2" fill="#F59E0B" />
            <Path
              d="M2 8 A 6 3 30 1 1 14 8 A 6 3 30 1 1 2 8"
              stroke="#06B6D4"
              strokeWidth="1"
              fill="none"
            />
            <Path
              d="M8 2 A 3 6 30 1 1 8 14 A 3 6 30 1 1 8 2"
              stroke="#8B5CF6"
              strokeWidth="1"
              fill="none"
            />
          </G>
        </Svg>
      </View>
    );
  }

  // 11. BUSINESS STRATEGY & CONSULTING (Golden Chess Knight on Strategy Blueprint)
  if (
    normCat === 'business-strategy' ||
    normCat.includes('strategy') ||
    normCat.includes('consulting')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="knightGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="50%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#B45309" />
            </LinearGradient>
            <LinearGradient id="boardSlate" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#334155" />
              <Stop offset="100%" stopColor="#0F172A" />
            </LinearGradient>
          </Defs>

          {/* Isometric Strategy Grid Platform */}
          <Polygon
            points="32,44 54,49 32,54 10,49"
            fill="url(#boardSlate)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <Polygon points="32,44 43,46.5 32,49 21,46.5" fill="#64748B" />

          {/* Strategic Forward Move Arrow */}
          <Path
            d="M16 42 Q 22 28, 44 26"
            stroke="#EF4444"
            strokeWidth="2.2"
            strokeDasharray="3 3"
            strokeLinecap="round"
            fill="none"
          />
          <Polygon points="46,23 48,29 42,27" fill="#EF4444" />

          {/* Sculpted Golden Chess Knight Piece */}
          <Path
            d="M26 44 L38 44 C38 44 38 38 40 34 C42 30 43 24 38 18 C37 14 34 12 32 12 C30 14 28 17 25 18 C22 19 18 21 19 25 C20 27 24 26 26 28 C28 30 24 36 26 44 Z"
            fill="url(#knightGold)"
            stroke="#92400E"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Knight Eye */}
          <Circle cx="29" cy="20" r="1.5" fill="#78350F" />
          {/* Mane Ridges */}
          <Path d="M35 15 Q 38 18 38 22" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" />
          <Path d="M37 23 Q 40 26 39 30" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" />
          {/* Pedestal Base Collar */}
          <Rect
            x="24"
            y="43"
            width="16"
            height="3"
            rx="1.5"
            fill="url(#knightGold)"
            stroke="#92400E"
            strokeWidth="1.2"
          />
        </Svg>
      </View>
    );
  }

  // 12. DESIGN: Stylized Pen Tool with Cyan Bezier Handles and Golden Nib
  if (
    normCat === 'design' ||
    normCat.includes('design') ||
    normCat.includes('creative') ||
    normCat.includes('ui') ||
    normCat.includes('ux') ||
    normCat.includes('graphic')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
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
          <Rect
            x="8"
            y="24"
            width="8"
            height="8"
            rx="2"
            fill="#06B6D4"
            stroke="#0E7490"
            strokeWidth="1.5"
          />

          {/* Right Handle Node */}
          <Line x1="46" y1="28" x2="52" y2="28" stroke="#0891B2" strokeWidth="2.5" />
          <Rect
            x="48"
            y="24"
            width="8"
            height="8"
            rx="2"
            fill="#06B6D4"
            stroke="#0E7490"
            strokeWidth="1.5"
          />

          {/* Golden Pen Tool Body / Nib */}
          <Path
            d="M32 16 L40 32 L36 46 L32 54 L28 46 L24 32 Z"
            fill="url(#penGold)"
            stroke="#B45309"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Nib Center Slit & Ink Hole */}
          <Line
            x1="32"
            y1="36"
            x2="32"
            y2="52"
            stroke="#78350F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <Circle cx="32" cy="35" r="2.2" fill="#78350F" />

          {/* Bevel highlights */}
          <Path d="M32 16 L40 32 L32 35 Z" fill="rgba(255, 255, 255, 0.35)" />
        </Svg>
      </View>
    );
  }

  // 13. SOFTWARE: Monitor Screen with Cyan Display and Golden Cog/Gear
  if (normCat === 'software' || normCat.includes('software') || normCat.includes('tool')) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
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
            <Rect x="7.5" y="0.5" width="3" height="3" rx="0.8" fill="#F59E0B" />
            <Rect x="7.5" y="14.5" width="3" height="3" rx="0.8" fill="#F59E0B" />
            <Rect x="0.5" y="7.5" width="3" height="3" rx="0.8" fill="#F59E0B" />
            <Rect x="14.5" y="7.5" width="3" height="3" rx="0.8" fill="#F59E0B" />
            <Circle cx="9" cy="9" r="2.5" fill="#FFFFFF" stroke="#D97706" strokeWidth="1" />
          </G>
        </Svg>
      </View>
    );
  }

  // 14. NETWORKING: Light Blue Globe with Interconnected Pink/Coral Nodes
  if (
    normCat === 'networking' ||
    normCat.includes('network') ||
    normCat.includes('cloud') ||
    normCat.includes('infrastructure')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
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
          <Circle
            cx="32"
            cy="32"
            r="18"
            fill="url(#globeBlue)"
            fillOpacity="0.8"
            stroke="#0284C7"
            strokeWidth="1.5"
          />

          {/* Latitude / Longitude Curvature Lines */}
          <Path
            d="M14 32 Q 32 24 50 32"
            stroke="#0284C7"
            strokeWidth="1"
            strokeDasharray="2 2"
            fill="none"
          />
          <Path
            d="M14 32 Q 32 40 50 32"
            stroke="#0284C7"
            strokeWidth="1"
            strokeDasharray="2 2"
            fill="none"
          />
          <Path
            d="M32 14 Q 24 32 32 50"
            stroke="#0284C7"
            strokeWidth="1"
            strokeDasharray="2 2"
            fill="none"
          />
          <Path
            d="M32 14 Q 40 32 32 50"
            stroke="#0284C7"
            strokeWidth="1"
            strokeDasharray="2 2"
            fill="none"
          />

          {/* Network Connection Lines */}
          <Line x1="20" y1="24" x2="32" y2="20" stroke="#E11D48" strokeWidth="1.5" />
          <Line x1="32" y1="20" x2="44" y2="26" stroke="#E11D48" strokeWidth="1.5" />
          <Line x1="20" y1="24" x2="24" y2="40" stroke="#E11D48" strokeWidth="1.5" />
          <Line x1="24" y1="40" x2="38" y2="42" stroke="#E11D48" strokeWidth="1.5" />
          <Line x1="38" y1="42" x2="44" y2="26" stroke="#E11D48" strokeWidth="1.5" />

          {/* Interconnected Node Dots */}
          <Circle
            cx="20"
            cy="24"
            r="3.2"
            fill="url(#nodePink)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
          <Circle
            cx="32"
            cy="20"
            r="3.6"
            fill="url(#nodePink)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
          <Circle
            cx="44"
            cy="26"
            r="3.4"
            fill="url(#nodePink)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
          <Circle
            cx="24"
            cy="40"
            r="3.2"
            fill="url(#nodePink)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
          <Circle
            cx="38"
            cy="42"
            r="3.6"
            fill="url(#nodePink)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
        </Svg>
      </View>
    );
  }

  // 15. MARKETING: 3D Red & Gold Megaphone / Speaker with Sound Waves
  if (
    normCat === 'marketing' ||
    normCat === 'sales-marketing' ||
    normCat.includes('market') ||
    normCat.includes('sales') ||
    normCat.includes('brand') ||
    normCat.includes('seo')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
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
          <Path
            d="M22 36 L18 48 L22 49 L26 39 Z"
            fill="#64748B"
            stroke="#475569"
            strokeWidth="1.2"
          />

          {/* Megaphone Red Cone Body */}
          <Path
            d="M16 28 L36 18 L38 46 L16 36 Z"
            fill="url(#hornRed)"
            stroke="#991B1B"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Back Cap (Grey/Dark) */}
          <Path
            d="M14 28 C 12 28, 12 36, 14 36 Z"
            fill="#475569"
            stroke="#334155"
            strokeWidth="1.2"
          />

          {/* Golden Mouth Ellipse/Rim */}
          <Path
            d="M36 18 C 40 18, 43 24, 43 32 C 43 40, 40 46, 36 46 Z"
            fill="url(#hornGold)"
            stroke="#D97706"
            strokeWidth="1.5"
          />

          {/* Inner dark speaker hole */}
          <Path d="M37 22 C 39 22, 40 26, 40 32 C 40 38, 39 42, 37 42 Z" fill="#78350F" />

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

  // 16. HACKING: Cyber Security Shield & Protective Keyhole
  if (
    normCat === 'hacking' ||
    normCat.includes('hack') ||
    normCat.includes('cyber') ||
    normCat.includes('security')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="shieldNavy" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#1E293B" />
              <Stop offset="50%" stopColor="#0F172A" />
              <Stop offset="100%" stopColor="#020617" />
            </LinearGradient>
            <LinearGradient id="cyberCyan" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#22D3EE" />
              <Stop offset="100%" stopColor="#0891B2" />
            </LinearGradient>
          </Defs>

          {/* Cyber Security Shield */}
          <Path
            d="M32 10 L48 16 C48 32 40 46 32 52 C24 46 16 32 16 16 Z"
            fill="url(#shieldNavy)"
            stroke="url(#cyberCyan)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Inner Protective Core Ring */}
          <Path
            d="M32 16 L44 21 C44 32 38 42 32 47 C26 42 20 32 20 21 Z"
            stroke="#0E7490"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            fill="none"
          />

          {/* Glowing Digital Keyhole */}
          <Circle cx="32" cy="28" r="4.5" fill="url(#cyberCyan)" />
          <Polygon points="30,29 34,29 35.5,38 28.5,38" fill="url(#cyberCyan)" />

          {/* Binary Grid Spark Points */}
          <Circle cx="26" cy="22" r="1.2" fill="#22D3EE" />
          <Circle cx="38" cy="22" r="1.2" fill="#22D3EE" />
          <Circle cx="32" cy="43" r="1.2" fill="#22D3EE" />
        </Svg>
      </View>
    );
  }

  // 17. DEVELOPMENT: Monitor Screen with Dual Interlocking Metallic Gears
  if (
    normCat === 'development' ||
    normCat.includes('dev') ||
    normCat.includes('python') ||
    normCat.includes('code') ||
    normCat.includes('programming')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
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
            <Circle
              cx="8"
              cy="8"
              r="6.5"
              fill="url(#gearSilver)"
              stroke="#475569"
              strokeWidth="1.2"
            />
            <Rect x="6.5" y="0" width="3" height="2.5" rx="0.6" fill="#64748B" />
            <Rect x="6.5" y="13.5" width="3" height="2.5" rx="0.6" fill="#64748B" />
            <Rect x="0" y="6.5" width="2.5" height="3" rx="0.6" fill="#64748B" />
            <Rect x="13.5" y="6.5" width="2.5" height="3" rx="0.6" fill="#64748B" />
            <Circle cx="8" cy="8" r="2.8" fill="#F1F5F9" stroke="#475569" strokeWidth="1" />
          </G>

          {/* Right Gear (Interlocking, smaller) */}
          <G transform="translate(32, 26)">
            <Circle cx="6" cy="6" r="5" fill="url(#gearSlate)" stroke="#334155" strokeWidth="1.2" />
            <Rect x="5" y="0" width="2" height="2" rx="0.5" fill="#334155" />
            <Rect x="5" y="10" width="2" height="2" rx="0.5" fill="#334155" />
            <Rect x="0" y="5" width="2" height="2" rx="0.5" fill="#334155" />
            <Rect x="10" y="5" width="2" height="2" rx="0.5" fill="#334155" />
            <Circle cx="6" cy="6" r="2.2" fill="#F1F5F9" stroke="#334155" strokeWidth="1" />
          </G>
        </Svg>
      </View>
    );
  }

  // 18. FITNESS: Athletic Vitality Heart with Workout Dumbbell
  if (
    normCat === 'fitness' ||
    normCat.includes('fitness') ||
    normCat.includes('health') ||
    normCat.includes('wellness')
  ) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
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

          {/* Pulse ECG Line across Heart */}
          <Path
            d="M22 28 L 26 28 L 28 23 L 31 33 L 34 26 L 36 28 L 42 28"
            stroke="#FEF08A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dumbbell Metal Bar */}
          <G transform="translate(0, 10)">
            <Rect
              x="16"
              y="27"
              width="32"
              height="3"
              rx="1.5"
              fill="url(#metalBar)"
              stroke="#475569"
              strokeWidth="0.8"
            />
            <Rect
              x="14"
              y="24"
              width="3"
              height="9"
              rx="1"
              fill="#334155"
              stroke="#1E293B"
              strokeWidth="0.8"
            />
            <Rect
              x="11"
              y="22"
              width="3"
              height="13"
              rx="1"
              fill="#475569"
              stroke="#1E293B"
              strokeWidth="0.8"
            />
            <Rect
              x="47"
              y="24"
              width="3"
              height="9"
              rx="1"
              fill="#334155"
              stroke="#1E293B"
              strokeWidth="0.8"
            />
            <Rect
              x="50"
              y="22"
              width="3"
              height="13"
              rx="1"
              fill="#475569"
              stroke="#1E293B"
              strokeWidth="0.8"
            />
          </G>
        </Svg>
      </View>
    );
  }

  // 19. BUSINESS: Executive Briefcase & Multi-Colored Growth (Default)
  if (normCat === 'business' || !normCat || normCat === 'all' || normCat.includes('business')) {
    return (
      <View
        style={[
          { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="redArrow" x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0%" stopColor="#F87171" />
              <Stop offset="100%" stopColor="#DC2626" />
            </LinearGradient>
            <LinearGradient id="caseLeather" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#1E3A8A" />
              <Stop offset="100%" stopColor="#102F53" />
            </LinearGradient>
          </Defs>

          {/* Base Axis Line */}
          <Line
            x1="12"
            y1="50"
            x2="52"
            y2="50"
            stroke="#94A3B8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

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
          <Polygon points="44,12 51,13 49,20" fill="#DC2626" />
        </Svg>
      </View>
    );
  }

  // Fallback to Business Icon
  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Defs>
          <LinearGradient id="redArrowFb" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor="#F87171" />
            <Stop offset="100%" stopColor="#DC2626" />
          </LinearGradient>
        </Defs>
        <Line
          x1="12"
          y1="50"
          x2="52"
          y2="50"
          stroke="#94A3B8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Rect x="16" y="38" width="6" height="12" rx="1.5" fill="#38BDF8" />
        <Rect x="25" y="30" width="6" height="20" rx="1.5" fill="#FBBF24" />
        <Rect x="34" y="22" width="6" height="28" rx="1.5" fill="#34D399" />
        <Rect x="43" y="16" width="6" height="34" rx="1.5" fill="#FB923C" />
        <Path
          d="M14 42 Q 28 32, 48 14"
          stroke="url(#redArrowFb)"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        <Polygon points="44,12 51,13 49,20" fill="#DC2626" />
      </Svg>
    </View>
  );
};
