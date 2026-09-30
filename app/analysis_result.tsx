import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Share, ActivityIndicator, Linking, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

// Syntax Highlighting Template
const getHtmlContent = (code: string, language: string, themeType: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-${themeType === 'dark' ? 'tomorrow' : 'coy'}.min.css" rel="stylesheet" />
    <style>
        body { margin: 0; padding: 0; background-color: ${themeType === 'dark' ? '#111827' : '#f5f5f5'}; }
        pre { margin: 0; padding: 16px; border-radius: 0; background-color: transparent !important; }
        code { font-family: 'Fira Code', monospace; font-size: 14px; }
        ::-webkit-scrollbar { display: none; }
    </style>
</head>
<body>
    <pre><code class="language-${(language || 'text').toLowerCase().replace('#', 'sharp').replace('++', 'cpp')}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-java.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-c.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-csharp.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-sql.min.js"></script>
</body>
</html>
`;

export default function AnalysisResultScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const params = useLocalSearchParams();

    const [data, setData] = useState<any>(null);
    const code = params.code as string || "";

    useEffect(() => {
        if (params.analysisData) {
            try {
                const parsed = JSON.parse(params.analysisData as string);
                setData(parsed);
            } catch (e) {
                console.error("Failed to parse analysis data", e);
            }
        }
    }, [params.analysisData]);

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(code);
        Alert.alert('Copied', 'Code snippet copied to clipboard');
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this explanation for ${data?.language || 'code'}!\n\nSummary: ${data?.summary}\n\nCode:\n${code}`,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    if (!data) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text style={{ color: '#fff', marginTop: 20 }}>Loading Result...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={styles.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analysis Result</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                        <Ionicons name="share-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* 0. Detected Language (New) */}
                <View style={styles.sectionContainer}>
                    <View style={styles.languageBadge}>
                        <Text style={styles.languageLabel}>Detected Language:</Text>
                        <Text style={styles.languageValue}>{data.language || "Auto-detected"}</Text>
                    </View>
                </View>

                {/* 1. Purpose */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Purpose of the Program</Text>
                    <View style={styles.card}>
                        <Text style={styles.bodyText}>{data.purpose || "Analyzes the provided code logic."}</Text>
                    </View>
                </View>

                {/* 2. Step-by-Step Explanation */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Step-by-Step Explanation</Text>
                    <View style={styles.card}>
                        {(data.stepByStep || []).map((step: any, i: number) => {
                            const text = typeof step === 'string' ? step : `${step.line}: ${step.text}`;
                            return (
                                <View key={i} style={styles.listItem}>
                                    <View style={styles.bullet} />
                                    <Text style={styles.bodyText}>{text}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* 3. Key Concepts */}
                {data.concepts && data.concepts.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Key Concepts Used</Text>
                        <View style={styles.card}>
                            <View style={styles.conceptsRow}>
                                {data.concepts.map((concept: string, i: number) => (
                                    <View key={i} style={styles.conceptBadge}>
                                        <Text style={styles.conceptText}>{concept}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* 4. Time and Space Complexity */}
                {data.complexity && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Time and Space Complexity</Text>
                        <View style={styles.card}>
                            <View style={styles.complexityRow}>
                                <Text style={styles.complexityLabel}>Time:</Text>
                                <Text style={styles.complexityValue}>{data.complexity.time || "N/A"}</Text>
                            </View>
                            <View style={styles.complexityRow}>
                                <Text style={styles.complexityLabel}>Space:</Text>
                                <Text style={styles.complexityValue}>{data.complexity.space || "N/A"}</Text>
                            </View>
                            {data.complexity.explanation && (
                                <Text style={[styles.bodyText, { marginTop: 8, fontStyle: 'italic' }]}>
                                    {data.complexity.explanation}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* 5. Related Internet Resource (Video) */}
                {
                    data.relatedVideo && (
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Related Internet Resource</Text>
                            <TouchableOpacity
                                style={styles.videoCard}
                                onPress={() => Linking.openURL(data.relatedVideo.url)}
                            >
                                <Image
                                    source={{ uri: data.relatedVideo.thumbnail || 'https://img.youtube.com/vi/default/mqdefault.jpg' }}
                                    style={styles.videoThumbnail}
                                />
                                <View style={styles.videoInfo}>
                                    <Text style={styles.videoTitle} numberOfLines={2}>{data.relatedVideo.title}</Text>
                                    <View style={styles.videoMeta}>
                                        <Ionicons name="logo-youtube" size={16} color="#ff0000" />
                                        <Text style={styles.videoSource}>YouTube</Text>
                                        <Ionicons name="open-outline" size={14} color="#94a3b8" style={{ marginLeft: 'auto' }} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )
                }

                {/* 5. Example Input and Output */}
                {
                    data.example && (
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Example Input and Output</Text>
                            <View style={styles.card}>
                                <Text style={styles.codeLabel}>Input:</Text>
                                <View style={styles.codeBlock}>
                                    <Text style={styles.codeText}>{data.example.input || "No input available"}</Text>
                                </View>
                                <Text style={[styles.codeLabel, { marginTop: 12 }]}>Output:</Text>
                                <View style={styles.codeBlock}>
                                    <Text style={styles.codeText}>{data.example.output || "No output available"}</Text>
                                </View>
                            </View>
                        </View>
                    )
                }

                {/* 6. Common Beginner Mistakes */}
                {
                    data.mistakes && data.mistakes.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Common Beginner Mistakes</Text>
                            <View style={styles.card}>
                                {data.mistakes.map((mistake: string, i: number) => (
                                    <View key={i} style={styles.listItem}>
                                        <Ionicons name="warning-outline" size={16} color="#fbbf24" style={{ marginRight: 8, marginTop: 2 }} />
                                        <Text style={styles.bodyText}>{mistake}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )
                }

                {/* 7. Three-Line Summary */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Three-Line Summary</Text>
                    <View style={[styles.card, { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                        <Text style={[styles.bodyText, { fontWeight: '500', color: '#e0f2fe' }]}>
                            {data.summary || "Summary unavailable."}
                        </Text>
                    </View>
                </View>

                {/* Source Code View */}
                <Text style={styles.sectionTitle}>Original Code</Text>
                <View style={styles.codeWrapper}>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: getHtmlContent(code, data.language, 'dark') }}
                        style={{ backgroundColor: 'transparent' }}
                        scrollEnabled={false}
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView >
        </View >
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
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    actionButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: 20,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#38bdf8', // Light blue
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 8,
    },
    card: {
        backgroundColor: '#1e293b', // Slate 800
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155', // Slate 700
    },
    bodyText: {
        color: '#cbd5e1', // Slate 300
        fontSize: 15,
        lineHeight: 24,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#38bdf8',
        marginTop: 9,
        marginRight: 10,
    },
    conceptsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    conceptBadge: {
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    conceptText: {
        color: '#38bdf8',
        fontWeight: '600',
        fontSize: 13,
    },
    complexityRow: {
        flexDirection: 'row',
        marginBottom: 6,
        alignItems: 'center',
    },
    complexityLabel: {
        color: '#94a3b8',
        width: 60,
        fontWeight: '600',
    },
    complexityValue: {
        color: '#fff',
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    codeBlock: {
        backgroundColor: '#0f172a',
        padding: 12,
        borderRadius: 8,
        marginTop: 4,
    },
    codeText: {
        color: '#a5f3fc',
        fontFamily: 'monospace',
        fontSize: 13,
    },
    codeLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    codeWrapper: {
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
        backgroundColor: '#111827',
        marginBottom: 30,
    },
    videoCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
    },
    videoThumbnail: {
        width: '100%',
        height: 160,
        backgroundColor: '#000',
    },
    videoInfo: {
        padding: 16,
    },
    videoTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    videoMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    videoSource: {
        color: '#cbd5e1',
        fontSize: 12,
    },
    languageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        alignSelf: 'flex-start',
    },
    languageLabel: {
        color: '#6ee7b7',
        fontWeight: '600',
        marginRight: 8,
    },
    languageValue: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
