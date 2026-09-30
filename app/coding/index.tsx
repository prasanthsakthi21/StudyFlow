import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function CodingPlatformScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            paddingTop: 60,
            paddingHorizontal: 24,
            paddingBottom: 24,
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 8,
        },
        headerSubtitle: {
            fontSize: 16,
            color: theme.textSecondary,
        },
        content: {
            flex: 1,
            padding: 24,
            paddingTop: 0,
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 16,
            marginTop: 8,
        },
        card: {
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
            borderWidth: 1,
            borderColor: theme.border,
        },
        dailyProblemCard: {
            borderRadius: 24,
            overflow: 'hidden',
            marginBottom: 24,
        },
        dailyProblemGradient: {
            padding: 24,
        },
        dailyTag: {
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            marginBottom: 12,
        },
        dailyTagText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 12,
        },
        problemTitle: {
            fontSize: 22,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 8,
        },
        problemMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16,
        },
        metaText: {
            color: 'rgba(255,255,255,0.8)',
            marginLeft: 6,
            fontSize: 14,
        },
        solveButton: {
            backgroundColor: '#fff',
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
        },
        solveButtonText: {
            color: theme.primary,
            fontWeight: 'bold',
            fontSize: 16,
        },
        featureGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
        },
        featureCard: {
            width: (width - 48 - 16) / 2,
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
            height: 140,
        },
        featureIconConfig: {
            width: 48,
            height: 48,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
        },
        featureTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
            textAlign: 'center',
        },
        languagesContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 20,
            gap: 12,
        },
        langBadge: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: theme.input,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
        },
        langText: {
            fontSize: 12,
            color: theme.textSecondary,
            fontWeight: '600',
        },
    });

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Coding Arena</Text>
                    <Text style={styles.headerSubtitle}>Master algorithms & data structures</Text>
                </View>

                <View style={styles.content}>
                    <Text style={styles.sectionTitle}>Daily Challenge</Text>
                    <TouchableOpacity style={styles.dailyProblemCard} activeOpacity={0.9}>
                        <LinearGradient
                            colors={[theme.primary, '#6366f1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.dailyProblemGradient}
                        >
                            <View style={styles.dailyTag}>
                                <Text style={styles.dailyTagText}>HARD</Text>
                            </View>
                            <Text style={styles.problemTitle}>Merge k Sorted Lists</Text>
                            <View style={styles.problemMeta}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.metaText}>45 mins</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="trophy-outline" size={16} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.metaText}>+50 XP</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.solveButton}>
                                <Text style={styles.solveButtonText}>Solve Now</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.sectionTitle}>Practice & Compete</Text>
                    <View style={styles.featureGrid}>
                        <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/coding/problems' as any)}>
                            <View style={[styles.featureIconConfig, { backgroundColor: '#e0f2fe' }]}>
                                <Ionicons name="code-working" size={24} color="#0ea5e9" />
                            </View>
                            <Text style={styles.featureTitle}>Problem Set</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/coding/contests' as any)}>
                            <View style={[styles.featureIconConfig, { backgroundColor: '#fef3c7' }]}>
                                <Ionicons name="trophy" size={24} color="#d97706" />
                            </View>
                            <Text style={styles.featureTitle}>Contests</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/coding/interview' as any)}>
                            <View style={[styles.featureIconConfig, { backgroundColor: '#dcfce7' }]}>
                                <Ionicons name="people" size={24} color="#16a34a" />
                            </View>
                            <Text style={styles.featureTitle}>Interview Prep</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/coding/leaderboard' as any)}>
                            <View style={[styles.featureIconConfig, { backgroundColor: '#fae8ff' }]}>
                                <Ionicons name="stats-chart" size={24} color="#9333ea" />
                            </View>
                            <Text style={styles.featureTitle}>Leaderboard</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.languagesContainer}>
                        <View style={styles.langBadge}><Text style={styles.langText}>Python</Text></View>
                        <View style={styles.langBadge}><Text style={styles.langText}>Java</Text></View>
                        <View style={styles.langBadge}><Text style={styles.langText}>C++</Text></View>
                        <View style={styles.langBadge}><Text style={styles.langText}>C</Text></View>
                    </View>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}
