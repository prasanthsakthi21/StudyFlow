import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '../components/LanguageContext';
import { API_URL } from '../constants/Api';
import { useTheme } from '../context/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

interface CodeLesson {
    id: number;
    language: string;
    snippet: string;
    explanation: string;
    complexity: string;
}

// HTML Template for Syntax Highlighting
const getHtmlContent = (code: string, language: string, themeType: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-${themeType === 'dark' ? 'tomorrow' : 'coy'}.min.css" rel="stylesheet" />
    <style>
        body { margin: 0; padding: 0; background-color: ${themeType === 'dark' ? '#1e1e1e' : '#f5f5f5'}; }
        pre { margin: 0; padding: 16px; border-radius: 0; background-color: transparent !important; }
        code { font-family: 'Fira Code', monospace; font-size: 14px; }
        ::-webkit-scrollbar { display: none; }
    </style>
</head>
<body>
    <pre><code class="language-${language}">${code}</code></pre>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${language}.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-java.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-sql.min.js"></script>
</body>
</html>
`;

export default function CodeExplanationResultScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { language } = useLanguage();

    const [lessons, setLessons] = useState<CodeLesson[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCodeLessons();
    }, []);

    const fetchCodeLessons = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/code-lessons`);
            if (res.ok) {
                const data = await res.json();
                setLessons(data.lessons);
            } else {
                console.error("Failed to fetch code lessons");
            }
        } catch (e) {
            console.error("Fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        alert('Code snippet copied!');
    };

    const getBadgeColor = (complexity: string) => {
        if (complexity.includes('1') || complexity.includes('log')) return '#22c55e'; // Green
        if (complexity.includes('n^2') || complexity.includes('!')) return '#ef4444'; // Red
        return '#eab308'; // Yellow (O(n))
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={theme.statusBar} />
            <LinearGradient
                colors={theme.gradient as any}
                style={styles.background}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Code Snippets</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                ) : lessons.length === 0 ? (
                    <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No code lessons found.</Text>
                ) : (
                    lessons.map((item) => (
                        <View key={item.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {/* Card Header (Lang + Complexity) */}
                            <View style={styles.cardHeader}>
                                <View style={styles.langBadge}>
                                    <View style={[styles.langDot, { backgroundColor: getLangColor(item.language) }]} />
                                    <Text style={styles.langText}>{item.language.toUpperCase()}</Text>
                                </View>

                                {item.complexity && (
                                    <View style={[styles.complexityBadge, { backgroundColor: getBadgeColor(item.complexity) + '20', borderColor: getBadgeColor(item.complexity) }]}>
                                        <Text style={[styles.complexityText, { color: getBadgeColor(item.complexity) }]}>
                                            {item.complexity}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* WebView Code Block */}
                            <View style={[styles.codeContainer, { borderColor: theme.border }]}>
                                <TouchableOpacity
                                    style={styles.copyButton}
                                    onPress={() => copyToClipboard(item.snippet)}
                                >
                                    <Ionicons name="copy-outline" size={16} color="#94a3b8" />
                                </TouchableOpacity>

                                <View style={{ height: 220, backgroundColor: theme.type === 'dark' ? '#1e1e1e' : '#f5f5f5' }}>
                                    <WebView
                                        originWhitelist={['*']}
                                        source={{ html: getHtmlContent(item.snippet, item.language, theme.type) }}
                                        style={{ backgroundColor: 'transparent' }}
                                        scrollEnabled={true}
                                        nestedScrollEnabled={true}
                                    />
                                </View>
                            </View>

                            <View style={styles.explanationBox}>
                                <Ionicons name="bulb-outline" size={18} color={theme.primary} style={{ marginRight: 8, marginTop: 2 }} />
                                <Text style={[styles.explanationText, { color: theme.textSecondary }]}>
                                    {item.explanation}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const getLangColor = (lang: string) => {
    switch (lang.toLowerCase()) {
        case 'javascript': return '#f7df1e';
        case 'python': return '#306998';
        case 'java': return '#b07219';
        case 'typescript': return '#3178c6';
        default: return '#cbd5e1';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
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
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    langBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    langDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    langText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '700',
    },
    complexityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    complexityText: {
        fontSize: 12,
        fontWeight: '800',
    },
    codeContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 16,
        position: 'relative',
    },
    copyButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 5,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 6,
        borderRadius: 8,
    },
    explanationBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    explanationText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});
