import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { API_URL } from '../../constants/Api';
import { useTheme } from '../../context/ThemeContext'; // Import Theme Context

export default function QuizListScreen() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [userFiles, setUserFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // 1. Fetch User Data
            const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
            const token = await AsyncStorage.getItem('userToken');
            let userId = null;
            if (token) {
                userId = JSON.parse(token).id;
            }

            // 2. Fetch Manual Quizzes
            const quizRes = await fetch(`${API_URL}/quizzes`);
            const quizData = await quizRes.json();

            // 3. Fetch User Files (if logged in)
            let filesData = { files: [] };
            if (userId) {
                const fileRes = await fetch(`${API_URL}/users/${userId}/files`);
                filesData = await fileRes.json();
            }

            if (quizRes.ok) setQuizzes(quizData.quizzes || []);
            if (filesData.files) setUserFiles(filesData.files);

        } catch (error: any) {
            console.error(error);
            let displayMessage = error.message;
            if (error.message.includes('Network request failed')) {
                displayMessage = `Could not reach ${API_URL}.\n\nCheck:\n1. Server running?\n2. Same WiFi?\n3. Correct IP?`;
            }
            Alert.alert('Network Error', displayMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleQuizPress = (id: number | string, title: string, isFile = false) => {
        router.push({
            pathname: '/quiz/[id]',
            params: { id, title, isFile: isFile ? 'true' : 'false' }
        });
    };

    // Filter Logic
    // Combine Quizzes and Files
    const allItems = [
        ...quizzes.map(q => ({ ...q, type: 'quiz' })),
        ...userFiles.map(f => ({
            id: f.id,
            title: f.original_name, // Use file name as title
            description: 'Generated from your upload',
            subject: f.subject || 'Uploads',
            difficulty_level: 'medium',
            course: 'Self Study',
            type: 'file'
        }))
    ];

    const uniqueSubjects = Array.from(new Set(allItems.map(q => q.subject).filter(Boolean)));
    const filteredItems = allItems.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (q.topic_name && q.topic_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesSubject = selectedSubject ? q.subject === selectedSubject : true;
        return matchesSearch && matchesSubject;
    });

    // ... inside QuizListScreen ...
    const { theme } = useTheme(); // Use Theme

    // ... existing logic ...

    const getDifficultyColor = (level: string) => {
        switch (level) {
            case 'easy': return '#22c55e';
            case 'medium': return '#eab308';
            case 'hard': return '#ef4444';
            default: return theme.primary;
        }
    };

    const styles = StyleSheet.create({
        mainContainer: { flex: 1, backgroundColor: theme.background },
        background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
        header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
        backButton: { marginRight: 15, padding: 8, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
        title: { fontSize: 24, fontWeight: 'bold', color: theme.text },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        scrollContainer: { padding: 20 },
        emptyState: { alignItems: 'center', marginTop: 50 },
        emptyText: { color: theme.textSecondary, fontSize: 16 },
        card: { backgroundColor: theme.card, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
        cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
        cardTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, flex: 1, marginRight: 10 },
        badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
        badgeText: { color: '#000', fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
        description: { color: theme.textSecondary, fontSize: 14, marginBottom: 12 },
        metaRow: { flexDirection: 'row', gap: 16 },
        metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        metaText: { color: theme.textSecondary, fontSize: 12 },
        // Filter Styles
        searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.input, marginHorizontal: 20, marginBottom: 15, paddingHorizontal: 15, borderRadius: 12, height: 50, borderWidth: 1, borderColor: theme.border },
        searchInput: { flex: 1, color: theme.text, fontSize: 16 },
        chipContainer: { paddingHorizontal: 20, marginBottom: 20, gap: 10 },
        chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
        chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
        chipText: { color: theme.textSecondary, fontWeight: '600' },
        chipTextActive: { color: theme.type === 'dark' ? '#000' : '#fff' }
    });

    return (
        <View style={styles.mainContainer}>
            <StatusBar style={theme.statusBar} />
            <LinearGradient
                colors={theme.gradient as any}
                style={styles.background}
            />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Available Quizzes</Text>
            </View>

            {/* Filter Section */}
            <View>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Search specific topic or file..."
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                    />
                </View>

                {/* Subject Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                    <TouchableOpacity
                        style={[styles.chip, !selectedSubject && styles.chipActive]}
                        onPress={() => setSelectedSubject(null)}
                    >
                        <Text style={[styles.chipText, !selectedSubject && styles.chipTextActive]}>All</Text>
                    </TouchableOpacity>
                    {uniqueSubjects.map((subject, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.chip, selectedSubject === subject && styles.chipActive]}
                            onPress={() => setSelectedSubject(subject === selectedSubject ? null : subject)}
                        >
                            <Text style={[styles.chipText, selectedSubject === subject && styles.chipTextActive]}>{subject}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {filteredItems.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No quizzes or files found.</Text>
                        </View>
                    ) : (
                        filteredItems.map((item, index) => (
                            <TouchableOpacity key={`${item.type}-${item.id}`} style={styles.card} onPress={() => handleQuizPress(item.id, item.title, item.type === 'file')}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Ionicons
                                            name={item.type === 'file' ? "document-text" : "help-circle"}
                                            size={20}
                                            color={item.type === 'file' ? theme.primary : "#a855f7"}
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: getDifficultyColor(item.difficulty_level) }]}>
                                        <Text style={styles.badgeText}>{item.difficulty_level}</Text>
                                    </View>
                                </View>
                                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="book-outline" size={16} color={theme.textSecondary} />
                                        <Text style={styles.metaText}>{item.course}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="layers-outline" size={16} color={theme.textSecondary} />
                                        <Text style={styles.metaText}>{item.subject}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}
