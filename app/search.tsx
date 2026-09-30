import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../constants/Api';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext'; // Import Theme Context

export default function SearchScreen() {
    const router = useRouter();
    const { theme } = useTheme(); // Use Theme
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/files/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (response.ok) {
                setResults(data.results);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const openResource = (item: any) => {
        router.push({
            pathname: '/summary',
            params: {
                fileId: item.id,
                fileName: item.original_name,
                title: item.subject || 'Resource View',
                videoUrl: item.file_type === 'video_url' ? item.file_url : undefined,
                fileUrl: item.file_url
            }
        });
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => openResource(item)}
            >
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={item.category === 'semester_resource' ? "library" : "document-text"}
                        size={24}
                        color={item.category === 'semester_resource' ? "#f472b6" : "#38bdf8"}
                    />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.title} numberOfLines={1}>{item.original_name}</Text>
                    {item.subject && <Text style={styles.subject}>{item.subject}</Text>}
                    {item.description && <Text style={styles.description} numberOfLines={2}>{item.description}</Text>}
                </View>
            </TouchableOpacity>

            {/* Download Button - Direct Access */}
            {item.file_url && item.file_type !== 'video_url' && (
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={async () => {
                        try {
                            const supported = await Linking.canOpenURL(item.file_url);
                            if (supported) {
                                await Linking.openURL(item.file_url);
                            } else {
                                console.error("Cannot open URL:", item.file_url);
                            }
                        } catch (err) {
                            console.error("Failed to open URL:", err);
                        }
                    }}
                >
                    <Ionicons name="cloud-download-outline" size={20} color="#38bdf8" />
                </TouchableOpacity>
            )}
        </View>
    );

    // ... inside SearchScreen component ...
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            paddingTop: 60,
            paddingHorizontal: 20,
            paddingBottom: 20,
            backgroundColor: 'transparent',
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: '800',
            color: theme.text,
            marginBottom: 16,
        },
        searchBar: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.input,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 50,
            borderWidth: 1,
            borderColor: theme.border,
        },
        input: {
            flex: 1,
            color: theme.text,
            marginLeft: 10,
            fontSize: 16,
        },
        list: {
            padding: 20,
        },
        card: {
            flexDirection: 'row',
            backgroundColor: theme.card,
            padding: 16,
            marginBottom: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: 'center',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        downloadButton: {
            padding: 8,
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderRadius: 8,
            marginLeft: 8,
            borderWidth: 1,
            borderColor: 'rgba(56, 189, 248, 0.2)',
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: theme.background, // Or theme.input
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
            borderWidth: 1,
            borderColor: theme.border
        },
        cardContent: {
            flex: 1,
            justifyContent: 'center',
        },
        title: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 4,
        },
        subject: {
            fontSize: 12,
            fontWeight: 'bold',
            color: theme.primary,
            textTransform: 'uppercase',
            marginBottom: 2,
        },
        description: {
            fontSize: 13,
            color: theme.textSecondary,
        },
        emptyText: {
            textAlign: 'center',
            color: theme.textSecondary,
            marginTop: 40,
        },
        placeholderContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 60,
            opacity: 0.5
        },
        placeholderText: {
            color: theme.textSecondary,
            textAlign: 'center',
            marginTop: 16,
            width: '70%',
        }
    });

    return (
        <View style={styles.container}>
            <StatusBar style={theme.statusBar} />
            <LinearGradient
                colors={theme.gradient as any}
                style={{ position: 'absolute', width: '100%', height: 200 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Search Resources</Text>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search for lessons, subjects..."
                        placeholderTextColor={theme.textSecondary}
                        value={query}
                        onChangeText={setQuery}
                        autoCapitalize="none"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        query.length > 0 ? (
                            <Text style={styles.emptyText}>No results found.</Text>
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <Ionicons name="search-circle-outline" size={80} color={theme.textSecondary} />
                                <Text style={styles.placeholderText}>Type to search across all semester resources.</Text>
                            </View>
                        )
                    }
                />
            )}
        </View>
    );
}
