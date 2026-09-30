
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Animated, ActivityIndicator, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import YoutubePlayer from "react-native-youtube-iframe";
import { API_URL } from '../constants/Api';
import AudioPlayer from '../components/AudioPlayer';

const { width } = Dimensions.get('window');

interface MicroLesson {
    id: number;
    lesson_order: number;
    title: string;
    content_points: string[];
    duration_seconds: number;
    audio_url?: string;
}


import { useLanguage } from '../components/LanguageContext';

interface LessonCardProps {
    lesson: any;
}

const LessonCard = ({ lesson }: LessonCardProps) => {





    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.lessonBadge}>
                    <Text style={styles.lessonBadgeText}>LESSON {lesson.lesson_order}</Text>
                </View>



                {/* <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={14} color="#cbd5e1" />
                    <Text style={styles.timeText}>{Math.ceil((lesson.duration_seconds || 120) / 60)} min</Text>
                </View> */}
            </View>



            <Text style={styles.cardTitle}>{lesson.title}</Text>

            {lesson.audio_url && (
                <AudioPlayer
                    audioUrl={lesson.audio_url}
                    title="Audio Summary"
                    duration={lesson.duration_seconds || 60}
                />
            )}

            <View style={styles.divider} />

            <View style={styles.pointsContainer}>
                {Array.isArray(lesson.content_points) && lesson.content_points.map((point: string, i: number) => (
                    <View key={i} style={styles.pointRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.pointText}>{point}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default function SummaryScreen() {
    const router = useRouter();
    const { language } = useLanguage(); // Use Global Language
    const params = useLocalSearchParams();
    const { fileId, fileName, title, videoUrl, fileUrl } = params;

    const [lessons, setLessons] = useState<MicroLesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    // Explicitly track the active language for this screen, defaulting to global
    // We can still allow local override if we want, but user asked for profile setting to rule.
    // However, the "Language Button" in the header implies local toggle. 
    // Let's sync local state with global on mount, but allow toggle.
    // Actually, simpler: Use global lang as default, allow simple toggle to update global or just local.
    // If "entire app", let's make the toggle update the GLOBAL language? 
    // Or just make this screen React to global.
    const [selectedLanguage, setSelectedLanguage] = useState<string>(language);

    // Update local state if global changes (e.g. came from profile)
    useEffect(() => {
        setSelectedLanguage(language);
    }, [language]);

    // State for cloud file URL (fallback if params missing)
    const [cloudFileUrl, setCloudFileUrl] = useState<string | null>(
        Array.isArray(fileUrl) ? fileUrl[0] : fileUrl
    );

    // Extract Video ID
    const [videoIdState, setVideoIdState] = useState<string | null>(null);

    useEffect(() => {
        const urlString = Array.isArray(videoUrl) ? videoUrl[0] : videoUrl;
        if (urlString) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = urlString.match(regExp);
            if (match && match[2].length === 11) {
                setVideoIdState(match[2]);
            }
        }
    }, [videoUrl]);

    const onStateChange = useCallback((state: string) => {
        if (state === "ended") {
            setPlaying(false);
        }
    }, []);

    // Track properties for vertical scroll
    const lessonYCoords = useRef<{ [key: number]: number }>({});
    const scrollY = useRef(new Animated.Value(0)).current;

    // Ref for the ScrollView to programmatically scroll
    const scrollViewRef = useRef<ScrollView>(null);

    // 1. Get User ID
    useEffect(() => {
        const getUser = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    const user = JSON.parse(token);
                    setUserId(user.id);
                }
            } catch (e) {
                console.error("Failed to get user:", e);
            }
        };
        getUser();
    }, []);

    // 2. Fetch Lessons
    useEffect(() => {
        fetchLessons();
    }, [fileId, selectedLanguage]);

    // 3. Fetch Progress (Resume) - Once lessons and user are ready
    useEffect(() => {
        if (userId && lessons.length > 0) {
            // Give a moment for layouts to render before checking progress resume location
            setTimeout(() => fetchProgress(), 1000);
        }
    }, [userId, lessons]);

    const showLanguageOptions = () => {
        Alert.alert("Select Language", "Choose a language strictly for the summary content:", [
            { text: "English (Original)", onPress: () => setSelectedLanguage('en') },
            { text: "Simple English", onPress: () => setSelectedLanguage('simple') },
            { text: "Tamil", onPress: () => setSelectedLanguage('ta') },
            { text: "Cancel", style: "cancel" }
        ]);
    };

    const fetchProgress = async () => {
        try {
            const response = await fetch(`${API_URL}/files/${fileId}/progress?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                const savedIndex = data.index || 0;

                // Only prompt if we have a saved index that matters
                if (savedIndex > 0 && savedIndex < lessons.length) {
                    Alert.alert(
                        "Welcome Back",
                        `Resume from Lesson ${savedIndex + 1}?`,
                        [
                            {
                                text: "Start Over",
                                onPress: () => {
                                    setCurrentIndex(0);
                                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                                    saveProgress(0);
                                },
                                style: "cancel"
                            },
                            {
                                text: "Resume",
                                onPress: () => {
                                    setCurrentIndex(savedIndex);
                                    const y = lessonYCoords.current[savedIndex] || 0;
                                    scrollViewRef.current?.scrollTo({ y: y, animated: true });
                                }
                            }
                        ]
                    );
                }
            }
        } catch (error) {
            console.error("Failed to fetch progress:", error);
        }
    };

    const saveProgress = async (index: number) => {
        if (!userId) return;
        try {
            await fetch(`${API_URL}/files/${fileId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, index })
            });
        } catch (error) {
            console.error("Failed to save progress:", error);
        }
    };

    const fetchLessons = async () => {
        if (!fileId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log(`Fetching lessons for fileId: ${fileId}, Lang: ${selectedLanguage}`);

            const endpoint = selectedLanguage === 'en'
                ? `${API_URL}/files/${fileId}/lessons`
                : `${API_URL}/files/${fileId}/lessons/translate?lang=${selectedLanguage}`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (response.ok && data.lessons) {
                setLessons(data.lessons);
                if (data.file) {
                    const backendUrl = data.file.secure_url || data.file.file_url;
                    if (backendUrl) {
                        setCloudFileUrl(backendUrl);
                    }
                }
                // Update persistent video URL if available
                if (data.relatedVideo) {
                    // Update the videoId state if a new persistent video is found
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                    const match = data.relatedVideo.match(regExp);
                    if (match && match[2].length === 11) {
                        setVideoIdState(match[2]);
                    }
                }
            } else {
                Alert.alert('Error', 'Failed to load lessons');
            }
        } catch (error: any) {
            console.error('Fetch error:', error);
            let displayMessage = `Could not connect to server.\nError: ${error.message}`;
            if (error.message.includes('Network request failed')) {
                displayMessage = `Network Error: Could not reach ${API_URL}.\n\nCheck:\n1. Server running?\n2. Same WiFi?\n3. Correct IP?`;
            }
            Alert.alert('Connection Error', displayMessage);
        } finally {
            setLoading(false);
        }
    };

    // Helper to find visible index based on Scroll Y
    const handleScroll = (event: any) => {
        const currentY = event.nativeEvent.contentOffset.y;

        // Simple logic: Find the last lesson whose Y is <= currentY + offset
        // We add a small buffer (e.g. 100px) so the lesson counts as "read" when it enters well into view
        let foundIndex = 0;
        const coords = lessonYCoords.current;

        for (let i = 0; i < lessons.length; i++) {
            if (coords[i] <= currentY + 150) {
                foundIndex = i;
            } else {
                break;
            }
        }

        if (foundIndex !== currentIndex) {
            setCurrentIndex(foundIndex);
            saveProgress(foundIndex);
        }
    };

    const scrollToNext = () => {
        if (currentIndex < lessons.length - 1) {
            const nextIndex = currentIndex + 1;
            const y = lessonYCoords.current[nextIndex] || 0;
            scrollViewRef.current?.scrollTo({ y: y, animated: true });
            setCurrentIndex(nextIndex);
            saveProgress(nextIndex);
        } else {
            saveProgress(lessons.length - 1);
            Alert.alert("Completed", "You've finished this summary!", [
                { text: "Done", onPress: () => router.back() }
            ]);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Summary",
            "Are you sure you want to delete this file and all its lessons?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const response = await fetch(`${API_URL}/files/${fileId}`, {
                                method: 'DELETE',
                            });

                            if (response.ok) {
                                Alert.alert("Deleted", "File removed successfully", [
                                    { text: "OK", onPress: () => router.back() }
                                ]);
                            } else {
                                Alert.alert("Error", "Failed to delete file");
                                setLoading(false);
                            }
                        } catch (error: any) {
                            console.error("Delete error:", error);
                            let displayMessage = `Could not connect to server. ${error.message}`;
                            if (error.message.includes('Network request failed')) {
                                displayMessage = `Network Error: Could not reach ${API_URL}.\n\nCheck:\n1. Server running?\n2. Same WiFi?\n3. Correct IP?`;
                            }
                            Alert.alert("Connection Error", displayMessage);
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.mainContainer}>
            <StatusBar style="light" />

            {/* Background Gradient - Dark Theme */}
            <LinearGradient
                colors={['#020617', '#0f172a', '#1e293b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#f8fafc" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{title || fileName || 'Lesson Viewer'}</Text>
                    <Text style={styles.headerSubtitle}>Topic Summary</Text>
                </View>

                {/* Language Button */}
                <TouchableOpacity
                    style={[styles.menuButton, { marginRight: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
                    onPress={showLanguageOptions}
                >
                    <Ionicons name="language" size={24} color="#10b981" />
                </TouchableOpacity>

                {/* View Original File Button */}
                {cloudFileUrl && (
                    <TouchableOpacity
                        style={[styles.menuButton, { marginRight: 8, backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}
                        onPress={() => {
                            if (cloudFileUrl) Linking.openURL(cloudFileUrl);
                            else Alert.alert("Error", "No file URL found");
                        }}
                    >
                        <Ionicons name="eye-outline" size={24} color="#38bdf8" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.menuButton} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            {/* Static Action Bar (Finish Button) */}
            <View style={styles.staticActionContainer}>
                <TouchableOpacity
                    style={styles.staticFinishButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.staticFinishText}>Finish Reading</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#020617" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#38bdf8" />
                    <Text style={styles.loadingText}>Loading Lessons...</Text>
                </View>
            ) : lessons.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#334155" />
                    <Text style={styles.emptyText}>No lessons found.</Text>
                </View>
            ) : (
                <>
                    {/* Progress Section (Simplified for Vertical) */}
                    {videoIdState && (
                        <View style={styles.videoHeaderContainer}>
                            <YoutubePlayer
                                height={200}
                                play={playing}
                                videoId={videoIdState}
                                onChangeState={onStateChange}
                            />
                        </View>
                    )}

                    {!videoIdState && (
                        <View style={styles.progressContainer}>
                            <Text style={styles.progressText}>
                                {lessons.length} Micro-Lessons
                            </Text>
                            <View style={styles.divider} />
                        </View>
                    )}

                    {/* Vertical List */}
                    <ScrollView
                        ref={scrollViewRef as any}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        style={{ flex: 1 }}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {lessons.map((lesson, index) => {
                            // Local audio state for this mapped item? No, hooks inside loop is bad.
                            // We need a sub-component or manage it at parent.
                            // Let's create a sub-component for the card to handle its own audio state.
                            return (
                                <View
                                    key={lesson.id}
                                    style={{ width: '100%', paddingHorizontal: 20, marginBottom: 10 }}
                                    onLayout={(event) => {
                                        const layout = event.nativeEvent.layout;
                                        lessonYCoords.current[index] = layout.y;
                                    }}
                                >
                                    <LessonCard lesson={lesson} />
                                </View>
                            );
                        })}

                        <View style={{ height: 40 }} />
                        {/* Bottom padding only, button moved to top */}
                    </ScrollView>
                </>
            )
            }
        </View >
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#020617',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        color: '#f8fafc',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 2,
    },
    menuButton: {
        padding: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#cbd5e1',
        marginTop: 12,
        fontSize: 16,
    },
    emptyText: {
        color: '#64748b',
        marginTop: 12,
        fontSize: 16,
    },
    videoHeaderContainer: {
        width: '100%',
        height: 200,
        marginBottom: 20,
    },
    progressContainer: {
        paddingHorizontal: 24,
        marginBottom: 20,
        alignItems: 'center',
    },
    progressText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    progressBarBackground: {
        width: '100%',
        height: 6,
        backgroundColor: '#1e293b',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#38bdf8',
        borderRadius: 3,
    },
    scrollContent: {
        alignItems: 'center',
        paddingTop: 10,
    },
    // cardScrollContent removed
    card: {
        flex: 1,
        backgroundColor: '#111827',
        borderRadius: 24, // Slightly smaller radius for list look
        padding: 24,      // Standard padding
        borderWidth: 1,
        borderColor: '#1e293b',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 }, // Smaller shadow
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
        // marginBottom handled by parent View
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    lessonBadge: {
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    lessonBadgeText: {
        color: '#38bdf8',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 22, // Slightly smaller for list view readability
        fontWeight: '800',
        color: '#f8fafc',
        marginBottom: 16,
        lineHeight: 28,
    },
    divider: {
        height: 1,
        backgroundColor: '#1e293b',
        marginBottom: 16,
    },
    // cardScroll removed
    pointsContainer: {
        paddingRight: 8,
    },
    pointRow: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    bulletDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#38bdf8',
        marginTop: 9,
        marginRight: 16,
    },
    pointText: {
        flex: 1,
        fontSize: 18,
        color: '#e2e8f0',
        lineHeight: 28,
        fontWeight: '500',
    },
    nextButton: {
        backgroundColor: '#38bdf8',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: "#38bdf8",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    nextButtonText: {
        color: '#020617',
        fontSize: 18,
        fontWeight: '700',
    },
    staticActionContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        zIndex: 5,
    },
    staticFinishButton: {
        backgroundColor: 'rgba(56, 189, 248, 0.9)',
        borderRadius: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    staticFinishText: {
        color: '#020617',
        fontSize: 16,
        fontWeight: '700',
    },
    audioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
        marginLeft: 8,
    },
    audioButtonActive: {
        backgroundColor: 'rgba(56, 189, 248, 0.3)',
        borderColor: '#38bdf8',
    },
    audioButtonText: {
        color: '#38bdf8',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
});
