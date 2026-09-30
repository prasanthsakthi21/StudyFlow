import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { API_URL } from '../../../constants/Api';

export default function ProblemSetScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [filter, setFilter] = useState('All');
    const [problems, setProblems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            const res = await fetch(`${API_URL}/coding-problems`);
            const data = await res.json();
            if (res.ok) {
                setProblems(data.problems);
            } else {
                console.error("Failed to load problems:", data);
            }
        } catch (e) {
            console.error("Network Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return '#22c55e';
            case 'Medium': return '#eab308';
            case 'Hard': return '#ef4444';
            default: return theme.text;
        }
    };

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
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.text,
        },
        filterContainer: {
            marginTop: 16,
            flexDirection: 'row',
            gap: 12,
        },
        filterChip: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
        },
        activeFilterChip: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        filterText: {
            color: theme.textSecondary,
            fontWeight: '600',
        },
        activeFilterText: {
            color: '#fff',
        },
        listContent: {
            padding: 24,
        },
        problemCard: {
            backgroundColor: theme.card,
            padding: 16,
            borderRadius: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        problemMain: {
            flex: 1,
        },
        problemTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 6,
        },
        tagsRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 8,
        },
        tag: {
            fontSize: 10,
            color: theme.textSecondary,
            backgroundColor: theme.input,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
        },
        diffBadge: {
            fontSize: 12,
            fontWeight: '700',
        },
        solveBtn: {
            backgroundColor: theme.input,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
        },
        solveBtnText: {
            color: theme.primary,
            fontWeight: 'bold',
            fontSize: 12,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        }
    });

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Problem Set</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                    {['All', 'Easy', 'Medium', 'Hard'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.activeFilterChip]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                {problems.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>No problems found.</Text>
                ) : (
                    problems.filter(p => filter === 'All' || p.difficulty === filter).map((problem) => (
                        <TouchableOpacity key={problem.id} style={styles.problemCard} onPress={() => router.push({ pathname: '/coding/solve' as any, params: { id: problem.id } })}>
                            <View style={styles.problemMain}>
                                <Text style={styles.problemTitle}>{problem.title}</Text>
                                <View style={styles.tagsRow}>
                                    {Array.isArray(problem.tags) && problem.tags.map((t: string) => <Text key={t} style={styles.tag}>{t}</Text>)}
                                </View>
                                <Text style={[styles.diffBadge, { color: getDifficultyColor(problem.difficulty) }]}>{problem.difficulty}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                {/* Placeholder for 'Solved' check */}
                                <TouchableOpacity style={styles.solveBtn}>
                                    <Text style={styles.solveBtnText}>Solve</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
