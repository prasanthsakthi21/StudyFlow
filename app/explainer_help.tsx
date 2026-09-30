import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function ExplainerHelpScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style="light" />
            <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Explainer Guide</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.section}>
                    <Ionicons name="code-slash-outline" size={32} color={theme.primary} style={styles.icon} />
                    <Text style={[styles.title, { color: theme.text }]}>How it Works</Text>
                    <Text style={[styles.text, { color: theme.textSecondary }]}>
                        Paste any code snippet (Java, Python, JS, C++, SQL) into the text area.
                        Our engine analyzes the syntax, identifies key concepts (loops, recursion, classes), and tracks variable flow.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Ionicons name="speedometer-outline" size={32} color="#eab308" style={styles.icon} />
                    <Text style={[styles.title, { color: theme.text }]}>Understanding Complexity</Text>

                    <View style={styles.complexityRow}>
                        <View style={[styles.badge, { backgroundColor: '#22c55e33', borderColor: '#22c55e' }]}>
                            <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>O(1)</Text>
                        </View>
                        <Text style={[styles.subText, { color: theme.textSecondary }]}>Constant Time - Very fast, instant.</Text>
                    </View>

                    <View style={styles.complexityRow}>
                        <View style={[styles.badge, { backgroundColor: '#eab30833', borderColor: '#eab308' }]}>
                            <Text style={{ color: '#eab308', fontWeight: 'bold' }}>O(n)</Text>
                        </View>
                        <Text style={[styles.subText, { color: theme.textSecondary }]}>Linear Time - Speed depends on input size.</Text>
                    </View>

                    <View style={styles.complexityRow}>
                        <View style={[styles.badge, { backgroundColor: '#ef444433', borderColor: '#ef4444' }]}>
                            <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>O(n²)</Text>
                        </View>
                        <Text style={[styles.subText, { color: theme.textSecondary }]}>Quadratic Time - Slow for large inputs (nested loops).</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Ionicons name="bulb-outline" size={32} color="#38bdf8" style={styles.icon} />
                    <Text style={[styles.title, { color: theme.text }]}>Tips</Text>
                    <Text style={[styles.text, { color: theme.textSecondary }]}>
                        • Try pasting a complex recursive function to see logical steps.
                        {'\n'}• Use the "Save" button to keep snippets for later review.
                        {'\n'}• Check unit test suggestions to verify your code.
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { position: 'absolute', width: '100%', height: '100%' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    },
    backButton: {
        padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    content: { padding: 20 },
    section: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    icon: { marginBottom: 16 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    text: { fontSize: 16, lineHeight: 24 },
    complexityRow: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginRight: 12, width: 60, alignItems: 'center'
    },
    subText: { flex: 1, fontSize: 14 }
});
