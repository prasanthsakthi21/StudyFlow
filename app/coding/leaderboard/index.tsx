import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { API_URL } from '../../../constants/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LeaderboardScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [period, setPeriod] = useState('Weekly');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [userRank, setUserRank] = useState<any>(null);

    useEffect(() => {
        getCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUserId) {
            fetchLeaderboard();
        }
    }, [currentUserId]);

    const getCurrentUser = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                const userData = JSON.parse(token);
                setCurrentUserId(userData.id);
            } else {
                fetchLeaderboard(); // fetch general if no user
            }
        } catch (e) {
            console.error("Failed to load user token");
            fetchLeaderboard();
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const url = currentUserId ? `${API_URL}/leaderboard?userId=${currentUserId}` : `${API_URL}/leaderboard`;
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) {
                setLeaderboard(data.leaderboard);
                if (data.userRank) setUserRank(data.userRank);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            paddingTop: 60,
            paddingHorizontal: 24,
            paddingBottom: 24,
            backgroundColor: theme.primary,
        },
        headerTop: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
        },
        periodTabs: {
            flexDirection: 'row',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: 4,
        },
        tab: {
            flex: 1,
            paddingVertical: 8,
            alignItems: 'center',
            borderRadius: 10,
        },
        activeTab: {
            backgroundColor: '#fff',
        },
        tabText: {
            color: '#fff',
            fontWeight: '600',
        },
        activeTabText: {
            color: theme.primary,
            fontWeight: 'bold',
        },
        podiumContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-end',
            paddingVertical: 32,
            backgroundColor: theme.primary,
            paddingBottom: 60,
            marginBottom: -30,
        },
        podiumItem: {
            alignItems: 'center',
            marginHorizontal: 12,
        },
        avatarContainer: {
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: '#fbbf24',
            marginBottom: 8,
            zIndex: 10,
        },
        rank1Avatar: {
            width: 80,
            height: 80,
            borderRadius: 40,
            borderWidth: 4,
            borderColor: '#fbbf24',
        },
        avatarText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.primary,
        },
        rankBox: {
            width: 80,
            height: 100,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
        rank1Box: {
            width: 100,
            height: 130,
            backgroundColor: 'rgba(255,255,255,0.2)',
        },
        rankText: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#fff',
            opacity: 0.5,
        },
        nameText: {
            color: '#fff',
            fontWeight: 'bold',
            marginBottom: 4,
            fontSize: 12,
        },
        listContainer: {
            flex: 1,
            backgroundColor: theme.background,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            padding: 24,
            paddingBottom: 100, // Space for fixed footer
        },
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.card,
            padding: 16,
            borderRadius: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.border,
        },
        currentUserItem: {
            borderColor: theme.primary,
            backgroundColor: theme.primary + '10', // Light tint
            borderWidth: 2
        },
        rankIndex: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.textSecondary,
            width: 30,
        },
        listAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.input,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
        },
        listName: {
            flex: 1,
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
        },
        listPoints: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.primary,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.background
        },
        stickyUserFooter: {
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: theme.primary,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 10,
        },
        stickyRank: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#fff',
            width: 40,
        },
        stickyAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
        },
        stickyName: {
            flex: 1,
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
        },
        stickyPoints: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fbbf24',
        }
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    // Sort leaderboard properly if not already (API should handle it, but good to be safe)
    const sorted = [...leaderboard].sort((a, b) => b.points - a.points);
    const top3 = [sorted[1], sorted[0], sorted[2]]; // 2, 1, 3 Order for podium

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Leaderboard</Text>
                    <Ionicons name="share-outline" size={24} color="#fff" />
                </View>
                <View style={styles.periodTabs}>
                    {['Daily', 'Weekly', 'All Time'].map(p => (
                        <TouchableOpacity key={p} style={[styles.tab, period === p && styles.activeTab]} onPress={() => setPeriod(p)}>
                            <Text style={[styles.tabText, period === p && styles.activeTabText]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.podiumContainer}>
                {/* Rank 2 (Left) */}
                {top3[0] && (
                    <View style={styles.podiumItem}>
                        <Text style={styles.nameText}>{top3[0].name.split(' ')[0]}</Text>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{top3[0].avatar}</Text>
                        </View>
                        <View style={styles.rankBox}>
                            <Text style={styles.rankText}>2</Text>
                        </View>
                    </View>
                )}

                {/* Rank 1 (Center) */}
                {top3[1] && (
                    <View style={styles.podiumItem}>
                        <Ionicons name="ribbon" size={24} color="#fbbf24" style={{ marginBottom: -10, zIndex: 20 }} />
                        <Text style={[styles.nameText, { fontSize: 14 }]}>{top3[1].name.split(' ')[0]}</Text>
                        <View style={[styles.avatarContainer, styles.rank1Avatar]}>
                            <Text style={[styles.avatarText, { fontSize: 32 }]}>{top3[1].avatar}</Text>
                        </View>
                        <View style={[styles.rankBox, styles.rank1Box]}>
                            <Text style={styles.rankText}>1</Text>
                        </View>
                    </View>
                )}

                {/* Rank 3 (Right) */}
                {top3[2] && (
                    <View style={styles.podiumItem}>
                        <Text style={styles.nameText}>{top3[2].name.split(' ')[0]}</Text>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{top3[2].avatar}</Text>
                        </View>
                        <View style={styles.rankBox}>
                            <Text style={styles.rankText}>3</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.listContainer}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {sorted.slice(3).map((r, index) => (
                        <View key={r.id} style={[styles.listItem, r.id === currentUserId && styles.currentUserItem]}>
                            <Text style={styles.rankIndex}>{index + 4}</Text>
                            <View style={styles.listAvatar}>
                                <Text style={{ fontWeight: 'bold', color: theme.textSecondary }}>{r.avatar}</Text>
                            </View>
                            <Text style={styles.listName}>
                                {r.name} {r.id === currentUserId ? '(You)' : ''}
                            </Text>
                            <Text style={styles.listPoints}>{r.points} XP</Text>
                        </View>
                    ))}
                    {sorted.length === 0 && (
                        <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>
                            No rankings yet. Start coding to earn XP!
                        </Text>
                    )}
                </ScrollView>
            </View>

            {/* STICKY FOOTER FOR USER RANK (If Valid) */}
            {userRank && (
                <View style={styles.stickyUserFooter}>
                    <Text style={styles.stickyRank}>#{userRank.rank}</Text>
                    <View style={styles.stickyAvatar}>
                        <Text style={{ fontWeight: 'bold', color: theme.primary }}>{userRank.avatar}</Text>
                    </View>
                    <Text style={styles.stickyName}>You</Text>
                    <Text style={styles.stickyPoints}>{userRank.points} XP</Text>
                </View>
            )}
        </View>
    );
}
