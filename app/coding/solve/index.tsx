import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { API_URL } from '../../../constants/Api';

const { width } = Dimensions.get('window');

export default function SolveScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme } = useTheme();

    const [problem, setProblem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Description');
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (id) fetchProblem();
    }, [id]);

    const fetchProblem = async () => {
        try {
            const res = await fetch(`${API_URL}/coding-problems/${id}`);
            const data = await res.json();
            if (res.ok) {
                setProblem(data.problem);
                // Set initial code
                if (data.problem.starter_code && data.problem.starter_code['python']) {
                    setCode(data.problem.starter_code['python']);
                } else {
                    setCode('# Write your code here');
                }
            } else {
                Alert.alert('Error', 'Problem not found');
                router.back();
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Network request failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        if (problem && problem.starter_code && problem.starter_code[lang]) {
            setCode(problem.starter_code[lang]);
        } else {
            setCode('// Language not supported in starter code');
        }
    };

    const handleRun = async () => {
        if (!code.trim()) return;
        setIsRunning(true);

        try {
            const res = await fetch(`${API_URL}/coding-problems/${id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language })
            });
            const data = await res.json();

            if (res.ok) {
                let message = `Score: ${data.score}%\npassed: ${data.passed}/${data.total}`;
                if (data.results && data.results.length > 0) {
                    const firstFail = data.results.find((r: any) => r.status !== 'Passed');
                    if (firstFail) {
                        message += `\n\nFailed on Input: ${firstFail.input}\nExpected: ${firstFail.expected}\nGot: ${firstFail.output}`;
                    }
                }
                Alert.alert('Execution Result', message);
            } else {
                Alert.alert('Error', data.error || 'Execution failed');
            }
        } catch (e) {
            Alert.alert('Error', 'Could not run code');
        } finally {
            setIsRunning(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 50,
            paddingHorizontal: 16,
            paddingBottom: 16,
            backgroundColor: theme.card,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.text,
            flex: 1,
            textAlign: 'center',
            marginRight: 24,
        },
        tabs: {
            flexDirection: 'row',
            backgroundColor: theme.card,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        tab: {
            paddingVertical: 12,
            marginRight: 24,
        },
        activeTab: {
            borderBottomWidth: 2,
            borderBottomColor: theme.primary,
        },
        tabText: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.textSecondary,
        },
        activeTabText: {
            color: theme.primary,
        },
        content: {
            flex: 1,
        },
        scrollContent: {
            padding: 20,
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 8,
        },
        tagsRow: {
            flexDirection: 'row',
            gap: 8,
            marginBottom: 16,
        },
        tag: {
            fontSize: 12,
            color: theme.textSecondary,
            backgroundColor: theme.input,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
            marginTop: 16,
            marginBottom: 8,
        },
        description: {
            fontSize: 15,
            color: theme.text,
            lineHeight: 24,
        },
        codeBlock: {
            backgroundColor: theme.input,
            padding: 12,
            borderRadius: 8,
            marginVertical: 4,
        },
        codeText: {
            fontFamily: 'monospace',
            color: theme.text,
        },
        editorContainer: {
            flex: 1,
            padding: 16,
        },
        langSelector: {
            flexDirection: 'row',
            marginBottom: 12,
            gap: 8,
        },
        langChip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
        },
        activeLangChip: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        langText: {
            fontSize: 12,
            color: theme.text,
        },
        activeLangText: {
            color: '#fff',
            fontWeight: 'bold',
        },
        editor: {
            flex: 1,
            backgroundColor: '#1e1e1e',
            borderRadius: 12,
            padding: 16,
            color: '#d4d4d4',
            fontFamily: 'monospace',
            fontSize: 14,
            textAlignVertical: 'top',
        },
        bottomBar: {
            padding: 16,
            backgroundColor: theme.card,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            flexDirection: 'row',
            gap: 12,
        },
        runBtn: {
            flex: 1,
            backgroundColor: theme.input,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
        },
        runBtnText: {
            color: theme.text,
            fontWeight: 'bold',
        },
        submitBtn: {
            flex: 2,
            backgroundColor: '#22c55e',
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
        },
        submitBtnText: {
            color: '#fff',
            fontWeight: 'bold',
        },
        aiInfoBox: {
            flexDirection: 'row',
            backgroundColor: '#8b5cf6' + '20',
            padding: 12,
            borderRadius: 12,
            marginBottom: 20,
            alignItems: 'center',
            gap: 12,
            borderWidth: 1,
            borderColor: '#8b5cf6' + '40',
        },
        aiInfoText: {
            flex: 1,
            fontSize: 13,
            color: theme.text,
            lineHeight: 18,
        }
    });

    if (loading || !problem) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Problem #{problem.id}</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, activeTab === 'Description' && styles.activeTab]} onPress={() => setActiveTab('Description')}>
                    <Text style={[styles.tabText, activeTab === 'Description' && styles.activeTabText]}>Description</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'Solution' && styles.activeTab]} onPress={() => setActiveTab('Solution')}>
                    <Text style={[styles.tabText, activeTab === 'Solution' && styles.activeTabText]}>Solution / Code</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'Description' ? (
                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.aiInfoBox}>
                        <Ionicons name="sparkles" size={20} color="#8b5cf6" />
                        <Text style={styles.aiInfoText}>
                            <Text style={{ fontWeight: 'bold' }}>AI-Powered Judge:</Text> Write your solution in the editor.
                            Our AI will analyze your logic, check edge cases, and give you a real-time score!
                        </Text>
                    </View>

                    <Text style={styles.title}>{problem.title}</Text>
                    <View style={styles.tagsRow}>
                        {Array.isArray(problem.tags) ? problem.tags.map((t: string) => <Text key={t} style={styles.tag}>{t}</Text>) : null}
                    </View>

                    <Text style={styles.description}>{problem.description}</Text>

                    {problem.input_format && (
                        <>
                            <Text style={styles.sectionTitle}>Input Format</Text>
                            <Text style={styles.description}>{problem.input_format}</Text>
                        </>
                    )}

                    {problem.output_format && (
                        <>
                            <Text style={styles.sectionTitle}>Output Format</Text>
                            <Text style={styles.description}>{problem.output_format}</Text>
                        </>
                    )}

                    {problem.constraints && (
                        <>
                            <Text style={styles.sectionTitle}>Constraints</Text>
                            <Text style={[styles.description, { fontFamily: 'monospace' }]}>{problem.constraints}</Text>
                        </>
                    )}

                    <Text style={styles.sectionTitle}>Example</Text>
                    <View style={styles.codeBlock}>
                        <Text style={[styles.codeText, { fontWeight: 'bold' }]}>Input:</Text>
                        <Text style={styles.codeText}>{problem.example_input}</Text>
                        <Text style={[styles.codeText, { fontWeight: 'bold', marginTop: 8 }]}>Output:</Text>
                        <Text style={styles.codeText}>{problem.example_output}</Text>
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.editorContainer}>
                    <View style={styles.langSelector}>
                        {['python', 'javascript', 'c'].map(l => (
                            <TouchableOpacity key={l} style={[styles.langChip, language === l && styles.activeLangChip]} onPress={() => handleLanguageChange(l)}>
                                <Text style={[styles.langText, language === l && styles.activeLangText]}>{l.toUpperCase()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TextInput
                        style={styles.editor}
                        multiline
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="none"
                        autoCorrect={false}
                        textAlignVertical="top"
                    />
                </View>
            )}

            {activeTab === 'Solution' && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.runBtn} onPress={handleRun} disabled={isRunning}>
                        <Text style={styles.runBtnText}>{isRunning ? 'Running...' : 'Run / Check'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleRun} disabled={isRunning}>
                        <Text style={styles.submitBtnText}>Submit</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
