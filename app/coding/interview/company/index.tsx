import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

export default function CompanyPrepScreen() {
    const router = useRouter();
    const { name } = useLocalSearchParams();
    const { theme } = useTheme();

    const companyName = typeof name === 'string' ? name : 'TCS';

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            paddingTop: 60,
            paddingHorizontal: 24,
            paddingBottom: 24,
            backgroundColor: theme.card,
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.text,
        },
        headerSubtitle: {
            fontSize: 16,
            color: theme.textSecondary,
            marginTop: 4,
        },
        section: {
            padding: 24,
        },
        card: {
            backgroundColor: theme.card,
            padding: 20,
            borderRadius: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
            flexDirection: 'row',
            alignItems: 'center',
        },
        iconBox: {
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
        },
        cardContent: {
            flex: 1,
        },
        cardTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 4,
        },
        cardMeta: {
            fontSize: 12,
            color: theme.textSecondary,
        },
        startBtn: {
            padding: 8,
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{companyName} Prep</Text>
                <Text style={styles.headerSubtitle}>Curated questions & patterns</Text>
            </View>

            <ScrollView contentContainerStyle={styles.section}>
                <TouchableOpacity style={styles.card} onPress={() => router.push('/coding/interview/mcq' as any)}>
                    <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
                        <Ionicons name="list" size={24} color="#4f46e5" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Previous Year MCQs</Text>
                        <Text style={styles.cardMeta}>50 Questions • High Repeat</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => router.push('/coding/problems' as any)}>
                    <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                        <Ionicons name="code-slash" size={24} color="#16a34a" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Coding Questions</Text>
                        <Text style={styles.cardMeta}>Top 30 Problems</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => router.push('/coding/interview/mixed' as any)}>
                    <View style={[styles.iconBox, { backgroundColor: '#ffedd5' }]}>
                        <Ionicons name="star" size={24} color="#ea580c" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Top 20 Questions</Text>
                        <Text style={styles.cardMeta}>Must Knows across all subjects</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => router.push('/coding/interview/hr' as any)}>
                    <View style={[styles.iconBox, { backgroundColor: '#fae8ff' }]}>
                        <Ionicons name="chatbubbles" size={24} color="#9333ea" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>HR Interview Qns</Text>
                        <Text style={styles.cardMeta}>Behavioral & Situational</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
