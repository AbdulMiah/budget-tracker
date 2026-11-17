import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '../../components/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type MciName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Most icons are Ionicons; `mci` picks one from MaterialCommunityIcons, which has a hand holding a coin.
const TABS: { name: string; title: string; icon?: IconName; mci?: MciName }[] = [
  { name: 'index', title: 'Dashboard', icon: 'home' },
  { name: 'analytics', title: 'Analytics', icon: 'stats-chart' },
  { name: 'budget', title: 'Budget', icon: 'wallet' },
  { name: 'zakat', title: 'Zakat', mci: 'hand-coin' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline' },
];

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
      }}
    >
      {TABS.map(({ name, title, icon, mci }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size }) => {
              const c = typeof color === 'string' ? color : undefined;
              return mci ? <MaterialCommunityIcons name={mci} size={size} color={c} /> : <Ionicons name={icon} size={size} color={c} />;
            },
          }}
        />
      ))}
    </Tabs>
  );
}
