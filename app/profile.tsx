import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Modal, TextInput, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import CustomButton from '../components/CustomButton';
import StorageSettingsModal from '../components/StorageSettingsModal';
// import { useLanguage } from '../components/LanguageContext'; // Removed old context
import i18n from '../constants/i18n'; // Import new i18n
import { useTheme, THEMES } from '../context/ThemeContext'; // Import Theme Context
import { API_URL } from '../constants/Api';

// Define the User interface
interface User {
    id?: number;
    fullName?: string;
    name?: string; // Legacy support
    email?: string;
    role?: string;
    createdAt?: string;
    avatar?: string;
}

export default function ProfileScreen() {
    const router = useRouter();
    // const { language, setLanguage, t } = useLanguage();
    const { theme, setThemeName } = useTheme(); // Use Theme Hook

    const [user, setUser] = useState<User | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');

    const [storageStats, setStorageStats] = useState<any>(null);
    const [langModalVisible, setLangModalVisible] = useState(false);
    const [themeModalVisible, setThemeModalVisible] = useState(false); // Theme Modal Config
    const [storageModalVisible, setStorageModalVisible] = useState(false);
    const [locale, setLocale] = useState(i18n.locale); // Local state to trigger re-render

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (user?.id) loadStorageStats(user.id);
    }, [user]);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('userToken');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setEditName(parsedUser.fullName || parsedUser.name || '');
                setEditEmail(parsedUser.email || '');
            }
        } catch (error) {
            console.error('Failed to load user', error);
        }
    };

    const loadStorageStats = async (userId: number) => {
        try {
            const res = await fetch(`${API_URL}/users/${userId}/storage-stats`);
            const data = await res.json();
            if (res.ok) {
                setStorageStats(data);
            }
        } catch (e) {
            console.error('Storage stats error', e);
        }
    };

    const changeLanguage = (langCode: string) => {
        i18n.locale = langCode;
        setLocale(langCode); // Force re-render
        // Persist ??
        AsyncStorage.setItem('userLanguage', langCode);
        setLangModalVisible(false);
    };

    const changeTheme = (themeName: string) => {
        setThemeName(themeName);
        setThemeModalVisible(false);
    };

    const onLogoutPressed = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            router.replace('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to log out');
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && user?.id) {
            const newAvatarUri = result.assets[0].uri;

            // Upload to Backend
            try {
                const formData = new FormData();
                formData.append('avatar', {
                    uri: newAvatarUri,
                    name: 'avatar.jpg',
                    type: 'image/jpeg'
                } as any);

                const res = await fetch(`${API_URL}/users/${user.id}/profile`, {
                    method: 'PUT',
                    body: formData,
                });

                const data = await res.json();
                if (res.ok) {
                    // Update Local State with Cloudinary URL
                    const updatedUser = { ...user, avatar: data.user.avatar };
                    await updateUser(updatedUser);
                    Alert.alert('Success', 'Profile picture updated!');
                } else {
                    Alert.alert('Error', data.error || 'Failed to update avatar');
                }
            } catch (error) {
                console.error('Avatar upload error:', error);
                Alert.alert('Error', 'Failed to upload image');
            }
        }
    };

    const saveProfile = async () => {
        if (!user?.id) return;

        try {
            const res = await fetch(`${API_URL}/users/${user.id}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: editName })
            });
            const data = await res.json();

            if (res.ok) {
                const updatedUser = {
                    ...user,
                    fullName: editName,
                    email: editEmail // Email edit not supported on backend yet, but keeping local
                };
                await updateUser(updatedUser);
                setModalVisible(false);
                Alert.alert('Success', 'Profile updated successfully');
            } else {
                Alert.alert('Error', data.error || 'Failed to update profile');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save profile');
        }
    };

    const updateUser = async (newUser: any) => {
        setUser(newUser);
        await AsyncStorage.setItem('userToken', JSON.stringify(newUser));
        setEditName(newUser.fullName || newUser.name || '');
        setEditEmail(newUser.email || '');
    };

    const getDisplayName = () => user?.fullName || user?.name || (user?.role === 'admin' ? 'Administrator' : 'User Name');
    const getDisplayEmail = () => user?.email || 'Set your email';

    // ... inside ProfileScreen component ...

    const styles = StyleSheet.create({
        mainContainer: {
            flex: 1,
            backgroundColor: theme.background,
        },
        background: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '100%',
        },
        scrollContainer: {
            padding: 24,
            paddingTop: 80,
            paddingBottom: 40,
        },
        header: {
            alignItems: 'center',
            marginBottom: 32,
        },
        avatarContainer: {
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 10,
            position: 'relative',
        },
        avatarPlaceholder: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: theme.card,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.1)',
        },
        avatarImage: {
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 4,
            borderColor: theme.card,
        },
        avatarText: {
            fontSize: 52,
            fontWeight: '800',
            color: theme.primary,
        },
        editIconBadge: {
            position: 'absolute',
            bottom: 4,
            right: 4,
            backgroundColor: theme.primary,
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: theme.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        name: {
            fontSize: 28,
            fontWeight: '900',
            color: theme.text, // Dynamic Text
            marginBottom: 6,
            letterSpacing: 0.5,
            textAlign: 'center',
            paddingHorizontal: 20
        },
        email: {
            fontSize: 15,
            color: theme.textSecondary, // Dynamic Secondary
            marginBottom: 24,
            fontWeight: '500',
            textAlign: 'center',
            paddingHorizontal: 20
        },
        editProfileButton: {
            backgroundColor: theme.card,
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        editProfileText: {
            color: theme.text,
            fontWeight: '700',
            fontSize: 15,
        },
        card: {
            backgroundColor: theme.card, // Dynamic Card
            borderRadius: 32,
            padding: 28,
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: theme.border
        },
        infoSection: {
            marginBottom: 32,
        },
        sectionTitle: {
            fontSize: 22,
            fontWeight: '800',
            color: theme.text,
            marginBottom: 20,
            letterSpacing: 0.5,
        },
        infoRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        infoLabel: {
            color: theme.textSecondary,
            fontSize: 16,
            fontWeight: '500',
        },
        infoValue: {
            color: theme.text,
            fontWeight: '700',
            fontSize: 16,
        },
        logoutButton: {
            marginTop: 12,
            backgroundColor: '#EF4444',
            borderRadius: 16,
            paddingVertical: 14,
            shadowColor: "#EF4444",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
        },
        modalContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
        },
        modalContent: {
            width: '90%',
            backgroundColor: theme.card,
            borderRadius: 28,
            padding: 32,
            elevation: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            borderWidth: 1,
            borderColor: theme.border
        },
        modalTitle: {
            fontSize: 24,
            fontWeight: '800',
            marginBottom: 24,
            color: theme.text,
            textAlign: 'center',
        },
        label: {
            fontSize: 15,
            fontWeight: '700',
            color: theme.textSecondary,
            marginBottom: 8,
            marginTop: 16,
        },
        input: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 16,
            padding: 16,
            fontSize: 16,
            color: theme.text,
            backgroundColor: theme.input,
            fontWeight: '500',
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 32,
            gap: 16,
        },
        modalButton: {
            flex: 1,
            padding: 16,
            borderRadius: 16,
            alignItems: 'center',
        },
        cancelButton: {
            backgroundColor: theme.input,
            borderWidth: 1,
            borderColor: theme.border,
        },
        saveButton: {
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
        },
        cancelButtonText: {
            color: theme.textSecondary,
            fontWeight: '700',
            fontSize: 16,
        },
        saveButtonText: {
            color: '#ffffff',
            fontWeight: '700',
            fontSize: 16,
        },
        settingRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        }
    });

    return (
        <View style={styles.mainContainer}>
            <StatusBar style={theme.statusBar} />
            <LinearGradient
                colors={theme.gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.background}
            />
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {getDisplayName().charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.editIconBadge}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{getDisplayName()}</Text>
                    <Text style={styles.email}>{getDisplayEmail()}</Text>

                    <TouchableOpacity style={styles.editProfileButton} onPress={() => setModalVisible(true)}>
                        <Text style={styles.editProfileText}>{i18n.t('edit_profile')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>{i18n.t('account_info')}</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{i18n.t('full_name')}</Text>
                            <Text style={styles.infoValue}>{getDisplayName()}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{i18n.t('email')}</Text>
                            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right', flexWrap: 'wrap' }]}>
                                {user?.email || <Text style={{ color: theme.textSecondary }}>Missing</Text>}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{i18n.t('role')}</Text>
                            <Text style={styles.infoValue}>
                                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : (user?.email?.includes('admin') ? 'Admin' : 'User')}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{i18n.t('joined')}</Text>
                            <Text style={styles.infoValue}>
                                {user?.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                                    : 'Dec 2025'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>{i18n.t('settings')}</Text>

                        <TouchableOpacity style={styles.settingRow} onPress={() => setStorageModalVisible(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Ionicons name="server" size={20} color={theme.primary} />
                                <View>
                                    <Text style={styles.infoLabel}>Manage Storage</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                        {storageStats ? `${storageStats.usedMB} ${i18n.t('used')} MB` : i18n.t('view_breakdown')}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {/* THEME SELECTION ROW */}
                        <TouchableOpacity style={styles.settingRow} onPress={() => setThemeModalVisible(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Ionicons name="color-palette" size={20} color={theme.primary} />
                                <Text style={styles.infoLabel}>App Theme</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.infoValue}>{theme.name}</Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingRow} onPress={() => setLangModalVisible(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Ionicons name="language" size={20} color={theme.textSecondary} />
                                <Text style={styles.infoLabel}>{i18n.t('app_language')}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.infoValue}>{locale.toUpperCase()}</Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <CustomButton
                        title={i18n.t('log_out')}
                        onPress={onLogoutPressed}
                        type="PRIMARY"
                        style={styles.logoutButton}
                    />
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{i18n.t('edit_profile')}</Text>

                        <Text style={styles.label}>{i18n.t('full_name')}</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter full name"
                            placeholderTextColor={theme.textSecondary}
                        />

                        <Text style={styles.label}>{i18n.t('email')}</Text>
                        <TextInput
                            style={styles.input}
                            value={editEmail}
                            onChangeText={setEditEmail}
                            placeholder="Enter email"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveProfile}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* THEME SELECTION MODAL */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={themeModalVisible}
                onRequestClose={() => setThemeModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <Text style={styles.modalTitle}>Choose Theme</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {Object.entries(THEMES).map(([key, themeItem]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.settingRow, { borderBottomWidth: 1, borderColor: theme.border, paddingVertical: 16 }]}
                                    onPress={() => changeTheme(key)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        {/* Color Preview Dot */}
                                        <LinearGradient
                                            colors={themeItem.gradient as any}
                                            style={{ width: 24, height: 24, borderRadius: 12 }}
                                        />
                                        <Text style={[styles.infoValue, { color: theme.name === themeItem.name ? theme.primary : theme.textSecondary }]}>
                                            {themeItem.name}
                                        </Text>
                                    </View>
                                    {theme.name === themeItem.name && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton, { marginTop: 20 }]} onPress={() => setThemeModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={langModalVisible}
                onRequestClose={() => setLangModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{i18n.t('app_language')}</Text>
                        {[
                            { code: 'en', label: 'English' },
                            { code: 'ta', label: 'Tamil (தமிழ்)' },
                        ].map((langItem) => (
                            <TouchableOpacity
                                key={langItem.code}
                                style={[styles.settingRow, { borderBottomWidth: 1, borderColor: theme.border, paddingVertical: 16 }]}
                                onPress={() => changeLanguage(langItem.code)}
                            >
                                <Text style={[styles.infoValue, { color: locale === langItem.code ? theme.primary : theme.textSecondary }]}>{langItem.label}</Text>
                                {locale === langItem.code && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton, { marginTop: 20 }]} onPress={() => setLangModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <StorageSettingsModal
                visible={storageModalVisible}
                onClose={() => setStorageModalVisible(false)}
                stats={storageStats}
            />
        </View>
    );
}
