import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../constants/Api';

export default function ExamPrepScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [activePlan, setActivePlan] = useState<any>(null);
    const [userId, setUserId] = useState<number | null>(null);

    // Creation State
    const [syllabusText, setSyllabusText] = useState('');
    const [examTitle, setExamTitle] = useState('');
    const [examDate, setExamDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                const id = JSON.parse(token).id;
                setUserId(id);
                fetchActivePlan(id);
            }
        } catch (e) {
            console.error('Failed to load user', e);
        }
    };

    const fetchActivePlan = async (id: number) => {
        try {
            const response = await fetch(`${API_URL}/users/${id}/study-plans`);
            if (response.ok) {
                const data = await response.json();
                setActivePlan(data.plan);
            }
        } catch (e) { console.error(e); }
    };

    const handleCreatePlan = async () => {
        if (!userId) {
            Alert.alert("Error", "User not logged in");
            return;
        }
        if (!syllabusText.trim() || !examTitle.trim()) {
            Alert.alert("Input Required", "Please enter a title and syllabus topics.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/generate-study-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    title: examTitle,
                    syllabus: syllabusText,
                    examDate: examDate.toISOString()
                })
            });

            const data = await response.json();
            if (response.ok) {
                setActivePlan(data.plan); // Use the returned plan (which is parsed JSON)
                Alert.alert("Success", "Your smart study plan is ready!");
            } else {
                Alert.alert("Error", data.error || "Failed to generate plan");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // Render Timeline Item
    const renderDayItem = (dayData: any, index: number) => {
        return (
            <View key={index} style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.dayHeader}>
                    <View style={[styles.dayBadge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.dayText, { color: theme.primary }]}>Day {dayData.day}</Text>
                    </View>
                    <Text style={[styles.dayTopic, { color: theme.text }]}>{dayData.topic}</Text>
                </View>
                <View style={styles.taskList}>
                    {dayData.tasks.map((task: string, i: number) => (
                        <View key={i} style={styles.taskRow}>
                            <Ionicons name="ellipse" size={8} color={theme.textSecondary} style={{ marginTop: 6, marginRight: 8 }} />
                            <Text style={[styles.taskText, { color: theme.textSecondary }]}>{task}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style="light" />

            {/* Header */}
            <LinearGradient
                colors={['#8b5cf6', '#6d28d9']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Exam Companion</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* STATE 1: NO ACTIVE PLAN */}
                {!activePlan ? (
                    <View>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Create New Plan</Text>
                        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                            Upload your syllabus and tell us when your exam is. We'll plan the rest.
                        </Text>

                        <Text style={[styles.label, { color: theme.text }]}>Exam Title</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="e.g. Finals, GRE, Java Certification"
                            placeholderTextColor={theme.textSecondary}
                            value={examTitle}
                            onChangeText={setExamTitle}
                        />

                        <Text style={[styles.label, { color: theme.text }]}>Exam Date</Text>
                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={{ color: theme.text, fontSize: 16 }}>{examDate.toDateString()}</Text>
                            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={examDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) setExamDate(selectedDate);
                                }}
                                minimumDate={new Date()}
                            />
                        )}

                        <Text style={[styles.label, { color: theme.text }]}>Syllabus Topics</Text>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="Paste your syllabus topics here..."
                            placeholderTextColor={theme.textSecondary}
                            multiline
                            numberOfLines={6}
                            value={syllabusText}
                            onChangeText={setSyllabusText}
                        />

                        <TouchableOpacity
                            style={[styles.createButton, { opacity: loading ? 0.7 : 1 }]}
                            onPress={handleCreatePlan}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createButtonText}>Generate Smart Plan</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* STATE 2: ACTIVE PLAN DASHBOARD */
                    <View>
                        <View style={[styles.planHeaderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View>
                                <Text style={[styles.activePlanTitle, { color: theme.text }]}>{activePlan.title}</Text>
                                <Text style={[styles.activePlanDate, { color: theme.textSecondary }]}>Target: {new Date(activePlan.exam_date).toDateString()}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: '#10b98120' }]}>
                                <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 12 }}>ACTIVE</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Your Schedule</Text>
                            <TouchableOpacity onPress={() => setActivePlan(null)}>
                                <Text style={{ color: theme.primary, fontWeight: '600' }}>New Plan</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Handle both direct Array (from API) and DB Object (from GET) */}
                        {(() => {
                            const planData = Array.isArray(activePlan) ? activePlan :
                                (activePlan.plan_json ? (typeof activePlan.plan_json === 'string' ? JSON.parse(activePlan.plan_json) : activePlan.plan_json) : []);
                            return planData.map((day: any, index: number) => renderDayItem(day, index));
                        })()}

                        <View style={{ height: 40 }} />
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    content: { padding: 24 },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 24,
        lineHeight: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        padding: 16,
        borderRadius: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    textArea: {
        padding: 16,
        borderRadius: 16,
        fontSize: 16,
        borderWidth: 1,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    createButton: {
        backgroundColor: '#8b5cf6',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 32,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Active Plan Styles
    planHeaderCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 30,
    },
    activePlanTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    activePlanDate: {
        fontSize: 13,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    dayCard: {
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    dayBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 12,
    },
    dayText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    dayTopic: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    taskList: {
        padding: 16,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskText: {
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    }
});
