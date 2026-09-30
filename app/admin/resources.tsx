import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { API_URL } from '../../constants/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UploadResources() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    const pickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword'],
            copyToCacheDirectory: true,
        });

        if (!result.canceled) {
            setFile(result.assets[0]);
        }
    };

    const handleUpload = async () => {
        if (!title || !subject || !file) {
            Alert.alert('Missing Fields', 'Please fill in title, subject and select a file.');
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
            formData.append('title', title);
            formData.append('subject', subject);
            formData.append('description', description);
            formData.append('adminId', user.id || '1');

            const response = await fetch(`${API_URL}/admin/upload-resource`, {
                method: 'POST',
                headers: { 'Content-Type': 'multipart/form-data' },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Resource uploaded successfully');
                router.back();
            } else {
                Alert.alert('Error', data.error || 'Upload failed');
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Network error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Upload Resource</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Operating Systems Unit 1"
                    placeholderTextColor="#64748b"
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Subject</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Computer Science"
                    placeholderTextColor="#64748b"
                    value={subject}
                    onChangeText={setSubject}
                />

                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Brief description of the content..."
                    placeholderTextColor="#64748b"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                <Text style={styles.label}>File Attachment</Text>
                <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
                    <Ionicons name={file ? "document-text" : "cloud-upload"} size={24} color="#38bdf8" />
                    <Text style={styles.fileButtonText}>{file ? file.name : "Select Document / PPT"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitButton, uploading && styles.disabledButton]}
                    onPress={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#0f172a" />
                    ) : (
                        <Text style={styles.submitButtonText}>Upload Resource</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
    form: {
        padding: 24,
    },
    label: {
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        padding: 16,
        color: '#f8fafc',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        borderWidth: 2,
        borderColor: '#334155',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 24,
        gap: 12,
    },
    fileButtonText: {
        color: '#38bdf8',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#38bdf8',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 40,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#0f172a',
        fontWeight: '800',
        fontSize: 16,
    }
});
