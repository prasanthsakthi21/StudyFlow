import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ContestsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('Upcoming');

    const contests = [
        { id: 101, name: 'Weekly Contest 154', startTime: 'Starts in 12h 30m', duration: '1.5 Hours', type: 'Upcoming', registered: false },
        { id: 102, name: 'Bi-Weekly Challenge', startTime: 'Live Now', duration: '2 Hours', type: 'Ongoing', registered: true },
        { id: 100, name: 'Weekly Contest 153', startTime: 'Ended Yesterday', duration: '1.5 Hours', type: 'Past', rank: 124 },
    ];

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            paddingTop: 60,
            paddingHorizontal: 24,
            paddingBottom: 0,
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 20,
        },
        tabContainer: {
            flexDirection: 'row',
            paddingHorizontal: 24,
            marginBottom: 24,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        tab: {
            marginRight: 24,
            paddingBottom: 12,
        },
        activeTab: {
            borderBottomWidth: 2,
            borderBottomColor: theme.primary,
        },
        tabText: {
            fontSize: 16,
            color: theme.textSecondary,
            fontWeight: '600',
        },
        activeTabText: {
            color: theme.primary,
        },
        content: {
            padding: 24,
            paddingTop: 0,
        },
        contestCard: {
            borderRadius: 20,
            marginBottom: 20,
            overflow: 'hidden',
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
        },
        cardGradient: {
            padding: 20,
        },
        contestStatus: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 12,
        },
        statusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.2)',
        },
        statusText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
        },
        contestTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 8,
        },
        contestMeta: {
            flexDirection: 'row',
            gap: 16,
            marginBottom: 20,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        metaText: {
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14,
            marginLeft: 6,
        },
        actionBtn: {
            backgroundColor: '#fff',
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
        },
        actionBtnText: {
            color: theme.primary,
            fontWeight: 'bold',
            fontSize: 16,
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contests</Text>
            </View>

            <View style={styles.tabContainer}>
                {['Upcoming', 'Ongoing', 'Past'].map(t => (
                    <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.activeTab]} onPress={() => setActiveTab(t)}>
                        <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {contests.filter(c => c.type === activeTab).map(contest => (
                    <TouchableOpacity key={contest.id} style={styles.contestCard}>
                        <LinearGradient
                            colors={contest.type === 'Ongoing' ? ['#ef4444', '#b91c1c'] : ['#3b82f6', '#1d4ed8']}
                            style={styles.cardGradient}
                        >
                            <View style={styles.contestStatus}>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>{contest.type === 'Ongoing' ? 'LIVE NOW' : contest.duration}</Text>
                                </View>
                                <Ionicons name="trophy-outline" size={20} color="#fff" />
                            </View>
                            <Text style={styles.contestTitle}>{contest.name}</Text>
                            <View style={styles.contestMeta}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.metaText}>{contest.startTime}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Text style={[styles.actionBtnText, { color: contest.type === 'Ongoing' ? '#ef4444' : '#3b82f6' }]}>
                                    {contest.type === 'Ongoing' ? 'Enter Contest' : (contest.registered ? 'Registered' : 'Register Now')}
                                </Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
                {contests.filter(c => c.type === activeTab).length === 0 && (
                    <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 40 }}>No contests found.</Text>
                )}
            </ScrollView>
        </View>
    );
}
