import Svg, { Path, Rect, Line } from "react-native-svg";

interface CartridgeIconProps {
  size?: number;
  color?: string;
}

/**
 * Tattoo/micropigmentation cartridge needle icon.
 * Inspired by professional cartridge needles used in PMU.
 */
export function CartridgeIcon({
  size = 20,
  color = "#8B6B4F",
}: CartridgeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Grip body (top rectangle with rounded top) */}
      <Rect
        x={8}
        y={1.5}
        width={8}
        height={7}
        rx={1.5}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Connection ring */}
      <Rect
        x={7}
        y={8.5}
        width={10}
        height={3}
        rx={1}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Cartridge body (tapers down) */}
      <Path
        d="M9 11.5L9 16.5C9 17 9.5 17.5 10 18L11.5 20C11.75 20.3 12.25 20.3 12.5 20L14 18C14.5 17.5 15 17 15 16.5L15 11.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Needle tip */}
      <Line
        x1={12}
        y1={20}
        x2={12}
        y2={22.5}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Detail lines on grip */}
      <Line
        x1={10}
        y1={3.5}
        x2={14}
        y2={3.5}
        stroke={color}
        strokeWidth={0.8}
        strokeLinecap="round"
      />
      <Line
        x1={10}
        y1={5.5}
        x2={14}
        y2={5.5}
        stroke={color}
        strokeWidth={0.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
