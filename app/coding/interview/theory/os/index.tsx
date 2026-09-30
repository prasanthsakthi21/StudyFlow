import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../context/ThemeContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function OSPrepScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const questions = [
        {
            id: 1,
            question: 'What is a Process vs Thread?',
            answer: 'A Process is a program in execution with its own memory space. A Thread is a lightweight process that shares memory and resources with other threads of the same process.',
            details: 'Context switch is faster in threads. Processes provide better isolation.'
        },
        {
            id: 2,
            question: 'What is Deadlock?',
            answer: 'Deadlock is a situation where two or more processes are blocked forever, waiting for each other to release resources.',
            details: 'Conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.'
        },
        {
            id: 3,
            question: 'Explain Paging.',
            answer: 'Paging is a memory management scheme that eliminates the need for contiguous allocation of physical memory. It divides memory into fixed-size pages.',
            details: 'Avoids external fragmentation. Uses Page Table for address translation.'
        },
        {
            id: 4,
            question: 'Difference between Semaphore and Mutex?',
            answer: 'Mutex (locking mechanism) allows only one thread to access a resource. Semaphore (signaling mechanism) allows multiple threads to access a resource (up to a limit).',
            details: 'Mutex: Binary Semaphore. Semaphore: Counting Semaphore.'
        },
        {
            id: 5,
            question: 'What is Thrashing?',
            answer: 'Thrashing occurs when the system spends more time waiting for pages to be swapped in and out of memory than executing processes.',
            details: 'Caused by high degree of multiprogramming and lack of physical memory.'
        },
        {
            id: 6,
            question: 'Monolithic vs Micro Kernel?',
            answer: 'Monolithic Kernel runs all OS services in kernel space (faster, less secure). Micro Kernel runs minimum services in kernel space (slower, more secure).',
            details: 'Examples: Linux (Monolithic), Minix (Micro).'
        },
        {
            id: 7,
            question: 'What is a Race Condition?',
            answer: 'A Race Condition occurs when multiple threads/processes access shared data concurrently and the final outcome depends on the order of execution.',
            details: 'Solved using synchronization techniques like Locks or Semaphores.'
        },
        {
            id: 8,
            question: 'What is Banker\'s Algorithm?',
            answer: 'The Banker\'s algorithm is a resource allocation and deadlock avoidance algorithm that tests for safety by simulating the allocation of resources.',
            details: 'It checks if granting a request will leave the system in a safe state.'
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
                <Text style={styles.headerTitle}>OS Prep</Text>
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
