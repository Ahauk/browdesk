import Svg, { Path } from "react-native-svg";

interface LipsIconProps {
  size?: number;
  color?: string;
}

export function LipsIcon({ size = 20, color = "#8B6B4F" }: LipsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C12 21 3 16.5 3 12C3 10 4.5 8.5 6 8C7.5 7.5 9.5 8 10.5 9.5C11 10.25 11.5 10.5 12 10.5C12.5 10.5 13 10.25 13.5 9.5C14.5 8 16.5 7.5 18 8C19.5 8.5 21 10 21 12C21 16.5 12 21 12 21Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.5 13C3.5 13 8 14.5 12 14.5C16 14.5 20.5 13 20.5 13"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
