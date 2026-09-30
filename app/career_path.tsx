import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../constants/Api';

const { width } = Dimensions.get('window');

export default function CareerPathScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    // Form inputs
    const [skills, setSkills] = useState('');
    const [interests, setInterests] = useState('');
    const [academics, setAcademics] = useState('');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userId, setUserId] = useState<number | null>(null);

    // Modal state for viewing details
    const [selectedPath, setSelectedPath] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                const user = JSON.parse(token);
                setUserId(user.id);
                setCurrentUser(user);
                fetchLatestResult(user.id);
            }
        } catch (e) {
            console.error('Failed to load user', e);
        }
    };

    const fetchLatestResult = async (id: number) => {
        try {
            const response = await fetch(`${API_URL}/career/latest/${id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.result) {
                    processResult(data.result);
                }
            }
        } catch (e) { console.error(e); }
    };

    const processResult = (rawData: any) => {
        let json = rawData.result_json ? rawData.result_json : rawData;
        if (typeof json === 'string') {
            try {
                json = JSON.parse(json);
            } catch (e) {
                console.error("Failed to parse result", e);
                return;
            }
        }
        setResult(json);
    }

    const handleAnalyze = async () => {
        if (!userId) {
            Alert.alert("Error", "User not logged in");
            return;
        }
        if (!skills.trim() || !interests.trim() || !academics.trim()) {
            Alert.alert("Input Required", "Please fill in all fields (Skills, Interests, Academics).");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/career/assess`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    skills,
                    interests,
                    academics,
                    useAI: true
                })
            });

            const data = await response.json();
            if (response.ok) {
                processResult(data.result);
            } else {
                Alert.alert("Error", data.error || "Failed to analyze profile.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", error instanceof Error ? error.message : "Network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const openPathDetails = (path: any) => {
        setSelectedPath(path);
        setModalVisible(true);
    };

    const renderResult = () => {
        if (!result || !result.recommended_paths) return null;

        return (
            <View>
                {/* 1. Top Recommendations */}
                <View style={[styles.resultHeaderContainer, { marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Recommended Paths</Text>
                    <TouchableOpacity onPress={() => setResult(null)}>
                        <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Reset</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                    {result.recommended_paths.map((path: any, index: number) => (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.8}
                            onPress={() => openPathDetails(path)}
                            style={[styles.recommendationCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                        >
                            <View style={[styles.badge, { backgroundColor: index === 0 ? '#10b981' : '#6366f1' }]}>
                                <Text style={styles.badgeText}>{index === 0 ? 'Best Match' : 'Alternative'}</Text>
                            </View>
                            <Text style={[styles.roleTitle, { color: theme.text }]}>{path.role}</Text>
                            <Text style={[styles.matchScore, { color: theme.primary }]}>{path.match_score} Match</Text>
                            <Text style={[styles.roleReason, { color: theme.textSecondary }]} numberOfLines={3}>{path.reason}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* 2. Learning Roadmap */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Learning Roadmap</Text>
                <View style={[styles.roadmapCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {result.roadmap?.map((step: any, index: number) => (
                        <View key={index} style={styles.roadmapStep}>
                            <View style={styles.stepIndicator}>
                                <View style={[styles.stepCircle, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.stepNumber}>{step.step || index + 1}</Text>
                                </View>
                                {index < result.roadmap.length - 1 && <View style={[styles.stepLine, { backgroundColor: theme.border }]} />}
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                                <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{step.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 3. Certifications & Resume Tips */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                    <View style={[styles.halfCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                        <Ionicons name="ribbon-outline" size={24} color="#15803d" style={{ marginBottom: 8 }} />
                        <Text style={[styles.halfCardTitle, { color: '#15803d' }]}>Certifications</Text>
                        {result.certifications?.map((cert: string, i: number) => (
                            <Text key={i} style={[styles.listItem, { color: '#166534' }]}>• {cert}</Text>
                        ))}
                    </View>
                    <View style={[styles.halfCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                        <Ionicons name="document-text-outline" size={24} color="#1d4ed8" style={{ marginBottom: 8 }} />
                        <Text style={[styles.halfCardTitle, { color: '#1d4ed8' }]}>Resume Tips</Text>
                        {result.resume_tips?.map((tip: string, i: number) => (
                            <Text key={i} style={[styles.listItem, { color: '#1e40af' }]}>• {tip}</Text>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style="light" />

            {/* Header */}
            <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.headerTitle}>Career Advisor</Text>
                        <Text style={styles.headerSubtitle}>{currentUser?.fullName || 'Guest'}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {!result ? (
                    <View>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Profile</Text>

                        <Text style={[styles.label, { color: theme.text }]}>Top Skills</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="e.g. Python, Communication, SQL"
                            placeholderTextColor={theme.textSecondary}
                            value={skills}
                            onChangeText={setSkills}
                        />

                        <Text style={[styles.label, { color: theme.text }]}>Interests</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="e.g. AI, Music, Finance"
                            placeholderTextColor={theme.textSecondary}
                            value={interests}
                            onChangeText={setInterests}
                        />

                        <Text style={[styles.label, { color: theme.text }]}>Academics / Education</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="e.g. B.Tech CS, final year"
                            placeholderTextColor={theme.textSecondary}
                            value={academics}
                            onChangeText={setAcademics}
                        />

                        <TouchableOpacity
                            style={[styles.analyzeButton, { opacity: loading ? 0.7 : 1 }]}
                            onPress={handleAnalyze}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.analyzeButtonText}>Analyze Career Path</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : renderResult()}

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedPath?.role}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>Why this role?</Text>
                            <Text style={[styles.modalText, { color: theme.text }]}>{selectedPath?.reason}</Text>

                            <Text style={[styles.modalSectionTitle, { color: theme.primary }]}>Salary Potential</Text>
                            <Text style={[styles.modalText, { color: theme.text }]}>{selectedPath?.salary_range || "Competitive Market Rates"}</Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    content: { padding: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    resultHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
    input: { padding: 14, borderRadius: 12, fontSize: 16, borderWidth: 1 },
    analyzeButton: {
        backgroundColor: '#0ea5e9',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    analyzeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    placeholder: { alignItems: 'center', justifyContent: 'center', padding: 40, opacity: 0.6 },
    placeholderText: { textAlign: 'center', marginTop: 12, lineHeight: 20 },

    // Result Styles
    recommendationCard: { width: width * 0.7, padding: 20, borderRadius: 20, borderWidth: 1, marginRight: 16 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    roleTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    matchScore: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    roleReason: { fontSize: 13, lineHeight: 18 },
    roadmapCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
    roadmapStep: { flexDirection: 'row', marginBottom: 0 },
    stepIndicator: { alignItems: 'center', width: 30, marginRight: 12 },
    stepCircle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    stepNumber: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    stepLine: { width: 2, flex: 1, marginVertical: 4 },
    stepContent: { flex: 1, paddingBottom: 24 },
    stepTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    stepDesc: { fontSize: 13, lineHeight: 18 },
    halfCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1 },
    halfCardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    listItem: { fontSize: 12, marginBottom: 4, lineHeight: 16 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    modalSectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#0ea5e9' },
    modalText: { fontSize: 16, lineHeight: 24, color: '#333' }
});
