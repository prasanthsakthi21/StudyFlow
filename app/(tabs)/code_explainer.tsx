import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Clipboard, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../constants/Api';
import { useTheme } from '../../context/ThemeContext';

export default function CodeExplainerScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);

    const handleExplain = async () => {
        if (!code.trim()) {
            Alert.alert("Input Required", "Please paste some code to explain.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/explain-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, userId: 1 })
            });

            if (response.ok) {
                const data = await response.json();
                // Navigate to Result Screen

                router.push({
                    pathname: "/analysis_result",
                    params: {
                        code: code,
                        analysisData: JSON.stringify(data)
                    }
                });

            } else {
                const text = await response.text();
                console.log("RAW BACKEND ERROR:", text); // Debugging
                try {
                    const json = JSON.parse(text);
                    Alert.alert("Error", json.error || "Failed to explain");
                } catch (e) {
                    Alert.alert("Server Error", "Received invalid response from server. Check console.");
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Network Error", "Could not connect to server. Check your connection.");
        } finally {
            setLoading(false);
        }
    };



    // --- STYLES ---
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            paddingTop: 60,
            paddingBottom: 20,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        headerTextContainer: {
            flex: 1,
            marginHorizontal: 10
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
            fontFamily: 'Outfit_700Bold',
        },
        headerSubtitle: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            marginTop: 4,
            fontFamily: 'Outfit_400Regular',
        },
        infoButton: {
            padding: 8,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 12,
        },
        content: {
            flex: 1,
            padding: 20,
        },
        inputLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.text,
            marginBottom: 10,
            fontFamily: 'Outfit_600SemiBold',
        },
        inputContainer: {
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 15,
            borderWidth: 1,
            borderColor: theme.border,
            height: 200,
            marginBottom: 20,
        },
        textInput: {
            flex: 1,
            color: theme.text,
            fontSize: 14,
            fontFamily: 'Courier New',
            textAlignVertical: 'top',
        },
        analyzeButton: {
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
            fontFamily: 'Outfit_700Bold',
        },
        resultContainer: {
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 40,
        },
        resultHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        langBadge: {
            backgroundColor: theme.primary + '20',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
        },
        langText: {
            color: theme.primary,
            fontWeight: 'bold',
            fontSize: 14,
        },
        lineItem: {
            marginBottom: 12,
        },
        lineHeader: {
            fontSize: 12,
            color: theme.textSecondary,
            marginBottom: 2,
            fontWeight: '600',
        },
        lineText: {
            fontSize: 15,
            color: theme.text,
            lineHeight: 22,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
        },
        modalContent: {
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 16,
            textAlign: 'center',
            fontFamily: 'Outfit_700Bold',
        },
        modalText: {
            fontSize: 15,
            color: theme.textSecondary,
            lineHeight: 22,
            marginBottom: 12,
            fontFamily: 'Outfit_400Regular',
        },
        closeButton: {
            backgroundColor: theme.primary,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 12
        },
        closeButtonText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 16
        }
    });

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <LinearGradient
                colors={theme.gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Code Explainer</Text>
                    <Text style={styles.headerSubtitle}>AI-powered code analysis</Text>
                </View>

                <TouchableOpacity onPress={() => router.push('/explainer_help')} style={styles.infoButton}>
                    <Ionicons name="information-circle-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={styles.inputLabel}>Source Code</Text>
                    <TouchableOpacity onPress={async () => {
                        try {
                            const text = await Clipboard.getString();
                            if (text) setCode(text);
                            else Alert.alert("Clipboard Empty", "Nothing to paste.");
                        } catch (e) {
                            Alert.alert("Paste Error", "Could not access clipboard.");
                        }
                    }}>
                        <Text style={{ color: theme.primary, fontWeight: '600' }}>Paste Code</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        multiline
                        placeholder="// Paste your code here..."
                        placeholderTextColor={theme.textSecondary}
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <TouchableOpacity
                    style={styles.analyzeButton}
                    onPress={handleExplain}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={theme.gradient as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientButton}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Explain Code</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>

            <Modal
                transparent={true}
                visible={infoVisible}
                animationType="fade"
                onRequestClose={() => setInfoVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Code Explainer</Text>
                        <Text style={styles.modalText}>
                            1. Paste your code snippet in the box.
                        </Text>
                        <Text style={styles.modalText}>
                            2. Tap "Explain Code" to get a line-by-line breakdown.
                        </Text>
                        <Text style={styles.modalText}>
                            3. Our AI engine (or rule-based fallback) will analyze the logic.
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setInfoVisible(false)}>
                            <Text style={styles.closeButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View >
    );
}
