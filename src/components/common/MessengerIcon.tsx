import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface MessengerIconProps {
  size?: number;
  color?: string;
  boltColor?: string;
  useGradient?: boolean;
}

/**
 * Official Meta Messenger Icon (Speech Bubble with Lightning Bolt)
 * Replaces generic Facebook 'f' icon with the authentic Messenger brand asset.
 */
export const MessengerIcon: React.FC<MessengerIconProps> = ({
  size = 24,
  color = '#FFFFFF',
  boltColor,
  useGradient = false,
}) => {
  const gradientId = 'tslMessengerGrad';

  const bubblePath =
    'M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.455 5.527 3.734 7.205V22l3.411-1.873c.907.252 1.872.388 2.855.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2z';

  const boltPath =
    'M13.066 14.441l-2.55-2.72-4.978 2.72 5.474-5.811 2.612 2.72 4.916-2.72-5.474 5.811z';

  if (useGradient) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00C6FF" />
            <Stop offset="30%" stopColor="#0078FF" />
            <Stop offset="70%" stopColor="#A033FF" />
            <Stop offset="100%" stopColor="#FF5280" />
          </LinearGradient>
        </Defs>
        <Path d={bubblePath} fill={`url(#${gradientId})`} />
        <Path d={boltPath} fill={boltColor || '#FFFFFF'} />
      </Svg>
    );
  }

  if (boltColor) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={bubblePath} fill={color} />
        <Path d={boltPath} fill={boltColor} />
      </Svg>
    );
  }

  // Single compound path with evenodd fill rule for pure transparent cutout
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path fillRule="evenodd" clipRule="evenodd" d={`${bubblePath} ${boltPath}`} fill={color} />
    </Svg>
  );
};
