import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { API_URL } from '../../constants/Api';
import { useTheme } from '../../context/ThemeContext';

export default function QuizTakerScreen() {
    const { id, isFile } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // 0
    const [answers, setAnswers] = useState<{ [key: number]: number }>({}); // qId -> optionId
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);

    const styles = StyleSheet.create({
        mainContainer: { flex: 1, backgroundColor: theme.background },
        background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
        header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, gap: 15 },
        closeButton: { padding: 8 },
        progressBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
        progressFill: { height: '100%', backgroundColor: theme.primary, borderRadius: 4 },
        progressText: { color: theme.textSecondary, fontWeight: 'bold' },
        content: { padding: 20 },
        questionText: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 30, lineHeight: 32 },
        optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
        optionSelected: { borderColor: theme.primary, backgroundColor: 'rgba(56, 189, 248, 0.1)' },
        radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: theme.textSecondary, marginRight: 15 },
        radioSelected: { borderColor: theme.primary, backgroundColor: theme.primary },
        optionText: { color: theme.textSecondary, fontSize: 16, flex: 1 },
        optionTextSelected: { color: theme.primary, fontWeight: 'bold' },
        footer: { padding: 20, paddingBottom: 40 },
        footerButtons: { flexDirection: 'row', gap: 12 },
        navButton: { borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
        prevButton: { backgroundColor: theme.input, width: 56 },
        nextButton: { backgroundColor: theme.primary, flex: 1, gap: 8 },
        disabledButton: { opacity: 0.5 },
        nextButtonText: { color: theme.type === 'dark' ? '#0f172a' : '#fff', fontWeight: 'bold', fontSize: 16 },

        // Result Screen
        resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
        resultTitle: { fontSize: 32, fontWeight: 'bold', color: theme.text, marginBottom: 10 },
        scoreText: { fontSize: 20, color: theme.textSecondary, marginBottom: 40 },
        primaryButton: { backgroundColor: theme.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12, marginBottom: 20 },
        buttonText: { color: theme.type === 'dark' ? '#0f172a' : '#fff', fontWeight: 'bold', fontSize: 16 },

        // Review Styles
        reviewContainer: { width: '100%', maxHeight: '40%', marginBottom: 30, paddingHorizontal: 10 },
        reviewCard: { backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
        reviewQuestion: { color: theme.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
        reviewAnswerRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, gap: 10, marginBottom: 4 },
        correctRow: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
        wrongRow: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
        reviewLabel: { color: theme.textSecondary, fontSize: 12, fontStyle: 'italic' },
        reviewValue: { color: theme.text, fontSize: 14, flex: 1, fontWeight: '500' }
    });

    useEffect(() => {
        if (id) fetchQuizDetails();
    }, [id]);

    const fetchQuizDetails = async () => {
        try {
            console.log(`Fetching Quiz: ID=${id}, isFile=${isFile}`);
            const endpoint = isFile === 'true' ? `${API_URL}/files/${id}/quiz` : `${API_URL}/quizzes/${id}`;
            const res = await fetch(endpoint);
            const data = await res.json();

            // console.log('Quiz Data:', data);

            if (res.ok) {
                setQuiz(data);
            } else {
                Alert.alert('Error', data.error || 'Failed to load quiz');
                router.back();
            }
        } catch (error) {
            Alert.alert('Error', 'Network Error');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (qId: number, oId: number) => {
        setAnswers(prev => ({ ...prev, [qId]: oId }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            calculateResult();
        }
    };

    const calculateResult = async () => {
        let correctCount = 0;
        quiz.questions.forEach((q: any) => {
            const selectedOptionId = answers[q.id];
            const correctOption = q.options.find((o: any) => o.is_correct);
            if (correctOption && selectedOptionId === correctOption.id) {
                correctCount++;
            }
        });
        setScore(correctCount);
        setShowResult(true);

        // Calculate Credits (e.g., 10 points per correct answer)
        const earnedCredits = correctCount * 10;
        if (earnedCredits > 0) {
            try {
                const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    const userId = JSON.parse(token).id;
                    await fetch(`${API_URL}/users/${userId}/credits`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ credits: earnedCredits })
                    });
                    console.log(`Added ${earnedCredits} credits to user ${userId}`);
                }
            } catch (error) {
                console.error('Failed to update credits:', error);
            }
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }

    if (!quiz) return null;

    if (!quiz.questions || quiz.questions.length === 0) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.questionText, { textAlign: 'center', marginTop: 20 }]}>
                    No questions generated for this content.
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (showResult) {
        return (
            <View style={styles.mainContainer}>
                <StatusBar style={theme.statusBar} />
                <LinearGradient colors={theme.gradient as any} style={styles.background} />
                <View style={styles.resultContainer}>
                    <Ionicons name="trophy" size={80} color="#fbbf24" style={{ marginBottom: 20 }} />
                    <Text style={styles.resultTitle}>Quiz Completed!</Text>
                    <Text style={styles.scoreText}>You scored {score} / {quiz.questions.length}</Text>

                    {/* Review Section */}
                    <ScrollView style={styles.reviewContainer}>
                        {quiz.questions.map((q: any, i: number) => {
                            const userAnswerId = answers[q.id];
                            const correctOption = q.options.find((o: any) => o.is_correct);
                            const userOption = q.options.find((o: any) => o.id === userAnswerId);
                            const isCorrect = correctOption.id === userAnswerId;

                            return (
                                <View key={q.id} style={styles.reviewCard}>
                                    <Text style={styles.reviewQuestion}>Q{i + 1}: {q.question_text}</Text>

                                    <View style={[styles.reviewAnswerRow, isCorrect ? styles.correctRow : styles.wrongRow]}>
                                        <Text style={styles.reviewLabel}>Your Answer:</Text>
                                        <Text style={styles.reviewValue}>{userOption?.option_text || 'Skipped'}</Text>
                                        <Ionicons name={isCorrect ? "checkmark-circle" : "close-circle"} size={20} color={isCorrect ? "#22c55e" : "#ef4444"} />
                                    </View>

                                    {!isCorrect && (
                                        <View style={[styles.reviewAnswerRow, styles.correctRow]}>
                                            <Text style={styles.reviewLabel}>Correct Answer:</Text>
                                            <Text style={styles.reviewValue}>{correctOption.option_text}</Text>
                                            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
                        <Text style={styles.buttonText}>Back to Quizzes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const question = quiz.questions[currentQuestionIndex];

    return (
        <View style={styles.mainContainer}>
            <StatusBar style={theme.statusBar} />
            <LinearGradient colors={theme.gradient as any} style={styles.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{currentQuestionIndex + 1}/{quiz.questions.length}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.questionText}>{question.question_text}</Text>

                {question.options.map((opt: any) => {
                    const isSelected = answers[question.id] === opt.id;
                    return (
                        <TouchableOpacity
                            key={opt.id}
                            style={[styles.optionCard, isSelected && styles.optionSelected]}
                            onPress={() => handleOptionSelect(question.id, opt.id)}
                        >
                            <View style={[styles.radioCircle, isSelected && styles.radioSelected]} />
                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]} numberOfLines={2}>
                                {opt.option_text}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerButtons}>
                    {/* Previous Button */}
                    <TouchableOpacity
                        style={[styles.navButton, styles.prevButton, currentQuestionIndex === 0 && styles.disabledButton]}
                        onPress={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                    >
                        <Ionicons name="arrow-back" size={20} color={theme.text} />
                    </TouchableOpacity>

                    {/* Next/Finish Button */}
                    <TouchableOpacity
                        style={[styles.navButton, styles.nextButton, !answers[question.id] && styles.disabledButton]}
                        onPress={handleNext}
                        disabled={!answers[question.id]}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color={theme.type === 'dark' ? '#0f172a' : '#fff'} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
