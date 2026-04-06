import Svg, { Path, Rect } from "react-native-svg";

interface InkBottlesIconProps {
  size?: number;
  color?: string;
}

/**
 * Single ink/pigment bottle icon.
 * Represents pigment tones used in micropigmentation.
 */
export function InkBottlesIcon({
  size = 20,
  color = "#8B6B4F",
}: InkBottlesIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Dropper tip */}
      <Path
        d="M10 7L11.2 3.5C11.4 3 12.6 3 12.8 3.5L14 7"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottle body */}
      <Rect
        x={8.5}
        y={7}
        width={7}
        height={14}
        rx={1.5}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Label */}
      <Rect
        x={10}
        y={10.5}
        width={4}
        height={6}
        rx={0.8}
        stroke={color}
        strokeWidth={1}
      />
    </Svg>
  );
}
