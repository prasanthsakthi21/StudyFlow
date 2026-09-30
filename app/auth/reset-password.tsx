import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { API_URL } from '../../constants/Api';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const onResetPressed = async () => {
        if (!email || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setShowSuccessModal(true);
            } else {
                Alert.alert('Failed', data.error || 'Could not update password');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToLogin = () => {
        setShowSuccessModal(false);
        router.replace('/auth/login');
    };

    return (
        <View style={styles.mainContainer}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.background}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={{
                            backgroundColor: '#fff',
                            borderRadius: 12,
                            padding: 4,
                            marginRight: 12
                        }}>
                            <Image
                                source={require('../../assets/images/transparent-logo.png')}
                                style={{ width: 32, height: 32 }}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.title}>Reset Password</Text>
                            <Text style={styles.subtitle}>Enter your email and new password</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.form}>
                            <Text style={styles.label}>Email Address</Text>
                            <CustomInput
                                placeholder="student@example.com"
                                value={email}
                                onChangeText={setEmail}
                                icon="mail-outline"
                            />

                            <Text style={styles.label}>New Password</Text>
                            <CustomInput
                                placeholder="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!isPasswordVisible}
                                icon="lock-closed-outline"
                                isPassword={true}
                                isPasswordVisible={isPasswordVisible}
                                onTogglePasswordVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
                            />

                            <Text style={styles.label}>Confirm New Password</Text>
                            <CustomInput
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!isConfirmPasswordVisible}
                                icon="lock-closed-outline"
                                isPassword={true}
                                isPasswordVisible={isConfirmPasswordVisible}
                                onTogglePasswordVisibility={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                            />

                            <CustomButton
                                title={loading ? "Updating..." : "Reset Password"}
                                onPress={onResetPressed}
                                style={styles.signUpButton}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <View style={styles.successIconContainer}>
                            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                        </View>
                        <Text style={styles.modalTitle}>Success!</Text>
                        <Text style={styles.modalText}>Your password has been reset successfully.</Text>
                        <CustomButton
                            title="Back to Login"
                            onPress={handleGoToLogin}
                            style={styles.modalButton}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '100%',
    },
    container: {
        flex: 1,
    },
    scrollContainer: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 30,
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 6,
        marginLeft: 4,
        marginTop: 10,
    },
    signUpButton: {
        backgroundColor: '#6366f1',
        marginTop: 24
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        elevation: 10,
    },
    successIconContainer: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 30,
    },
    modalButton: {
        width: '100%',
        backgroundColor: '#10B981',
    },
});
