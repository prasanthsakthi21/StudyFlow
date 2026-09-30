import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function MockInterviewScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [timeLeft, setTimeLeft] = useState(3600); // 60 mins
    const [activeSection, setActiveSection] = useState('MCQ');

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const sections = [
        { id: 'MCQ', title: 'Aptitude & Tech', count: '10 Qns', status: 'Active' },
        { id: 'CODING', title: 'Coding Challenge', count: '2 Qns', status: 'Locked' },
        { id: 'THEORY', title: 'Viva Voice', count: '5 Qns', status: 'Locked' },
    ];

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            paddingTop: 50,
            paddingHorizontal: 20,
            paddingBottom: 20,
            backgroundColor: theme.card,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.text,
        },
        timerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
        },
        timerText: {
            color: '#ef4444',
            fontWeight: 'bold',
            marginLeft: 6,
        },
        sectionList: {
            padding: 24,
        },
        sectionCard: {
            backgroundColor: theme.card,
            padding: 20,
            borderRadius: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        activeSection: {
            borderColor: theme.primary,
            backgroundColor: theme.type === 'dark' ? 'rgba(99, 102, 241, 0.05)' : '#e0e7ff',
        },
        sectionInfo: {
            flex: 1,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 4,
        },
        sectionMeta: {
            fontSize: 12,
            color: theme.textSecondary,
        },
        statusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: theme.input,
        },
        activeStatus: {
            backgroundColor: theme.primary,
        },
        statusText: {
            fontSize: 12,
            fontWeight: 'bold',
            color: theme.textSecondary,
        },
        activeStatusText: {
            color: '#fff',
        },
        infoBlock: {
            margin: 24,
            marginTop: 0,
            padding: 20,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(99, 102, 241, 0.2)',
        },
        infoTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.primary,
            marginBottom: 8,
        },
        infoText: {
            color: theme.text,
            lineHeight: 22,
            opacity: 0.8,
        },
        footer: {
            padding: 24,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.card,
        },
        btn: {
            backgroundColor: theme.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
        },
        btnText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => Alert.alert('Exit Interview?', 'Your progress will be lost.', [{ text: 'Cancel' }, { text: 'Exit', style: 'destructive', onPress: () => router.back() }])}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mock Interview</Text>
                <View style={styles.timerContainer}>
                    <Ionicons name="time-outline" size={16} color="#ef4444" />
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                </View>
            </View>

            <View style={{ padding: 24, paddingBottom: 0 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>Full Stack Developer</Text>
                <Text style={{ color: theme.textSecondary, marginTop: 4 }}>Live Simulation • Round 1</Text>
            </View>

            <ScrollView contentContainerStyle={styles.sectionList}>
                {sections.map((section) => (
                    <TouchableOpacity
                        key={section.id}
                        style={[styles.sectionCard, activeSection === section.id && styles.activeSection]}
                        disabled={section.status === 'Locked'}
                    >
                        <View style={styles.sectionInfo}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <Text style={styles.sectionMeta}>{section.count} • 20 mins</Text>
                        </View>
                        <View style={[styles.statusBadge, section.status === 'Active' && styles.activeStatus]}>
                            <Text style={[styles.statusText, section.status === 'Active' && styles.activeStatusText]}>
                                {section.status}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.infoBlock}>
                <Text style={styles.infoTitle}>Instructions</Text>
                <Text style={styles.infoText}>
                    • Maintain a steady pace.{"\n"}
                    • You cannot pause the timer.{"\n"}
                    • Coding section has strict test cases.{"\n"}
                    • Avoid switching tabs.
                </Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.btn} onPress={() => router.push('/coding/interview/mcq' as any)}>
                    <Text style={styles.btnText}>Start {activeSection} Section</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
