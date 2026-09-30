import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../constants/Api'; // Ensure this constant exists

const { width } = Dimensions.get('window');

export default function LearningTrackerScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        stats: { totalTopics: 0, timeSpentMinutes: 0, completedTopics: 0 },
        recentActivity: []
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Hardcoded userId 1 for demo/MVP
            const response = await fetch(`${API_URL}/users/1/analytics`);
            if (response.ok) {
                const json = await response.json();
                setData(json);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color }: { title: string, value: number | string, icon: any, color: string }) => (
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{title}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style="light" />

            {/* Header */}
            <LinearGradient
                colors={['#4f46e5', '#3730a3']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Learning Tracker</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Summary Stats in Header (Optional, or moved below) */}
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {/* 1. Main Stats Row */}
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
                        <View style={styles.statsGrid}>
                            <StatCard
                                title="Topics Viewed"
                                value={data.stats.totalTopics}
                                icon="library-outline"
                                color="#3b82f6"
                            />
                            <StatCard
                                title="Time Spent (m)"
                                value={data.stats.timeSpentMinutes}
                                icon="time-outline"
                                color="#f59e0b"
                            />
                            <StatCard
                                title="Completed"
                                value={data.stats.completedTopics}
                                icon="checkmark-circle-outline"
                                color="#10b981"
                            />
                        </View>

                        {/* 2. Visual Progress Bar (Concept Mastery) */}
                        <View style={[styles.progressCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Concept Mastery</Text>
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBarFill, { width: `${Math.min(100, (data.stats.completedTopics / (data.stats.totalTopics || 1)) * 100)}%` }]} />
                            </View>
                            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                                {data.stats.completedTopics} of {data.stats.totalTopics} concepts completed
                            </Text>
                        </View>

                        {/* 3. Recent Activity List */}
                        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Topic Progress</Text>
                        {data.recentActivity.length === 0 ? (
                            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No activity yet. Start a lesson!</Text>
                        ) : (
                            data.recentActivity.map((item: any, index: number) => (
                                <View key={index} style={[styles.activityItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                    <View style={[styles.activityIcon, { backgroundColor: item.completed ? '#10b98120' : '#4f46e520' }]}>
                                        <Ionicons
                                            name={item.completed ? "checkmark" : "book-outline"}
                                            size={20}
                                            color={item.completed ? "#10b981" : "#4f46e5"}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.activityTitle, { color: theme.text }]}>{item.title}</Text>
                                        <View style={styles.miniProgressBar}>
                                            <View style={[styles.miniProgressFill, { width: `${item.progress}%`, backgroundColor: item.completed ? '#10b981' : '#4f46e5' }]} />
                                        </View>
                                        <Text style={[styles.activitySubtitle, { color: theme.textSecondary }]}>
                                            {item.progress}% Complete
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: (width - 52) / 2, // 2 columns approx
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    progressCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: '#e2e8f0', // Light gray bg
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4f46e5',
        borderRadius: 6,
    },
    progressText: {
        fontSize: 13,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 6,
    },
    activitySubtitle: {
        fontSize: 12,
    },
    miniProgressBar: {
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        width: '100%',
        marginBottom: 4,
    },
    miniProgressFill: {
        height: '100%',
        borderRadius: 2,
    }
});
