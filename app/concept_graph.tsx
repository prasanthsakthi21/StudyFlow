import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, Modal, ActivityIndicator, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

interface ConceptNode {
    id: string;
    label: string;
    x: number;
    y: number;
    req: string[];
    category: string;
    level?: string;
    doc?: string;
    video?: string;
    image?: string;
    questions?: any;
}

interface NodeWithStatus extends ConceptNode {
    status: 'locked' | 'unlocked' | 'completed';
}

interface LineProps {
    start: ConceptNode;
    end: ConceptNode;
    status: 'locked' | 'unlocked' | 'completed';
    theme: any;
}

// Line logic for visual connection
const SimpleLine = ({ start, end, status, theme }: LineProps) => {
    const x1 = start.x + 50; // Center adjustment based on node width (100)
    const y1 = start.y + 30; // Center adjustment based on node height (60)
    const x2 = end.x + 50;
    const y2 = end.y + 30;

    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Midpoint
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const color = status === 'completed' ? '#22c55e' : (status === 'unlocked' ? (theme?.primary || '#3b82f6') : '#475569');

    return (
        <View
            style={{
                position: 'absolute',
                left: midX - length / 2,
                top: midY - 1,
                width: length,
                height: 2,
                backgroundColor: color,
                transform: [{ rotate: `${angle}rad` }],
                zIndex: -1,
            }}
        />
    );
};


export default function ConceptGraphScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [nodes, setNodes] = useState<ConceptNode[]>([]);
    const [completed, setCompleted] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<NodeWithStatus | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentSubject, setCurrentSubject] = useState('DS');
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Quiz State
    const [quizVisible, setQuizVisible] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    const subjects = [
        { id: 'DS', label: 'Data Structures', icon: 'code-slash' },
        { id: 'Frontend', label: 'Frontend Dev', icon: 'logo-react' },
        { id: 'System Design', label: 'System Design', icon: 'server-outline' }
    ];

    useEffect(() => {
        loadData();
    }, [currentSubject]); // Reload when subject changes

    const loadData = async () => {
        try {
            setLoading(true);
            const userStr = await AsyncStorage.getItem('userToken');
            let userId = '1';
            let currentUser = null;
            if (userStr) {
                currentUser = JSON.parse(userStr);
                userId = currentUser.id;
                setUser(currentUser);
            }

            // 1. Fetch Roadmap Data (New API)
            const graphRes = await fetch(`${API_URL}/roadmap/${currentSubject}`);
            const graphData = await graphRes.json();

            if (graphData.topics) {
                // Transform to Node structure
                const mappedNodes = graphData.topics.map((t: any) => {
                    const reqs = graphData.dependencies
                        ? Array.from(new Set(
                            graphData.dependencies
                                .filter((d: any) => d.topic_id === t.id)
                                .map((d: any) => String(d.prerequisite_id))
                        ))
                        : [];

                    return {
                        ...t,
                        id: String(t.id),
                        label: t.topic_name || t.label,
                        req: reqs,
                        difficulty_score: t.difficulty_score,
                        estimated_time: t.estimated_time
                    };
                });
                setNodes(mappedNodes);
            } else {
                setNodes([]);
            }

            // 2. Fetch User Progress (New API)
            const progressRes = await fetch(`${API_URL}/roadmap/progress/${userId}`);
            const progressData = await progressRes.json();

            if (progressData.progress) {
                // Filter for 'completed' status
                const completedIds = progressData.progress
                    .filter((p: any) => p.status === 'completed')
                    .map((p: any) => String(p.topic_id));
                setCompleted(completedIds);
            }

        } catch (error) {
            console.error("Failed to load graph data:", error);
            Alert.alert("Connection Error", "Could not load the learning graph.");
        } finally {
            setLoading(false);
        }
    };

    // Determine status of a node
    const getNodeStatus = (nodeId: string, reqs: string[]): 'locked' | 'unlocked' | 'completed' => {
        if (completed.includes(String(nodeId))) return 'completed';
        // Check if all reqs are met
        const canUnlock = reqs.every(r => completed.includes(String(r)));
        return canUnlock ? 'unlocked' : 'locked';
    };

    const handleNodePress = (node: ConceptNode) => {
        const status = getNodeStatus(node.id, node.req);
        // Ensure resources are parsed if string
        let parsedResources = [];
        if ((node as any).resources) {
            try {
                parsedResources = typeof (node as any).resources === 'string'
                    ? JSON.parse((node as any).resources)
                    : (node as any).resources;
            } catch (e) {
                console.log('Error parsing resources');
            }
        }

        // Ensure questions are parsed if string
        let parsedQuestions = [];
        if ((node as any).questions) {
            try {
                parsedQuestions = typeof (node as any).questions === 'string'
                    ? JSON.parse((node as any).questions)
                    : (node as any).questions;
            } catch (e) {
                console.log('Error parsing questions');
            }
        }

        setSelectedNode({ ...node, status, resources: parsedResources, questions: parsedQuestions } as any);
        setModalVisible(true);
        // Reset Quiz
        setQuizVisible(false);
        setQuizFinished(false);
        setCurrentQuestionIndex(0);
        setQuizScore(0);
    };

    const markComplete = async () => {
        if (!selectedNode || completed.includes(String(selectedNode.id))) return;

        try {
            const userId = user?.id || '1';
            const response = await fetch(`${API_URL}/roadmap/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, topicId: selectedNode.id, status: 'completed' })
            });

            if (response.ok) {
                setCompleted(prev => [...prev, String(selectedNode.id)]);
                setModalVisible(false);
                Alert.alert("Topic Mastered! 🎓", `Excellent work on ${selectedNode.label}. You passed the quiz!`);
            } else {
                throw new Error("Update failed");
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not save your progress.");
        }
    };

    const handleAnswer = (optionIndex: number) => {
        if (!selectedNode || !(selectedNode as any).questions) return;

        const questions = (selectedNode as any).questions;
        const currentQ = questions[currentQuestionIndex];
        const isCorrect = optionIndex === currentQ.correct;

        const newScore = isCorrect ? quizScore + 1 : quizScore;
        setQuizScore(newScore);

        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Quiz Finished
            setQuizFinished(true);
            const passingScore = Math.ceil(questions.length * 0.5); // 50% to pass? Or 100%? User said "answer is correct now select is marked". Let's say all correct or strict.
            // User request: "ask two or three question answer is correct now select is marked"
            // Let's require 100% correctness for "Mastery" or at least high pass.
            // Let's go with > 0.
            if (newScore === questions.length) {
                markComplete();
            } else {
                Alert.alert("Quiz Failed", `You got ${newScore}/${questions.length} correct. Review the resources and try again to master this topic.`);
            }
        }
    };

    const refreshData = () => {
        loadData();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={styles.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.subjectSelector}
                    onPress={() => setShowSubjectModal(true)}
                >
                    <Text style={styles.headerTitle}>
                        {subjects.find(s => s.id === currentSubject)?.label || 'Concept Graph'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                <TouchableOpacity onPress={refreshData} style={styles.resetButton}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={{ color: theme.textSecondary, marginTop: 16 }}>Loading Learning Tree...</Text>
                </View>
            ) : nodes.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={{ color: theme.textSecondary, fontSize: 16 }}>No learning path loaded.</Text>
                    <TouchableOpacity onPress={refreshData} style={[styles.learnButton, { backgroundColor: theme.primary, marginTop: 16, paddingHorizontal: 24 }]}>
                        <Text style={styles.learnButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.graphScrollView}
                    contentContainerStyle={[styles.graphContainer, { width: Math.max(width, 600), height: 800 }]}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ height: 800, width: Math.max(width, 600) }}
                    >

                        {/* DRAW CONNECTIONS FIRST (Z-Index -1) */}
                        {nodes.map(node => {
                            return node.req.map(reqId => {
                                const startNode = nodes.find(n => n.id === reqId);
                                if (!startNode) return null;

                                // Line status logic
                                const isSourceDone = completed.includes(String(startNode.id));
                                const isTargetDone = completed.includes(String(node.id));
                                let lineStatus: 'locked' | 'unlocked' | 'completed' = 'locked';
                                if (isSourceDone) lineStatus = 'unlocked';
                                if (isTargetDone) lineStatus = 'completed';

                                return (
                                    <SimpleLine
                                        key={`line-${reqId}-${node.id}`}
                                        start={startNode}
                                        end={node}
                                        status={lineStatus}
                                        theme={theme}
                                    />
                                );
                            });
                        })}

                        {/* DRAW NODES */}
                        {nodes.map(node => {
                            const status = getNodeStatus(node.id, node.req);
                            const isLocked = status === 'locked';
                            const isCompleted = status === 'completed';

                            return (
                                <TouchableOpacity
                                    key={node.id}
                                    style={[
                                        styles.node,
                                        {
                                            left: node.x,
                                            top: node.y,
                                            backgroundColor: isCompleted ? '#22c55e' : (isLocked ? '#334155' : (theme?.primary || '#3b82f6')),
                                            borderColor: isCompleted ? '#86efac' : (isLocked ? '#475569' : '#bae6fd'),
                                            opacity: isLocked ? 0.8 : 1
                                        }
                                    ]}
                                    onPress={() => handleNodePress(node)}
                                    activeOpacity={0.8}
                                >
                                    {isCompleted && <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginBottom: 4 }} />}
                                    {isLocked && <Ionicons name="lock-closed" size={16} color="#94a3b8" style={{ marginBottom: 4 }} />}
                                    <Text style={[styles.nodeLabel, { color: isLocked ? '#94a3b8' : '#fff' }]}>
                                        {node.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                    </ScrollView>
                </ScrollView>
            )}

            {/* INFO MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        {selectedNode && (
                            <>
                                <View style={styles.modalHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        {selectedNode.image && (
                                            <Image
                                                source={{ uri: selectedNode.image }}
                                                style={{ width: 50, height: 50, borderRadius: 10, backgroundColor: 'white' }}
                                                resizeMode="contain"
                                            />
                                        )}
                                        <View>
                                            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedNode.label}</Text>
                                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                                <Text style={styles.modalCategory}>{selectedNode.category || 'Topic'}</Text>
                                                {selectedNode.level && (
                                                    <Text style={[styles.modalCategory, { color: theme.primary }]}>• {selectedNode.level}</Text>
                                                )}
                                                {(selectedNode as any).estimated_time && (
                                                    <Text style={[styles.modalCategory, { color: '#fbbf24' }]}>• ⏱ {(selectedNode as any).estimated_time}</Text>
                                                )}
                                                {(selectedNode as any).difficulty_score && (
                                                    <Text style={[styles.modalCategory, { color: '#ef4444' }]}>• 🔥 Lv.{(selectedNode as any).difficulty_score}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Ionicons name="close" size={24} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalBody}>
                                    {selectedNode.status === 'locked' ? (
                                        <View style={styles.lockedContainer}>
                                            <Ionicons name="lock-closed" size={48} color="#ef4444" />
                                            <Text style={styles.lockedText}>Prerequisites Missing</Text>
                                            <Text style={[styles.reqText, { marginBottom: 10 }]}>
                                                You must complete these topics first:
                                            </Text>
                                            {selectedNode.req.map(r => {
                                                const reqNode = nodes.find(n => n.id === r);
                                                const isReqDone = completed.includes(String(r));
                                                return (
                                                    <View key={`req-${r}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                        <Ionicons
                                                            name={isReqDone ? "checkmark-circle" : "ellipse-outline"}
                                                            size={16}
                                                            color={isReqDone ? "#22c55e" : "#94a3b8"}
                                                            style={{ marginRight: 6 }}
                                                        />
                                                        <Text style={{ color: isReqDone ? "#22c55e" : "#94a3b8" }}>{reqNode?.label || 'Unknown'}</Text>
                                                    </View>
                                                )
                                            })}
                                        </View>
                                    ) : (
                                        <View>
                                            <Text style={[styles.descText, { color: theme.textSecondary }]}>
                                                {selectedNode.status === 'completed'
                                                    ? "You have already mastered this concept. Great job!"
                                                    : "You have unlocked this topic! Ready to learn?"}
                                            </Text>

                                            {/* Resource Buttons */}
                                            <View style={{ gap: 12, marginTop: 16 }}>
                                                {/* 1. Legacy Fields (Fallback) */}
                                                {(selectedNode.video || selectedNode.doc) && !(selectedNode as any).resources && (
                                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                                        {selectedNode.video && (
                                                            <TouchableOpacity
                                                                style={[styles.resourceButton, { backgroundColor: '#ef4444' }]}
                                                                onPress={() => Linking.openURL(selectedNode.video!)}
                                                            >
                                                                <Ionicons name="logo-youtube" size={20} color="#fff" style={{ marginRight: 6 }} />
                                                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Watch</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                        {selectedNode.doc && (
                                                            <TouchableOpacity
                                                                style={[styles.resourceButton, { backgroundColor: '#3b82f6' }]}
                                                                onPress={() => Linking.openURL(selectedNode.doc!)}
                                                            >
                                                                <Ionicons name="document-text" size={20} color="#fff" style={{ marginRight: 6 }} />
                                                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Read</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                )}

                                                {/* 2. New Resources Array */}
                                                {(selectedNode as any).resources && (selectedNode as any).resources.length > 0 && (
                                                    <View>
                                                        <Text style={{ fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>Learning Resources:</Text>
                                                        {(selectedNode as any).resources.map((res: any, idx: number) => (
                                                            <TouchableOpacity
                                                                key={idx}
                                                                style={[styles.resourceButton, {
                                                                    backgroundColor: res.type === 'video' ? '#ef4444' : (res.type === 'doc' ? '#3b82f6' : '#10b981'),
                                                                    marginBottom: 8
                                                                }]}
                                                                onPress={() => Linking.openURL(res.url)}
                                                            >
                                                                <Ionicons
                                                                    name={res.type === 'video' ? "logo-youtube" : (res.type === 'doc' ? "document-text" : "link")}
                                                                    size={20}
                                                                    color="#fff"
                                                                    style={{ marginRight: 6 }}
                                                                />
                                                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{res.title}</Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>

                                            {selectedNode.status !== 'completed' && (
                                                <View>
                                                    {!quizVisible ? (
                                                        <TouchableOpacity
                                                            style={[styles.learnButton, { backgroundColor: theme.primary }]}
                                                            onPress={() => {
                                                                if ((selectedNode as any).questions && (selectedNode as any).questions.length > 0) {
                                                                    setQuizVisible(true);
                                                                } else {
                                                                    // Fallback if no questions seeded
                                                                    markComplete();
                                                                }
                                                            }}
                                                        >
                                                            <Text style={styles.learnButtonText}>
                                                                {((selectedNode as any).questions && (selectedNode as any).questions.length > 0) ? "Take Quiz to Complete" : "Mark as Completed"}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ) : (
                                                        <View style={{ marginTop: 20, backgroundColor: theme.background, padding: 16, borderRadius: 12 }}>
                                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                                                <Text style={{ fontWeight: 'bold', color: theme.text }}>Question {currentQuestionIndex + 1}</Text>
                                                                <TouchableOpacity onPress={() => setQuizVisible(false)}>
                                                                    <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                                                                </TouchableOpacity>
                                                            </View>

                                                            {(selectedNode as any).questions && (selectedNode as any).questions[currentQuestionIndex] && (
                                                                <View>
                                                                    <Text style={{ fontSize: 16, color: theme.text, marginBottom: 16 }}>
                                                                        {(selectedNode as any).questions[currentQuestionIndex].q}
                                                                    </Text>
                                                                    {(selectedNode as any).questions[currentQuestionIndex].options.map((opt: string, idx: number) => (
                                                                        <TouchableOpacity
                                                                            key={idx}
                                                                            style={{
                                                                                backgroundColor: theme.card,
                                                                                padding: 12,
                                                                                borderRadius: 8,
                                                                                marginBottom: 8,
                                                                                borderWidth: 1,
                                                                                borderColor: theme.border
                                                                            }}
                                                                            onPress={() => handleAnswer(idx)}
                                                                        >
                                                                            <Text style={{ color: theme.text }}>{opt}</Text>
                                                                        </TouchableOpacity>
                                                                    ))}
                                                                </View>
                                                            )}
                                                        </View>
                                                    )}
                                                </View>
                                            )}

                                            {selectedNode.status === 'completed' && (
                                                <TouchableOpacity
                                                    style={[styles.learnButton, { backgroundColor: '#22c55e' }]}
                                                    disabled
                                                >
                                                    <Text style={styles.learnButtonText}>Completed</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* SUBJECT SELECTION MODAL */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showSubjectModal}
                onRequestClose={() => setShowSubjectModal(false)}
            >
                <TouchableOpacity
                    style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}
                    activeOpacity={1}
                    onPress={() => setShowSubjectModal(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card, width: '80%' }]}>
                        <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 16 }]}>Select Topic</Text>
                        {subjects.map(subject => (
                            <TouchableOpacity
                                key={subject.id}
                                style={styles.subjectModalItem}
                                onPress={() => {
                                    setCurrentSubject(subject.id);
                                    setShowSubjectModal(false);
                                }}
                            >
                                <Ionicons name={subject.icon as any} size={24} color={currentSubject === subject.id ? theme.primary : theme.textSecondary} style={{ marginRight: 12 }} />
                                <Text style={{ fontSize: 16, color: currentSubject === subject.id ? theme.primary : theme.text, fontWeight: currentSubject === subject.id ? 'bold' : 'normal' }}>
                                    {subject.label}
                                </Text>
                                {currentSubject === subject.id && (
                                    <Ionicons name="checkmark" size={20} color={theme.primary} style={{ marginLeft: 'auto' }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { position: 'absolute', width: '100%', height: '100%' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        justifyContent: 'space-between',
        zIndex: 10
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    resetButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    graphScrollView: {
        flex: 1,
    },
    graphContainer: {
        minWidth: width,
        minHeight: 600,
        position: 'relative'
    },
    node: {
        position: 'absolute',
        width: 100,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 10
    },
    nodeLabel: {
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    modalCategory: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '600',
    },
    modalBody: {
        gap: 16,
    },
    lockedContainer: {
        alignItems: 'center',
        padding: 20,
        gap: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 16,
    },
    lockedText: {
        color: '#ef4444',
        fontSize: 18,
        fontWeight: 'bold',
    },
    reqText: {
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    descText: {
        fontSize: 16,
        lineHeight: 24,
    },
    learnButton: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    learnButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resourceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        flex: 1,
        justifyContent: 'center',
    },
    subjectSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    subjectModalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    }
});
