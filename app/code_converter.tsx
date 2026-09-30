
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Clipboard, Modal, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../constants/Api';
import { useTheme } from '../context/ThemeContext';
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
        body { margin: 0; padding: 0; background-color: ${themeType === 'dark' ? '#1e293b' : '#f5f5f5'}; }
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
<body>
</html>
`;

export default function CodeConverterScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [code, setCode] = useState('');
    const [targetLang, setTargetLang] = useState('python');
    const [resultCode, setResultCode] = useState('');
    const [relatedVideo, setRelatedVideo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showLangModal, setShowLangModal] = useState(false);

    const languages = [
        { id: 'python', label: 'Python', icon: 'logo-python' },
        { id: 'javascript', label: 'JavaScript', icon: 'logo-javascript' },
        { id: 'java', label: 'Java', icon: 'cafe' },
        { id: 'cpp', label: 'C++', icon: 'code-slash' },
        { id: 'csharp', label: 'C#', icon: 'code-working' },
        { id: 'php', label: 'PHP', icon: 'server' },
        { id: 'swift', label: 'Swift', icon: 'phone-portrait' },
        { id: 'go', label: 'Go', icon: 'flash' },
    ];

    const handleConvert = async () => {
        if (!code.trim()) {
            Alert.alert("Input Required", "Please paste some code to convert.");
            return;
        }

        setLoading(true);
        setResultCode('');
        setRelatedVideo(null);

        try {
            const response = await fetch(`${API_URL}/convert-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, targetLang })
            });

            if (response.ok) {
                const data = await response.json();
                setResultCode(data.convertedCode);
                setRelatedVideo(data.relatedVideo);
            } else {
                const text = await response.text();
                throw new Error(text || "Conversion failed");
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", "Could not convert code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const copyResult = async () => {
        if (resultCode) {
            await Clipboard.setString(resultCode);
            Alert.alert("Copied", "Converted code copied to clipboard!");
        }
    };

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            paddingTop: 60,
            paddingBottom: 20,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#fff',
            fontFamily: 'Outfit_700Bold',
        },
        backButton: {
            padding: 8,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
        },
        content: { flex: 1, padding: 20 },
        inputContainer: {
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 15,
            borderWidth: 1,
            borderColor: theme.border,
            height: 180,
            marginBottom: 20,
        },
        textInput: {
            flex: 1,
            color: theme.text,
            fontSize: 14,
            fontFamily: 'monospace',
            textAlignVertical: 'top',
        },
        langSelector: {
            backgroundColor: theme.card,
            padding: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 20,
            justifyContent: 'space-between'
        },
        langText: {
            color: theme.text,
            fontWeight: 'bold',
            fontSize: 16
        },
        convertButton: {
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 30,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        gradientButton: {
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        buttonText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
        },
        resultContainer: {
            height: 300,
            backgroundColor: theme.card,
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 40,
        },
        resultHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 12,
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderBottomWidth: 1,
            borderBottomColor: theme.border
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            width: '80%',
            maxHeight: '60%',
        },
        langItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border
        }
    });

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Code Converter</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Input */}
                <Text style={{ color: theme.textSecondary, marginBottom: 8, fontWeight: '600' }}>Original Code</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        multiline
                        placeholder="// Paste code here..."
                        placeholderTextColor={theme.textSecondary}
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {/* Target Language Selector */}
                <Text style={{ color: theme.textSecondary, marginBottom: 8, fontWeight: '600' }}>Convert To</Text>
                <TouchableOpacity style={styles.langSelector} onPress={() => setShowLangModal(true)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons name={languages.find(l => l.id === targetLang)?.icon as any || 'code'} size={24} color={theme.primary} />
                        <Text style={styles.langText}>
                            {languages.find(l => l.id === targetLang)?.label}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                {/* Convert Button */}
                <TouchableOpacity style={styles.convertButton} onPress={handleConvert} disabled={loading}>
                    <LinearGradient
                        colors={theme.gradient as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Convert Code</Text>}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Result */}
                {resultCode ? (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Result ({languages.find(l => l.id === targetLang)?.label})</Text>
                            <TouchableOpacity onPress={copyResult}>
                                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Copy</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.resultContainer}>
                            <WebView
                                originWhitelist={['*']}
                                source={{ html: getHtmlContent(resultCode, targetLang, theme.type) }}
                                style={{ backgroundColor: 'transparent' }}
                                scrollEnabled={true}
                            />
                        </View>
                    </View>
                ) : null}

                {/* Related Video Section */}
                {
                    relatedVideo && (
                        <View style={{ marginTop: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12, fontFamily: 'Outfit_700Bold' }}>
                                Recommended Tutorial
                            </Text>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: theme.card,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    marginBottom: 20
                                }}
                                onPress={() => Clipboard.setString(relatedVideo.url)} // In a real app, open logic
                            >
                                <Image
                                    source={{ uri: relatedVideo.thumbnail }}
                                    style={{ width: '100%', height: 180 }}
                                    resizeMode="cover"
                                />
                                <View style={{ padding: 12 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 }} numberOfLines={2}>
                                        {relatedVideo.title}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: theme.primary }}>Tap to copy link</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )
                }

                <View style={{ height: 40 }} />
            </ScrollView >

            <Modal visible={showLangModal} transparent animationType="fade" onRequestClose={() => setShowLangModal(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLangModal(false)}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16, textAlign: 'center' }}>Select Target Language</Text>
                        {languages.map(lang => (
                            <TouchableOpacity
                                key={lang.id}
                                style={styles.langItem}
                                onPress={() => {
                                    setTargetLang(lang.id);
                                    setShowLangModal(false);
                                }}
                            >
                                <Ionicons name={lang.icon as any} size={24} color={targetLang === lang.id ? theme.primary : theme.textSecondary} style={{ marginRight: 12 }} />
                                <Text style={{ fontSize: 16, color: targetLang === lang.id ? theme.primary : theme.text, fontWeight: targetLang === lang.id ? 'bold' : 'normal' }}>
                                    {lang.label}
                                </Text>
                                {targetLang === lang.id && <Ionicons name="checkmark" size={20} color={theme.primary} style={{ marginLeft: 'auto' }} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal >
        </View >
    );
}
