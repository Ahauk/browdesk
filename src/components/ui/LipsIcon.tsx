import Svg, { Path } from "react-native-svg";

interface LipsIconProps {
  size?: number;
  color?: string;
}

export function LipsIcon({ size = 20, color = "#8B6B4F" }: LipsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Upper lip with cupid's bow */}
      <Path
        d="M2 13C2 13 4 8 7.5 7C9 6.6 10.5 8 11 9.5C11.3 10.3 11.6 10.5 12 10.5C12.4 10.5 12.7 10.3 13 9.5C13.5 8 15 6.6 16.5 7C20 8 22 13 22 13"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lower lip */}
      <Path
        d="M2 13C2 13 6 19 12 19C18 19 22 13 22 13"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lip line / mouth seam */}
      <Path
        d="M3.5 13.5C3.5 13.5 7 15 12 15C17 15 20.5 13.5 20.5 13.5"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </Svg>
  );
}
