import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

function TabIcon({
  name,
  focused,
}: {
  name: "home" | "clients" | "agenda" | "settings";
  focused: boolean;
}) {
  const color = focused ? "#C4A87C" : "#8A8A8A";

  const icons = {
    home: (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 22V12H15V22"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    clients: (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    agenda: (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16 2V6"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M8 2V6"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M3 10H21"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    settings: (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12.22 2H11.78C11.2496 2 10.7409 2.21071 10.3658 2.58579C9.99072 2.96086 9.78 3.46957 9.78 4V4.18C9.77964 4.53073 9.69179 4.87519 9.52465 5.18108C9.35751 5.48697 9.11687 5.74429 8.82299 5.93164C8.52911 6.119 8.19141 6.2301 7.84131 6.25458C7.49122 6.27906 7.14067 6.21609 6.82 6.07L6.65 6C6.17314 5.79165 5.63799 5.75706 5.13772 5.90175C4.63744 6.04644 4.20333 6.36144 3.91 6.79L3.69 7.15C3.39684 7.57875 3.26251 8.09345 3.30926 8.60784C3.356 9.12222 3.58096 9.60345 3.94 9.97L4.08 10.12C4.3289 10.3827 4.50888 10.7042 4.60251 11.0545C4.69615 11.4049 4.70013 11.7729 4.61 12.1253V12.1253C4.52021 12.4789 4.34005 12.8012 4.0885 13.0612C3.83695 13.3213 3.52271 13.5098 3.17 13.6087L3 13.6587C2.47038 13.8087 2.01626 14.1455 1.71773 14.6069C1.4192 15.0683 1.29589 15.6224 1.37 16.1687V16.1687C1.42855 16.5715 1.59727 16.949 1.85699 17.2598C2.11672 17.5707 2.45769 17.8028 2.84 17.93L3 17.98C3.35336 18.092 3.66555 18.2969 3.90298 18.5723C4.14042 18.8477 4.29395 19.1833 4.34602 19.5401C4.39808 19.897 4.34686 20.2609 4.19794 20.5889C4.04903 20.917 3.80848 21.1969 3.50511 21.3953L3.36 21.4887C2.93671 21.7649 2.6167 22.1745 2.45133 22.6534C2.28596 23.1322 2.28452 23.6529 2.44722 24.1327"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  };

  return icons[name];
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1A1A1A",
          borderTopColor: "#2D2D2D",
          borderTopWidth: 0.5,
          height: 85,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#C4A87C",
        tabBarInactiveTintColor: "#8A8A8A",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clientas",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="clients" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="agenda" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
