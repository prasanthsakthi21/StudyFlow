import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function InterviewPrepScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const companies = [
        { name: 'TCS', logo: 'business', color: '#1d4ed8', type: 'Service' },
        { name: 'Infosys', logo: 'business', color: '#0ea5e9', type: 'Service' },
        { name: 'Zoho', logo: 'business', color: '#eab308', type: 'Product' },
        { name: 'Wipro', logo: 'business', color: '#22c55e', type: 'Service' },
        { name: 'Accenture', logo: 'business', color: '#a855f7', type: 'Service' },
    ];

    const modes = [
        { title: 'Practice Mode', icon: 'bicycle', color: '#10b981', route: '/coding/interview/practice' },
        { title: 'Mock Interview', icon: 'timer', color: '#ef4444', route: '/coding/interview/mock' },
    ];

    const categories = [
        { title: 'Data Structures', count: '150+ Qns', icon: 'layers', color: '#8b5cf6', route: '/coding/interview/ds' },
        { title: 'Algorithms', count: '100+ Qns', icon: 'git-network', color: '#f43f5e', route: '/coding/interview/algo' },
        { title: 'DBMS', count: '50+ Qns', icon: 'server', color: '#10b981', route: '/coding/interview/theory/dbms' },
        { title: 'OS', count: '40+ Qns', icon: 'desktop', color: '#f97316', route: '/coding/interview/theory/os' },
        { title: 'Comp. Networks', count: '40+ Qns', icon: 'globe', color: '#06b6d4', route: '/coding/interview/theory/cn' },
        { title: 'MCQ Challenge', count: '200+ Qns', icon: 'list', color: '#3b82f6', route: '/coding/interview/mcq' },
    ];

    const stats = [
        { label: 'Mock Score', value: '85%' },
        { label: 'Strongest', value: 'Arrays' },
        { label: 'Accuracy', value: '92%' },
    ];

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            paddingTop: 60,
            paddingHorizontal: 24,
            paddingBottom: 20,
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
        statsContainer: {
            flexDirection: 'row',
            backgroundColor: theme.card,
            marginHorizontal: 24,
            marginTop: 10,
            marginBottom: 24,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            justifyContent: 'space-between',
        },
        statItem: {
            alignItems: 'center',
        },
        statValue: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.primary,
            marginBottom: 4,
        },
        statLabel: {
            fontSize: 10,
            color: theme.textSecondary,
            textTransform: 'uppercase',
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.text,
            marginLeft: 24,
            marginBottom: 16,
            marginTop: 24,
        },
        companyScroll: {
            paddingHorizontal: 24,
        },
        companyCard: {
            width: 140,
            height: 130,
            backgroundColor: theme.card,
            marginRight: 16,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
            elevation: 2,
        },
        companyIcon: {
            width: 48,
            height: 48,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
        },
        companyName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
        },
        companyType: {
            fontSize: 10,
            color: theme.textSecondary,
            marginTop: 4,
            paddingHorizontal: 8,
            paddingVertical: 2,
            backgroundColor: theme.input,
            borderRadius: 8,
        },
        modesContainer: {
            flexDirection: 'row',
            paddingHorizontal: 24,
            gap: 16,
        },
        modeCard: {
            flex: 1,
            height: 100,
            borderRadius: 20,
            padding: 16,
            justifyContent: 'space-between',
        },
        modeTitle: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        categoryGrid: {
            paddingHorizontal: 24,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
        },
        categoryCard: {
            width: (width - 48 - 16) / 2,
            backgroundColor: theme.card,
            padding: 16,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
        },
        catIconConfig: {
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
        },
        catTitle: {
            fontSize: 15,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 4,
        },
        catCount: {
            fontSize: 12,
            color: theme.textSecondary,
        },
        mockCard: {
            margin: 24,
            marginTop: 10,
            borderRadius: 24,
            overflow: 'hidden',
        },
        mockGradient: {
            padding: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        mockText: {
            flex: 1,
        },
        mockTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 6,
        },
        mockSubtitle: {
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14,
            marginBottom: 16,
        },
        startMockBtn: {
            backgroundColor: '#fff',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 12,
            alignSelf: 'flex-start',
        },
        startMockText: {
            color: '#6366f1',
            fontWeight: 'bold',
        }
    });

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Interview Prep</Text>
                    <Text style={styles.headerSubtitle}>Ace your placement exams</Text>
                </View>

                <View style={styles.statsContainer}>
                    {stats.map((s, i) => (
                        <View key={i} style={styles.statItem}>
                            <Text style={styles.statValue}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.mockCard}>
                    <LinearGradient
                        colors={['#6366f1', '#4f46e5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.mockGradient}
                    >
                        <View style={styles.mockText}>
                            <Text style={styles.mockTitle}>Mock Interview Mode</Text>
                            <Text style={styles.mockSubtitle}>60 mins • Coding + MCQ + Theory</Text>
                            <TouchableOpacity style={styles.startMockBtn} onPress={() => router.push('/coding/interview/mock' as any)}>
                                <Text style={styles.startMockText}>Start Now</Text>
                            </TouchableOpacity>
                        </View>
                        <Ionicons name="timer-outline" size={64} color="rgba(255,255,255,0.2)" />
                    </LinearGradient>
                </View>

                <Text style={styles.sectionTitle}>Target Company</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.companyScroll}>
                    {companies.map((c, i) => (
                        <TouchableOpacity key={i} style={styles.companyCard} onPress={() => router.push({ pathname: '/coding/interview/company', params: { name: c.name } } as any)}>
                            <View style={[styles.companyIcon, { backgroundColor: c.color + '20' }]}>
                                <Ionicons name={c.logo as any} size={28} color={c.color} />
                            </View>
                            <Text style={styles.companyName}>{c.name}</Text>
                            <Text style={styles.companyType}>{c.type}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.sectionTitle}>Preparation Modules</Text>
                <View style={styles.categoryGrid}>
                    {categories.map((c, i) => (
                        <TouchableOpacity key={i} style={styles.categoryCard} onPress={() => router.push(c.route as any)}>
                            <View style={[styles.catIconConfig, { backgroundColor: c.color + '20' }]}>
                                <Ionicons name={c.icon as any} size={20} color={c.color} />
                            </View>
                            <Text style={styles.catTitle}>{c.title}</Text>
                            <Text style={styles.catCount}>{c.count}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}
