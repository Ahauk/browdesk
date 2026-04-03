import { View, TextInput } from "react-native";
import Svg, { Path } from "react-native-svg";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

function SearchIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
        stroke="#8A8A8A"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Buscar clienta...",
}: SearchBarProps) {
  return (
    <View className="flex-row items-center gap-2 rounded-xl bg-gray-100 px-4 py-3">
      <SearchIcon />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8A8A"
        className="flex-1 text-base text-brand-black"
      />
    </View>
  );
}
