import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface StorageStats {
    usedMB: string;
    totalMB: number;
    fileCount: number;
    breakdown: {
        docs: { count: number, size: number };
        video: { count: number, size: number };
        image: { count: number, size: number };
        other: { count: number, size: number };
    };
}

interface StorageSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    stats: StorageStats | null;
}

export default function StorageSettingsModal({ visible, onClose, stats }: StorageSettingsModalProps) {
    const usedMB = parseFloat(stats?.usedMB || '0');
    const totalMB = stats?.totalMB || 2000;
    const usagePercent = Math.min((usedMB / totalMB) * 100, 100);

    return (
        <Modal animationType="slide" visible={visible} transparent={true} onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Storage and Data</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Manage Storage Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Ionicons name="folder-open" size={22} color="#38bdf8" />
                                <Text style={styles.sectionTitle}>Manage Storage</Text>
                            </View>

                            <View style={styles.storageCard}>
                                <View style={styles.usageRow}>
                                    <Text style={styles.usageText}>
                                        <Text style={styles.usageHighlight}>{usedMB.toFixed(1)} MB</Text> used
                                    </Text>
                                    <Text style={styles.totalText}>{totalMB / 1000} GB total</Text>
                                </View>

                                <View style={styles.progressBarBg}>
                                    <LinearGradient
                                        colors={['#38bdf8', '#818cf8']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressBarFill, { width: `${usagePercent}%` }]}
                                    />
                                </View>

                                {/* Breakdown */}
                                <View style={styles.breakdownContainer}>
                                    {stats?.breakdown && Object.entries(stats.breakdown).map(([key, data]: [string, any]) => (
                                        <View key={key} style={styles.breakdownItem}>
                                            <View style={styles.breakdownLeft}>
                                                <Ionicons
                                                    name={key === 'video' ? 'videocam' : key === 'image' ? 'image' : 'document-text'}
                                                    size={18}
                                                    color="#94a3b8"
                                                />
                                                <Text style={styles.breakdownLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                                            </View>
                                            <Text style={styles.breakdownValue}>{(parseFloat(data?.size) || 0).toFixed(1)} MB</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Free Up Space / Manage Section */}
                        <View style={[styles.section, { marginTop: 32 }]}>
                            <View style={styles.sectionHeaderRow}>
                                <Ionicons name="trash-bin-outline" size={22} color="#f87171" />
                                <Text style={styles.sectionTitle}>Free Up Space</Text>
                            </View>
                            <Text style={styles.sectionSubtitle}>Remove unnecessary files to save space</Text>

                            <View style={styles.settingCard}>
                                <TouchableOpacity style={styles.settingRow}>
                                    <View>
                                        <Text style={styles.settingLabel}>Clear Cache</Text>
                                        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Frees up temporary space</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#64748b" />
                                </TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity style={styles.settingRow}>
                                    <View>
                                        <Text style={styles.settingLabel}>Delete Large Files</Text>
                                        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Review files larger than 50MB</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#64748b" />
                                </TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity style={styles.settingRow}>
                                    <View>
                                        <Text style={[styles.settingLabel, { color: '#f87171' }]}>Delete All Downloads</Text>
                                        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Remove all offline content</Text>
                                    </View>
                                    <Ionicons name="trash-outline" size={20} color="#f87171" />
                                </TouchableOpacity>
                            </View>
                        </View>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#020617', // Match App Background
    },
    modalContent: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
        backgroundColor: '#0f172a',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#f8fafc',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f8fafc',
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 16,
        marginTop: -8,
        marginLeft: 32,
    },
    storageCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 20,
    },
    usageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    usageText: {
        fontSize: 16,
        color: '#cbd5e1',
    },
    usageHighlight: {
        color: '#38bdf8',
        fontWeight: '700',
        fontSize: 24,
    },
    totalText: {
        color: '#64748b',
        fontSize: 14,
    },
    progressBarBg: {
        height: 10,
        backgroundColor: '#334155',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    breakdownContainer: {
        gap: 12,
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    breakdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    breakdownLabel: {
        color: '#cbd5e1',
        fontSize: 15,
        fontWeight: '500',
    },
    breakdownValue: {
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '600',
    },
    settingCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    settingLabel: {
        fontSize: 16,
        color: '#f8fafc',
        fontWeight: '500',
    },
    cardHeader: {
        fontSize: 15,
        fontWeight: '700',
        color: '#cbd5e1',
        padding: 16,
        paddingBottom: 12,
        backgroundColor: '#1e293b',
    },
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginHorizontal: 16,
    },
    checkRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#334155', // Separator
    },
    checkLabel: {
        fontSize: 15,
        color: '#e2e8f0',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#475569',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedBox: {
        backgroundColor: '#38bdf8',
        borderColor: '#38bdf8',
    }
});
