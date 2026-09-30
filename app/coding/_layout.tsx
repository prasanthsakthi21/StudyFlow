import { Stack } from 'expo-router';

export default function CodingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="problems" />
            <Stack.Screen name="solve" />
            <Stack.Screen name="leaderboard" />
            <Stack.Screen name="contests" />
            <Stack.Screen name="interview" />
        </Stack>
    );
}
