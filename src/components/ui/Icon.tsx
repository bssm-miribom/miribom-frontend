import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

import { icons, type IconName } from '@/constants/icons';

type Props = { name: IconName; size?: number; width?: number; height?: number; style?: StyleProp<ImageStyle> };

/** Figma에서 받은 SVG·PNG를 원래 비율 그대로 그림 */
export function Icon({ name, size = 20, width = size, height = size, style }: Props) {
  return <Image source={icons[name]} style={[{ width, height }, style]} contentFit="contain" accessible={false} />;
}
