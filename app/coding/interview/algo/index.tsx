import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function AlgoPrepScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const questions = [
        {
            id: 1,
            question: 'Time vs Space Complexity (Big-O)',
            answer: 'Time complexity measures execution time relative to input size. Space complexity measures memory usage relative to input size.',
            details: 'Best Case (Ω), Average Case (Θ), Worst Case (O).'
        },
        {
            id: 2,
            question: 'Difference between Merge Sort and Quick Sort?',
            answer: 'Merge Sort is stable and O(n log n) but requires O(n) extra space. Quick Sort is unstable, O(n log n) avg, but O(n²) worst case.',
            details: 'Quick Sort is generally faster in practice due to better cache locality.'
        },
        {
            id: 3,
            question: 'What is Recursion?',
            answer: 'Recursion is a technique where a function calls itself. It must have a base condition to stop infinite recursion.',
            details: 'Risk: Stack Overflow if depth is too high.'
        },
        {
            id: 4,
            question: 'Greedy vs Dynamic Programming?',
            answer: 'Greedy makes the locally optimal choice at each step. Dynamic Programming solves complex problems by breaking them into overlapping subproblems and storing results.',
            details: 'Example: Dijkstra (Greedy) vs Floyd-Warshall (DP).'
        },
        {
            id: 5,
            question: 'Searching Algorithms Complexity?',
            answer: 'Linear Search is O(n). Binary Search is O(log n) but requires a sorted array.',
            details: 'Binary Search uses divide and conquer.'
        },
        {
            id: 6,
            question: "How does Bubble Sort work?",
            answer: "Bubble Sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. It is simple but inefficient.",
            details: "Time Complexity: O(n²) in worst/average case, O(n) in best case (already sorted)."
        },
        {
            id: 7,
            question: "Explain Dijkstra's Algorithm.",
            answer: "Dijkstra's algorithm finds the shortest path from a source node to all other nodes in a weighted graph (non-negative weights).",
            details: "Uses a Priority Queue (Min-Heap). Time Complexity: O(E log V)."
        },
        {
            id: 8,
            question: "What is Divide and Conquer?",
            answer: "It breaks a problem into smaller sub-problems, solves them recursively, and combines the results.",
            details: "Examples: Merge Sort, Quick Sort, Binary Search."
        },
        {
            id: 9,
            question: "What is Backtracking?",
            answer: "Backtracking is an algorithmic-technique for solving problems recursively by trying to build a solution incrementally and abandoning it when it fails (backtracks).",
            details: "Examples: N-Queens problem, Sudoku solver, Rat in a Maze."
        },
        {
            id: 10,
            question: "What is Sliding Window Technique?",
            answer: "It is an optimization technique used to convert nested loops into a single loop to reduce time complexity, usually for array/string problems.",
            details: "Commonly used for subarray problems like 'Maximum Sum Subarray of size K'."
        }
    ];

    const toggleExpand = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
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
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.text,
        },
        list: {
            padding: 24,
        },
        card: {
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
        },
        questionRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        questionText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
            flex: 1,
            marginRight: 16,
        },
        answerContainer: {
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        answerText: {
            fontSize: 14,
            color: theme.text,
            lineHeight: 22,
        },
        detailsContainer: {
            marginTop: 12,
            padding: 12,
            backgroundColor: theme.input,
            borderRadius: 8,
        },
        detailsText: {
            fontSize: 13,
            color: theme.textSecondary,
            fontFamily: 'monospace',
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Algorithms</Text>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {questions.map((q) => (
                    <TouchableOpacity key={q.id} style={styles.card} onPress={() => toggleExpand(q.id)} activeOpacity={0.8}>
                        <View style={styles.questionRow}>
                            <Text style={styles.questionText}>{q.id}. {q.question}</Text>
                            <Ionicons name={expandedId === q.id ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                        </View>
                        {expandedId === q.id && (
                            <View style={styles.answerContainer}>
                                <Text style={styles.answerText}>{q.answer}</Text>
                                <View style={styles.detailsContainer}>
                                    <Text style={styles.detailsText}>{q.details}</Text>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}
