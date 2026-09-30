import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/Api';

export default function PendingApprovals() {
    const router = useRouter();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/pending-files`);
            const data = await response.json();
            if (response.ok) {
                setFiles(data.files);
            }
        } catch (error) {
            console.error('Failed to fetch pending', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, status: 'approved' | 'rejected') => {
        try {
            const response = await fetch(`${API_URL}/admin/files/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                Alert.alert('Success', `File ${status}`);
                fetchPending(); // Refresh list
            } else {
                Alert.alert('Error', 'Action failed');
            }
        } catch (e) {
            Alert.alert('Error', 'Network error');
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons
                    name={item.file_type === 'video_url' ? "videocam" : "document-text"}
                    size={24}
                    color="#94a3b8"
                />
                <Text style={styles.fileName}>{item.original_name}</Text>
            </View>
            <Text style={styles.uploadedBy}>Uploaded by: {item.uploaded_by}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleAction(item.id, 'rejected')}
                >
                    <Ionicons name="close" size={20} color="#ef4444" />
                    <Text style={[styles.buttonText, { color: '#ef4444' }]}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleAction(item.id, 'approved')}
                >
                    <Ionicons name="checkmark" size={20} color="#22c55e" />
                    <Text style={[styles.buttonText, { color: '#22c55e' }]}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Approvals</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={files}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-done-circle" size={64} color="#334155" />
                        <Text style={styles.emptyText}>All caught up! No pending files.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#0f172a',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    fileName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginLeft: 10,
        flex: 1,
    },
    uploadedBy: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 4,
    },
    date: {
        color: '#64748b',
        fontSize: 12,
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    rejectButton: {
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    approveButton: {
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    buttonText: {
        fontWeight: 'bold',
        marginLeft: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#64748b',
        marginTop: 16,
    }
});
