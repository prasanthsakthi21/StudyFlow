import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../constants/Api';
import { WebView } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

// Syntax Highlighting HTML Template
const getHtmlContent = (code: string, language: string, themeType: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-${themeType === 'dark' ? 'tomorrow' : 'coy'}.min.css" rel="stylesheet" />
    <style>
        body { margin: 0; padding: 0; background-color: ${themeType === 'dark' ? '#1e293b' : '#f5f5f5'}; }
        pre { margin: 0; padding: 16px; border-radius: 0; background-color: transparent !important; }
        code { font-family: 'Fira Code', monospace; font-size: 14px; }
        ::-webkit-scrollbar { display: none; }
    </style>
</head>
<body>
    <pre><code class="language-${(language || 'javascript').toLowerCase()}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-java.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-c.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
</body>
</html>
`;

export default function CodeDebuggerScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleDebug = async () => {
        if (!code.trim()) {
            Alert.alert("Input Required", "Please enter some code to analyze.");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch(`${API_URL}/debug-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
            } else {
                const errorText = await response.text();
                throw new Error(errorText || "Analysis failed");
            }
        } catch (error: any) {
            console.error("Debug Error:", error);
            Alert.alert("Error", "Failed to analyze code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert("Copied", "Code copied to clipboard!");
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
                <Text style={styles.headerTitle}>Code Error Analyzer</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Input Section */}
                <View style={styles.inputCard}>
                    <Text style={styles.label}>Paste Suspect Code:</Text>
                    <TextInput
                        style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                        multiline
                        placeholder="// Paste code here..."
                        placeholderTextColor="#94a3b8"
                        value={code}
                        onChangeText={setCode}
                        textAlignVertical="top"
                    />
                    <TouchableOpacity
                        style={[styles.analyzeButton, { backgroundColor: theme.primary }]}
                        onPress={handleDebug}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.primary} />
                        ) : (
                            <>
                                <Ionicons name="bug-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.buttonText}>Start Analysis</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Results Section */}
                {result && (
                    <View style={styles.resultsContainer}>

                        {/* 1. Error Detection */}
                        <View style={[styles.resultCard, { borderColor: result.isError ? '#ef4444' : '#22c55e' }]}>
                            <View style={styles.cardHeader}>
                                <Ionicons
                                    name={result.isError ? "warning" : "checkmark-circle"}
                                    size={24}
                                    color={result.isError ? "#ef4444" : "#22c55e"}
                                />
                                <Text style={[styles.cardTitle, { color: result.isError ? '#ef4444' : '#22c55e' }]}>
                                    {result.isError ? (result.errorType || "Error Detected") : "Code is Clean"}
                                </Text>
                            </View>
                            {result.isError && (
                                <View>
                                    <Text style={styles.errorText}>
                                        {result.error}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* 2. Fix & Explanation */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Correction & Explanation</Text>
                            <View style={styles.infoCard}>
                                <Text style={styles.infoText}>{result.explanation}</Text>
                            </View>
                        </View>

                        {/* Best Practice Tip */}
                        {result.bestPractice && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: '#8b5cf6' }]}>💡 Best Practice</Text>
                                <View style={[styles.infoCard, { borderLeftColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                                    <Text style={[styles.infoText, { color: '#ddd6fe' }]}>{result.bestPractice}</Text>
                                </View>
                            </View>
                        )}

                        {/* 3. Fixed Code View */}
                        <View style={styles.section}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.sectionTitle}>Fixed Version</Text>
                                <TouchableOpacity onPress={() => copyToClipboard(result.fixedCode)}>
                                    <Ionicons name="copy-outline" size={20} color={theme.primary} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.codeContainer}>
                                <WebView
                                    originWhitelist={['*']}
                                    source={{ html: getHtmlContent(result.fixedCode, 'javascript', 'dark') }}
                                    style={{ backgroundColor: 'transparent', height: 200 }}
                                    scrollEnabled={true}
                                />
                            </View>
                        </View>

                        {/* 4. Optimized Version (if different) */}
                        {result.improvedCode && result.improvedCode !== result.fixedCode && (
                            <View style={styles.section}>
                                <View style={styles.rowBetween}>
                                    <Text style={[styles.sectionTitle, { color: '#fbbf24' }]}>Optimized Version</Text>
                                    <TouchableOpacity onPress={() => copyToClipboard(result.improvedCode)}>
                                        <Ionicons name="copy-outline" size={20} color="#fbbf24" />
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.codeContainer, { borderColor: '#fbbf24' }]}>
                                    <WebView
                                        originWhitelist={['*']}
                                        source={{ html: getHtmlContent(result.improvedCode, 'javascript', 'dark') }}
                                        style={{ backgroundColor: 'transparent', height: 200 }}
                                        scrollEnabled={true}
                                    />
                                </View>
                            </View>
                        )}

                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { position: 'absolute', width: '100%', height: '100%' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    inputCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#334155'
    },
    label: {
        color: '#cbd5e1',
        marginBottom: 12,
        fontWeight: '600',
    },
    textInput: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 16,
        paddingTop: 16, // Top alignment fix
        minHeight: 150,
        borderWidth: 1,
        fontFamily: 'monospace',
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resultsContainer: {
        gap: 24,
    },
    resultCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#e2e8f0',
        fontSize: 15,
        lineHeight: 22,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        color: '#38bdf8',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoCard: {
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#38bdf8',
    },
    infoText: {
        color: '#e0f2fe',
        fontSize: 15,
        lineHeight: 24,
    },
    codeContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
        height: 200,
        backgroundColor: '#1e293b',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    errorTag: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
        marginTop: 4,
    },
    errorTagText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});
