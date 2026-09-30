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

export default function DSPrepScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const questions = [
        {
            id: 1,
            question: 'Difference between Array and Linked List?',
            answer: 'Array has fixed size and O(1) access time. Linked List has dynamic size and O(n) access time but efficient insertions/deletions.',
            details: 'Array: Contiguous memory. Linked List: Non-contiguous, uses pointers.'
        },
        {
            id: 2,
            question: 'What is a Stack?',
            answer: 'Stack is a linear data structure following LIFO (Last In First Out) order. Operations include push, pop, and peek.',
            details: 'Applications: Function calls, Undo mechanism, Expression evaluation.'
        },
        {
            id: 3,
            question: 'What is a Queue?',
            answer: 'Queue follows FIFO (First In First Out) principle. Elements are inserted at the rear and removed from the front.',
            details: 'Types: Circular Queue, Priority Queue, Deque.'
        },
        {
            id: 4,
            question: 'Explain Binary Search Tree (BST).',
            answer: 'A BST is a binary tree where the left child is smaller than the root, and the right child is greater than the root.',
            details: 'Inorder traversal of BST gives sorted list. Search complexity: O(log n).'
        },
        {
            id: 5,
            question: 'What is Hashing?',
            answer: 'Hashing maps data of arbitrary size to fixed-size values using a hash function for O(1) average lookup time.',
            details: 'Collision handling: Chaining (Linked Lists), Open Addressing (Linear Probing).'
        },
        {
            id: 6,
            question: 'Difference between Stack and Heap memory?',
            answer: 'Stack is used for static memory allocation and execution of threads (fast access). Heap is used for dynamic memory allocation (slower access, larger size).',
            details: 'Stack overflow occurs when stack limit is reached. Memory leak occurs in heap if memory is not freed.'
        },
        {
            id: 7,
            question: 'What are BFS and DFS?',
            answer: 'BFS (Breadth-First Search) traverses level by level using a Queue. DFS (Depth-First Search) goes deep into nodes using a Stack (or recursion).',
            details: 'BFS finds shortest path in unweighted graphs. DFS is good for cycle detection and topological sorting.'
        },
        {
            id: 8,
            question: 'Explain Infix, Prefix, and Postfix.',
            answer: 'Infix: A + B (Human readable). Prefix: +AB (Polish Notation). Postfix: AB+ (Reverse Polish Notation, easier for computers to evaluate).',
            details: 'Stack is used to convert Infix to Postfix expressions.'
        },
        {
            id: 9,
            question: 'What is an AVL Tree?',
            answer: 'AVL is a self-balancing Binary Search Tree where the difference between heights of left and right subtrees cannot be more than one for all nodes.',
            details: 'Rotations (Left, Right, LR, RL) are used to maintain balance during insertion/deletion.'
        },
        {
            id: 10,
            question: 'What is a Trie?',
            answer: 'Trie (Prefix Tree) is a tree-based data structure used for efficient retrieval of keys in a large dataset of strings.',
            details: 'Used in autocomplete, spell checking, and IP routing. Search complexity is O(L) where L is key length.'
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
                <Text style={styles.headerTitle}>Data Structures</Text>
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
