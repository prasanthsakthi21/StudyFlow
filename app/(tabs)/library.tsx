import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/ThemeContext';
import { API_URL } from '../../constants/Api';
import i18n from '../../constants/i18n';

const { width } = Dimensions.get('window');

export default function LibraryScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [userFiles, setUserFiles] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        headerBackground: {
            paddingTop: 60,
            paddingBottom: 24,
            paddingHorizontal: 24,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
        },
        headerTitle: {
            fontSize: 28,
            fontFamily: 'Outfit_700Bold',
            color: '#fff',
            marginBottom: 8,
        },
        headerSubtitle: {
            fontSize: 16,
            color: 'rgba(255,255,255,0.9)',
            fontFamily: 'Outfit_500Medium',
        },
        searchContainer: {
            marginTop: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
        },
        searchIcon: {
            marginRight: 10,
        },
        searchInput: {
            flex: 1,
            color: '#fff',
            fontFamily: 'Outfit_500Medium',
            fontSize: 16,
        },
        contentContainer: {
            padding: 24,
        },
        fileGrid: {
            gap: 16,
        },
        fileItem: {
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: theme.border,
        },
        fileIconContainer: {
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: theme.input,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
        },
        fileContent: {
            flex: 1,
        },
        fileName: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.text,
            marginBottom: 4,
            fontFamily: 'Outfit_600SemiBold',
        },
        fileMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        fileTypeBadge: {
            backgroundColor: theme.type === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
        },
        fileTypeText: {
            fontSize: 10,
            color: theme.primary,
            fontWeight: 'bold',
            textTransform: 'uppercase',
        },
        fileDate: {
            fontSize: 12,
            color: theme.textSecondary,
            fontFamily: 'Outfit_400Regular',
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60,
            opacity: 0.7,
        },
        emptyStateText: {
            marginTop: 16,
            fontSize: 18,
            color: theme.textSecondary,
            fontFamily: 'Outfit_600SemiBold',
        },
        emptyStateSubtext: {
            marginTop: 8,
            fontSize: 14,
            color: theme.textSecondary,
            textAlign: 'center',
            maxWidth: 250,
            lineHeight: 20,
        }
    });

    const fetchUserFiles = async (userId: number) => {
        if (!userId) return;
        try {
            const response = await fetch(`${API_URL}/users/${userId}/files`);
            const data = await response.json();
            if (response.ok) {
                setUserFiles(data.files || []);
            }
        } catch (error) {
            console.error('Failed to fetch user files:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const loadUser = async () => {
                try {
                    const userStr = await AsyncStorage.getItem('userToken');
                    if (userStr) {
                        const userData = JSON.parse(userStr);
                        setUser(userData);
                        fetchUserFiles(userData.id);
                    }
                } catch (e) {
                    console.error('Failed to load user', e);
                }
            };
            loadUser();
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (user?.id) {
            await fetchUserFiles(user.id);
        }
        setRefreshing(false);
    }, [user]);

    const openSummary = async (file: any) => {
        const currentLastRead = {
            fileId: file.id,
            title: file.original_name,
            type: file.file_type,
            videoUrl: file.file_type === 'video_url' ? file.file_url : undefined
        };
        await AsyncStorage.setItem('lastReadFile', JSON.stringify(currentLastRead));

        router.push({
            pathname: '/summary',
            params: {
                fileId: file.id,
                fileName: file.original_name,
                title: file.original_name,
                videoUrl: file.file_type === 'video_url' ? file.file_url : undefined
            }
        });
    };

    const filteredFiles = userFiles.filter(file =>
        file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                <LinearGradient
                    colors={theme.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerBackground}
                >
                    <Text style={styles.headerTitle}>My Library</Text>
                    <Text style={styles.headerSubtitle}>Access all your uploaded documents</Text>

                    {/* Search Bar Placeholder - Could be made functional later simply by adding TextInput */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#fff" style={styles.searchIcon} />
                        <Text style={styles.searchInput}>Search your notes...</Text>
                    </View>
                </LinearGradient>

                <View style={styles.contentContainer}>
                    {filteredFiles.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.input, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="library-outline" size={40} color={theme.primary} />
                            </View>
                            <Text style={styles.emptyStateText}>Library is Empty</Text>
                            <Text style={styles.emptyStateSubtext}>Upload documents from the Home screen to see them here.</Text>
                        </View>
                    ) : (
                        <View style={styles.fileGrid}>
                            {filteredFiles.map((file) => (
                                <TouchableOpacity key={file.id} style={styles.fileItem} onPress={() => openSummary(file)} activeOpacity={0.7}>
                                    <View style={styles.fileIconContainer}>
                                        <Ionicons
                                            name={file.file_type === 'video_url' ? "logo-youtube" : "document-text"}
                                            size={28}
                                            color={file.file_type === 'video_url' ? "#ef4444" : theme.primary}
                                        />
                                    </View>
                                    <View style={styles.fileContent}>
                                        <Text style={styles.fileName} numberOfLines={1}>{file.original_name}</Text>
                                        <View style={styles.fileMeta}>
                                            <View style={styles.fileTypeBadge}>
                                                <Text style={styles.fileTypeText}>{file.file_type === 'video_url' ? 'VIDEO' : 'DOC'}</Text>
                                            </View>
                                            <Text style={styles.fileDate}>{new Date(file.created_at).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
        </View>
    );
}
