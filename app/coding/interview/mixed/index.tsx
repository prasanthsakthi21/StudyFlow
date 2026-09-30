import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function Top20QuestionsScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState('All');

    const topics = ['All', 'Data Structures', 'Algorithms', 'DBMS', 'OS', 'Networks'];

    const questions = [
        { id: 1, category: 'Data Structures', question: 'What is the difference between Array and Linked List?', answer: 'Array has fixed size and contiguous memory, while Linked List has dynamic size and non-contiguous memory with pointers.' },
        { id: 2, category: 'Data Structures', question: 'What is Stack and where is it used?', answer: 'Stack follows LIFO. Used in function calls, undo/redo operations, and expression evaluation.' },
        { id: 3, category: 'Data Structures', question: 'What is Queue?', answer: 'Queue follows FIFO. Used in CPU scheduling, printer queue, and buffering.' },
        { id: 4, category: 'Data Structures', question: 'What is a Binary Search Tree?', answer: 'A tree where left child < root < right child, enabling faster searching.' },
        { id: 5, category: 'Data Structures', question: 'What is Hashing?', answer: 'Hashing is a technique to map data to fixed-size values for fast access (O(1) average).' },

        { id: 6, category: 'Algorithms', question: 'What is Time Complexity?', answer: 'It measures how execution time grows with input size, represented using Big-O notation.' },
        { id: 7, category: 'Algorithms', question: 'Difference between Linear Search and Binary Search?', answer: 'Linear search checks all elements (O(n)), Binary search works on sorted data (O(log n)).' },
        { id: 8, category: 'Algorithms', question: 'Difference between Merge Sort and Quick Sort?', answer: 'Merge sort is stable and needs extra memory; Quick sort is faster in practice but unstable.' },
        { id: 9, category: 'Algorithms', question: 'What is Recursion?', answer: 'A function calling itself with a base condition to stop execution.' },

        { id: 10, category: 'DBMS', question: 'What is a Primary Key?', answer: 'A unique identifier for each record in a table. It cannot be NULL.' },
        { id: 11, category: 'DBMS', question: 'What is Normalization?', answer: 'Process of reducing redundancy and improving data integrity in databases.' },
        { id: 12, category: 'DBMS', question: 'Difference between DELETE and TRUNCATE?', answer: 'DELETE removes selected rows and can be rolled back; TRUNCATE removes all rows permanently.' },
        { id: 13, category: 'DBMS', question: 'What is ACID property?', answer: 'ACID ensures reliable transactions: Atomicity, Consistency, Isolation, Durability.' },

        { id: 14, category: 'OS', question: 'Difference between Process and Thread?', answer: 'Process is heavy-weight with separate memory; Thread is lightweight and shares memory.' },
        { id: 15, category: 'OS', question: 'What is Deadlock?', answer: 'A situation where processes wait indefinitely for resources held by each other.' },
        { id: 16, category: 'OS', question: 'What is CPU Scheduling?', answer: 'The method of selecting a process from the ready queue for execution.' },
        { id: 17, category: 'OS', question: 'What is Virtual Memory?', answer: 'A memory management technique that uses disk space as an extension of RAM.' },

        { id: 18, category: 'Networks', question: 'What is the OSI Model?', answer: 'A 7-layer model that defines network communication functions.' },
        { id: 19, category: 'Networks', question: 'Difference between TCP and UDP?', answer: 'TCP is reliable and connection-oriented; UDP is faster and connectionless.' },
        { id: 20, category: 'Networks', question: 'What happens when you type a URL in a browser?', answer: 'DNS lookup → server request → response → page rendering.' },
    ];

    const filteredQuestions = activeTab === 'All' ? questions : questions.filter(q => q.category === activeTab);

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
            backgroundColor: theme.primary,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 8,
        },
        headerSubtitle: {
            color: 'rgba(255,255,255,0.9)',
            fontSize: 14,
        },
        filterScroll: {
            paddingHorizontal: 24,
            marginBottom: 16,
        },
        filterChip: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            marginRight: 10,
        },
        activeChip: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        filterText: {
            fontSize: 12,
            fontWeight: 'bold',
            color: theme.textSecondary,
        },
        activeFilterText: {
            color: '#fff',
        },
        list: {
            padding: 24,
            paddingTop: 0,
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
        categoryBadge: {
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            marginBottom: 12,
            backgroundColor: theme.input,
        },
        badgeText: {
            fontSize: 10,
            fontWeight: 'bold',
            color: theme.primary,
            textTransform: 'uppercase',
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerTitle}>Top 20 Questions</Text>
                <Text style={styles.headerSubtitle}>Most frequently asked in interviews</Text>
            </View>

            <View style={{ height: 60, marginTop: 20 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {topics.map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.filterChip, activeTab === t && styles.activeChip]}
                            onPress={() => setActiveTab(t)}
                        >
                            <Text style={[styles.filterText, activeTab === t && styles.activeFilterText]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {filteredQuestions.map((q) => (
                    <TouchableOpacity key={q.id} style={styles.card} onPress={() => toggleExpand(q.id)} activeOpacity={0.9}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.badgeText}>{q.category}</Text>
                        </View>
                        <View style={styles.questionRow}>
                            <Text style={styles.questionText}>{q.question}</Text>
                            <Ionicons name={expandedId === q.id ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                        </View>
                        {expandedId === q.id && (
                            <View style={styles.answerContainer}>
                                <Text style={styles.answerText}>{q.answer}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}
