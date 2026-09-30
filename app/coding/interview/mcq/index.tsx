import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

export default function MCQChallengeScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Sample MCQs - In real app, fetch from DB
    const questions = [
        {
            id: 1,
            question: 'What is the output of the following C code?\n\nint a = 5;\nprintf("%d", a++ + ++a);',
            options: ['11', '12', '13', 'Undefined behavior'],
            correct: 3,
            explanation: 'The behavior is undefined because "a" is modified more than once between sequence points.'
        },
        {
            id: 2,
            question: 'Which data structure is best for implementing a priority queue?',
            options: ['Stack', 'Linked List', 'Heap', 'Array'],
            correct: 2,
            explanation: 'A Heap is the most efficient data structure for implementing a priority queue.'
        },
        {
            id: 3,
            question: 'In Java, which keyword is used to prevent method overriding?',
            options: ['static', 'final', 'const', 'abstract'],
            correct: 1,
            explanation: 'The "final" keyword prevents a method from being overridden in a subclass.'
        }
    ];

    const handleOptionSelect = (index: number) => {
        if (isSubmitted) return;
        setSelectedOption(index);
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
        if (selectedOption === questions[currentQ].correct) {
            setScore(score + 1);
        }
    };

    const handleNext = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(currentQ + 1);
            setSelectedOption(null);
            setIsSubmitted(false);
        } else {
            Alert.alert('Quiz Completed', `Your Score: ${score + (selectedOption === questions[currentQ].correct ? 0 : 0)} / ${questions.length}`, [
                { text: 'Finish', onPress: () => router.back() }
            ]);
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
            paddingBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.text,
            marginLeft: 16,
        },
        progressContainer: {
            padding: 24,
        },
        progressText: {
            fontSize: 14,
            color: theme.textSecondary,
            marginBottom: 8,
        },
        progressBar: {
            height: 6,
            backgroundColor: theme.input,
            borderRadius: 3,
            overflow: 'hidden',
        },
        progressFill: {
            height: '100%',
            backgroundColor: theme.primary,
            borderRadius: 3,
        },
        questionContainer: {
            flex: 1,
            paddingHorizontal: 24,
        },
        questionText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 24,
            lineHeight: 26,
        },
        optionCard: {
            backgroundColor: theme.card,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
        },
        selectedOption: {
            borderColor: theme.primary,
            backgroundColor: theme.type === 'dark' ? 'rgba(99, 102, 241, 0.1)' : '#e0e7ff',
        },
        correctOption: {
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
        wrongOption: {
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
        },
        optionCircle: {
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: theme.textSecondary,
            marginRight: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
        selectedCircle: {
            borderColor: theme.primary,
        },
        optionText: {
            fontSize: 16,
            color: theme.text,
            flex: 1,
        },
        explanationBox: {
            marginTop: 20,
            padding: 16,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#22c55e',
        },
        explanationText: {
            color: theme.text,
            fontSize: 14,
            lineHeight: 20,
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
        },
        disabledBtn: {
            opacity: 0.5,
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>MCQ Challenge</Text>
            </View>

            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Question {currentQ + 1} of {questions.length}</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${((currentQ + 1) / questions.length) * 100}%` }]} />
                </View>
            </View>

            <ScrollView style={styles.questionContainer}>
                <Text style={styles.questionText}>{questions[currentQ].question}</Text>

                {questions[currentQ].options.map((option, index) => {
                    let optionStyle = styles.optionCard;
                    if (isSubmitted) {
                        if (index === questions[currentQ].correct) optionStyle = [styles.optionCard, styles.correctOption];
                        else if (index === selectedOption) optionStyle = [styles.optionCard, styles.wrongOption];
                    } else if (index === selectedOption) {
                        optionStyle = [styles.optionCard, styles.selectedOption];
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            style={optionStyle}
                            onPress={() => handleOptionSelect(index)}
                            disabled={isSubmitted}
                        >
                            <View style={[
                                styles.optionCircle,
                                index === selectedOption && styles.selectedCircle,
                                isSubmitted && index === questions[currentQ].correct && { borderColor: '#22c55e', backgroundColor: '#22c55e' }
                            ]}>
                                {isSubmitted && index === questions[currentQ].correct && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    );
                })}

                {isSubmitted && (
                    <View style={styles.explanationBox}>
                        <Text style={{ fontWeight: 'bold', color: '#166534', marginBottom: 4 }}>Explanation:</Text>
                        <Text style={styles.explanationText}>{questions[currentQ].explanation}</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                {!isSubmitted ? (
                    <TouchableOpacity style={[styles.btn, selectedOption === null && styles.disabledBtn]} onPress={handleSubmit} disabled={selectedOption === null}>
                        <Text style={styles.btnText}>Submit Answer</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.btn} onPress={handleNext}>
                        <Text style={styles.btnText}>{currentQ === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
