import Svg, { Path, Line } from "react-native-svg";

interface BrowIconProps {
  size?: number;
  color?: string;
}

/**
 * Eyebrow with micropigmentation pen and closed eye with lashes.
 */
export function BrowIcon({ size = 20, color = "#8B6B4F" }: BrowIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Eyebrow — thick arch tapering to a point */}
      <Path
        d="M3 12C5 8.5 9 7 13 7.5C16 8 19 9.5 20.5 11"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* PMU pen body (diagonal, resting on brow) */}
      <Path
        d="M10.5 9L7 4.5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Pen connector ring */}
      <Path
        d="M12 10.5L10.5 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Pen tip */}
      <Path
        d="M13 11.5L12 10.5"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      {/* Closed eye curve */}
      <Path
        d="M6 17C6 17 9 15 13 15C17 15 19 17 19 17"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Eyelashes — 5 short strokes */}
      <Line x1={8} y1={17.2} x2={7.5} y2={19.5} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={10.5} y1={16.3} x2={10.3} y2={19} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={13} y1={16} x2={13} y2={19} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={15.5} y1={16.3} x2={15.7} y2={19} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={17.5} y1={17.2} x2={18} y2={19.5} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}
