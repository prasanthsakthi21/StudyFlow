import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemeType } from '../context/ThemeContext';

interface FileCardProps {
    file: any;
    onEdit: (file: any) => void;
    onDelete: (id: number) => void;
    theme: ThemeType;
}

export default function FileCard({ file, onEdit, onDelete, theme }: FileCardProps) {
    const cardBg = theme.card;
    const textColor = theme.text;
    const subTextColor = theme.textSecondary;
    const borderColor = theme.border;

    const getIcon = (type: string) => {
        if (type === 'doc') return 'document-text';
        if (type === 'video_url') return 'play-circle';
        return 'document';
    };

    const getTypeColor = (type: string) => {
        if (type === 'doc') return 'rgba(99, 102, 241, 0.2)'; // Indigo tint
        if (type === 'video_url') return 'rgba(244, 63, 94, 0.2)'; // Rose tint
        return theme.input;
    };

    const getTypeBadgeColor = (type: string) => {
        if (type === 'doc') return '#6366f1';
        if (type === 'video_url') return '#f43f5e';
        return theme.textSecondary;
    };


    return (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderColor }]}>
            <View style={styles.headerRow}>
                <View style={styles.iconTitle}>
                    <Ionicons name={getIcon(file.file_type)} size={24} color={subTextColor} />
                    <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>{file.original_name}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(file.file_type) }]}>
                    <Text style={[styles.typeText, { color: getTypeBadgeColor(file.file_type) }]}>
                        {file.file_type === 'video_url' ? 'VIDEO' : 'DOC'}
                    </Text>
                </View>
            </View>

            <View style={styles.tagRow}>
                {file.course && (
                    <View style={[styles.tag, { backgroundColor: 'rgba(251, 146, 60, 0.2)' }]}>
                        <Text style={[styles.tagText, { color: '#fb923c' }]}>{file.course}</Text>
                    </View>
                )}
                {file.semester && (
                    <View style={[styles.tag, { backgroundColor: 'rgba(234, 179, 8, 0.2)' }]}>
                        <Text style={[styles.tagText, { color: '#eab308' }]}>{file.semester}</Text>
                    </View>
                )}
                {file.subject && (
                    <View style={[styles.tag, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                        <Text style={[styles.tagText, { color: '#22c55e' }]}>{file.subject}</Text>
                    </View>
                )}
                {file.unit_number && (
                    <View style={[styles.tag, { backgroundColor: theme.input }]}>
                        <Text style={[styles.tagText, { color: theme.textSecondary }]}>{file.unit_number}</Text>
                    </View>
                )}
                {file.topic_name && (
                    <View style={[styles.tag, { backgroundColor: 'rgba(147, 51, 234, 0.2)' }]}>
                        <Text style={[styles.tagText, { color: '#9333ea' }]}>{file.topic_name}</Text>
                    </View>
                )}
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="download-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.actionText, { color: theme.textSecondary }]}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(file)}>
                    <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.actionText, { color: theme.textSecondary }]}>Edit</Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <TouchableOpacity
                    style={[styles.hideButton]}
                    onPress={() => onDelete(file.id)}
                >
                    <Ionicons name={file.approval_status === 'approved' ? "eye" : "eye-off"} size={16} color="#fff" />
                    <Text style={styles.hideButtonText}>
                        {file.approval_status === 'approved' ? 'Hide' : 'Show'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        flex: 1,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    hideButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ef4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    hideButtonText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    }
});
