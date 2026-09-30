import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { API_URL } from '../../../constants/Api';
import FileCard from '../../../components/FileCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ... imports ...
import { useTheme } from '../../../context/ThemeContext'; // Import Theme Context
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminDashboard() {
    const router = useRouter();
    const { theme } = useTheme(); // Use Global Theme
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    // Enhanced Metadata State
    const [unit, setUnit] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('medium');

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/pending-files`); // Now returns all files desc
            const data = await response.json();
            if (response.ok) {
                setFiles(data.files);
            }
        } catch (error) {
            console.error('Failed to fetch files', error);
        } finally {
            setLoading(false);
        }
    };

    const pickAndUploadFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['*/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled) return;

        const file = result.assets[0];

        // For this redesign, we auto-assign filters as tags if present, else default
        if (!courseFilter && !semesterFilter) {
            Alert.alert('Tag Required', 'Please enter Course and Semester in the filter box before uploading to tag this file.');
            return;
        }

        setUploading(true);
        try {
            const userStr = await AsyncStorage.getItem('userToken');
            const user = JSON.parse(userStr || '{}');

            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/octet-stream',
            } as any);
            formData.append('title', file.name);
            formData.append('course', courseFilter);
            formData.append('semester', semesterFilter);
            formData.append('subject', subjectFilter || 'General');
            // New Teacher Metadata
            formData.append('unit', unit);
            formData.append('topic', topic);
            formData.append('difficulty', difficulty);

            formData.append('adminId', user.id || '1');

            const response = await fetch(`${API_URL}/admin/upload-resource`, {
                method: 'POST',
                headers: { 'Content-Type': 'multipart/form-data' },
                body: formData,
            });

            if (response.ok) {
                Alert.alert('Success', 'File Uploaded');
                fetchFiles();
            } else {
                Alert.alert('Error', 'Upload failed');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error');
        } finally {
            setUploading(false);
        }
    };

    const toggleHide = async (id: number) => {
        // Optimistic update would be better, but simple toggle for now
        // "Hide" means set status to 'pending' (or 'rejected' but let's say pending removes from search)
        // "Show" means set status to 'approved'
        const file = files.find((f: any) => f.id === id);
        if (!file) return;

        const newStatus = (file as any).approval_status === 'approved' ? 'pending' : 'approved';

        try {
            await fetch(`${API_URL}/admin/files/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchFiles();
        } catch (e) {
            console.error(e);
        }
    };

    // Filter Logic
    const filteredFiles = files.filter((file: any) => {
        const matchSearch = file.original_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCourse = !courseFilter || (file.course && file.course.toLowerCase().includes(courseFilter.toLowerCase()));
        const matchSem = !semesterFilter || (file.semester && file.semester.toLowerCase().includes(semesterFilter.toLowerCase()));
        return matchSearch && matchCourse && matchSem;
    });

    const handleSelectFile = (file: any) => {
        setSelectedFile(file);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 8,
            paddingTop: 50,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.primary,
        },
        subHeader: {
            textAlign: 'center',
            fontSize: 18,
            fontWeight: '600',
            color: theme.textSecondary,
            marginBottom: 24,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            paddingBottom: 16,
            marginHorizontal: 24,
        },
        scrollContent: {
            paddingHorizontal: 24,
            paddingBottom: 40,
        },
        uploadBox: {
            marginBottom: 16,
        },
        uploadArea: {
            borderWidth: 2,
            borderColor: theme.primary,
            borderStyle: 'dashed',
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            backgroundColor: theme.card,
        },
        uploadText: {
            color: theme.primary,
            marginVertical: 12,
            fontWeight: '500',
        },
        selectButton: {
            backgroundColor: theme.primary,
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 8,
        },
        selectButtonText: {
            color: theme.type === 'dark' ? '#0f172a' : '#fff',
            fontWeight: '600',
        },
        bulkButton: {
            backgroundColor: theme.card,
            padding: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 24,
            borderWidth: 1,
            borderColor: theme.border,
        },
        bulkButtonText: {
            color: theme.text,
            fontWeight: '700',
            fontSize: 14,
        },
        filtersContainer: {
            gap: 12,
            marginBottom: 24,
        },
        searchRow: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            paddingHorizontal: 12,
            height: 44,
            backgroundColor: theme.input,
        },
        searchInput: {
            flex: 1,
            marginLeft: 8,
            fontSize: 14,
            color: theme.text
        },
        filterRow: {
            flexDirection: 'row',
            gap: 8,
        },
        filterInput: {
            flex: 1,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            paddingHorizontal: 12,
            height: 44,
            fontSize: 12,
            backgroundColor: theme.input,
            color: theme.text
        },
        sectionHeader: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 16,
        },
        listContainer: {
            gap: 8,
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar style={theme.statusBar} />
            <LinearGradient colors={theme.gradient as any} style={{ position: 'absolute', width: '100%', height: '100%' }} />

            <View style={styles.header}>
                <Ionicons name="school" size={32} color={theme.primary} />
                <Text style={styles.headerTitle}>StudyFlow Admin</Text>
            </View>
            <Text style={styles.subHeader}>Upload & Management</Text>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Upload Box */}
                <View style={styles.uploadBox}>
                    <TouchableOpacity style={styles.uploadArea} onPress={pickAndUploadFile}>
                        {uploading ? (
                            <ActivityIndicator size="large" color={theme.primary} />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={48} color={theme.primary} />
                                <Text style={styles.uploadText}>Drag & Drop files here or</Text>
                                <View style={styles.selectButton}>
                                    <Text style={styles.selectButtonText}>Select Files</Text>
                                </View>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Bulk Options */}
                <TouchableOpacity style={styles.bulkButton}>
                    <Text style={styles.bulkButtonText}>Bulk Upload Options</Text>
                </TouchableOpacity>

                {/* Filters */}
                <View style={styles.filtersContainer}>
                    <View style={styles.searchRow}>
                        <Ionicons name="search" size={20} color={theme.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by filename..."
                            placeholderTextColor={theme.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <View style={styles.filterRow}>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Course (e.g. MCA)"
                            placeholderTextColor={theme.textSecondary}
                            value={courseFilter}
                            onChangeText={setCourseFilter}
                        />
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Semester"
                            placeholderTextColor={theme.textSecondary}
                            value={semesterFilter}
                            onChangeText={setSemesterFilter}
                        />
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Subject"
                            placeholderTextColor={theme.textSecondary}
                            value={subjectFilter}
                            onChangeText={setSubjectFilter}
                        />
                    </View>
                    {/* Detailed Metadata Row */}
                    <View style={styles.filterRow}>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Unit (e.g. Unit 1)"
                            placeholderTextColor={theme.textSecondary}
                            value={unit}
                            onChangeText={setUnit}
                        />
                        <TextInput
                            style={{ ...styles.filterInput, flex: 2 }}
                            placeholder="Topic (e.g. Introduction)"
                            placeholderTextColor={theme.textSecondary}
                            value={topic}
                            onChangeText={setTopic}
                        />
                        <TouchableOpacity
                            style={[styles.filterInput, { alignItems: 'center', justifyContent: 'center', backgroundColor: difficulty === 'hard' ? '#fee2e2' : theme.card }]}
                            onPress={() => setDifficulty(d => d === 'easy' ? 'medium' : d === 'medium' ? 'hard' : 'easy')}
                        >
                            <Text style={{ fontSize: 12, fontWeight: '600', color: difficulty === 'hard' ? '#ef4444' : theme.text }}>{difficulty.toUpperCase()}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* File List Header */}
                <Text style={styles.sectionHeader}>Uploaded Files ({filteredFiles.length})</Text>

                {/* List */}
                <View style={styles.listContainer}>
                    {filteredFiles.map((file: any) => (
                        <FileCard
                            key={file.id}
                            file={file}
                            onEdit={(f) => handleSelectFile(f)}
                            onDelete={toggleHide}
                            theme={theme}
                        />
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}
