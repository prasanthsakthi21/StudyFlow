import { Stack } from 'expo-router';

export default function AdminLayout() {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="users" options={{ title: 'Manage Users' }} />
            <Stack.Screen name="approvals" options={{ title: 'Pending Approvals' }} />
            <Stack.Screen name="resources" options={{ title: 'Upload Resource' }} />
        </Stack>
    );
}
