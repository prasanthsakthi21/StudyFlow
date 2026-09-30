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

export default function TheoryPrepScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const questions = [
        {
            id: 1,
            question: 'What is Normalization?',
            answer: 'Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity. It involves dividing large tables into smaller tables and defining relationships between them.',
            details: 'Key Normal Forms:\n\n1NF: Atomic values\n2NF: No partial dependency\n3NF: No transitive dependency\nBCNF: Strict 3NF'
        },
        {
            id: 2,
            question: 'ACID Properties in DBMS?',
            answer: 'ACID stands for Atomicity, Consistency, Isolation, and Durability. These properties ensure reliable processing of database transactions.',
            details: 'Atomicity: All or nothing\nConsistency: Valid state transition\nIsolation: Transactions are independent\nDurability: Changes are permanent'
        },
        {
            id: 3,
            question: 'Difference between SQL and NoSQL?',
            answer: 'SQL databases are relational, table-based, and have a predefined schema. NoSQL databases are non-relational, document/key-value based, and have dynamic schemas.',
            details: 'Use SQL for complex queries and transactions. Use NoSQL for scalability and unstructured data.'
        },
        {
            id: 4,
            question: 'What is Indexing?',
            answer: 'Indexing is a data structure technique used to quickly locate and access the data in a database table.',
            details: 'Clustered Index: Sorts physical data rows (only 1 per table). Non-Clustered Index: Logical order (multiple allowed).'
        },
        {
            id: 5,
            question: 'Function vs Stored Procedure?',
            answer: 'A Function must return a value and cannot affect default database state. A Stored Procedure may or may not return a value and can modify database state.',
            details: 'Stored Procedures are precompiled and faster for repetitive tasks.'
        },
        {
            id: 6,
            question: 'What is a Trigger?',
            answer: 'A Trigger is a stored procedure that automatically runs (fires) when an event occurs in the database server.',
            details: 'Events: INSERT, UPDATE, DELETE. Used for audit trails and data integrity.'
        },
        {
            id: 7,
            question: 'Difference between DDL and DML?',
            answer: 'DDL (Data Definition Language) defines schema (CREATE, DROP). DML (Data Manipulation Language) manages data (SELECT, INSERT, UPDATE).',
            details: 'DDL commands are auto-committed. DML commands can be rolled back.'
        },
        {
            id: 8,
            question: 'What is a Cursor?',
            answer: 'A Cursor is a database object used to retrieve, manipulate, and traverse through a result set row-by-row.',
            details: 'Types: Implicit (auto-created by SQL) and Explicit (defined by user).'
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
                <Text style={styles.headerTitle}>DBMS Viva Prep</Text>
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
