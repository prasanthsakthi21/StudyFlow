import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity, Modal, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_URL } from '../../constants/Api';
import { useTheme } from '../../context/ThemeContext'; // Import Theme Context
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
    const router = useRouter();
    const { theme } = useTheme(); // Use Theme
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [showRolePicker, setShowRolePicker] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
        iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
        webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    });

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            fetchUserInfo(authentication?.accessToken);
        }
    }, [response]);

    const fetchUserInfo = async (token: string | undefined) => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const user = await res.json();

            // Send to our Backend
            await handleBackendGoogleLogin({
                email: user.email,
                name: user.name,
                googleId: user.id,
                avatar: user.picture
            });

        } catch (error) {
            console.error('Google User Info Error:', error);
            Alert.alert('Error', 'Failed to fetch Google User Info');
            setLoading(false);
        }
    };

    const handleBackendGoogleLogin = async (googleUser: any) => {
        try {
            const response = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(googleUser),
            });

            const data = await response.json();

            if (response.ok) {
                await import('@react-native-async-storage/async-storage').then(module =>
                    module.default.setItem('userToken', JSON.stringify(data.user))
                );

                const role = (data.user.role || '').toLowerCase().trim();

                if (role === 'admin' || role === 'teacher') {
                    router.replace('/admin/(tabs)');
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                Alert.alert('Google Sign-Up Failed', data.error);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to connect to StudyFlow server');
        } finally {
            setLoading(false);
        }
    };

    const onRegisterPressed = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (!agreeToTerms) {
            Alert.alert('Error', 'You must agree to the Terms and Privacy Policy');
            return;
        }

        setLoading(true);
        try {
            console.log('Sending register request to:', `${API_URL}/register`);
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password, role }),
            });

            console.log('Register Response Status:', response.status);
            const data = await response.json();
            console.log('Register Response Data:', data);

            if (response.ok) {
                setShowSuccessModal(true);
            } else {
                Alert.alert('Registration Failed', `Server says: ${data.error || 'Unknown error'}\nStatus: ${response.status}`);
            }
        } catch (error: any) {
            console.error('Register error:', error);

            let displayMessage = error.message;
            if (error.message.includes('Network request failed')) {
                displayMessage = `Could not reach server at ${API_URL}.\n\nPossible Causes:\n1. Server not running?\n2. Phone/PC not on same WiFi?\n3. Wrong IP in Constants?`;
                Alert.alert('Network Connection Error', displayMessage);
            } else {
                Alert.alert('Registration Error', `Failed to register. ${displayMessage}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const onSignInPressed = () => {
        router.push('/auth/login');
    };

    const handleGoToLogin = () => {
        setShowSuccessModal(false);
        router.replace('/auth/login');
    };

    const styles = StyleSheet.create({
        mainContainer: {
            flex: 1,
            width: '100%',
            maxWidth: 600,
            alignSelf: 'center',
            backgroundColor: theme.background,
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
            padding: 24,
            paddingTop: 60,
        },
        header: {
            marginBottom: 32,
            flexDirection: 'row',
            alignItems: 'center',
        },
        backButton: {
            padding: 8,
            marginRight: 16,
            backgroundColor: theme.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
        },
        headerTextContainer: {
            flex: 1,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 4,
            fontFamily: 'Outfit_700Bold',
        },
        subtitle: {
            fontSize: 14,
            color: theme.textSecondary,
            fontFamily: 'Outfit_400Regular',
        },
        card: {
            backgroundColor: 'transparent',
            marginBottom: 30,
        },
        form: {
            width: '100%',
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.text,
            marginBottom: 8,
            marginLeft: 4,
            marginTop: 16,
            fontFamily: 'Outfit_500Medium',
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.input,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: 16,
            height: 56,
        },
        input: {
            flex: 1,
            height: '100%',
            color: theme.text,
            fontSize: 16,
            fontFamily: 'Outfit_400Regular',
        },
        inputIcon: {
            marginRight: 12,
        },
        eyeButton: {
            padding: 8,
        },
        dropdown: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 16,
            padding: 16,
            backgroundColor: theme.input,
            height: 56,
        },
        dropdownText: {
            fontSize: 16,
            color: theme.text,
            fontFamily: 'Outfit_400Regular',
        },
        dropdownList: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 16,
            marginTop: 8,
            backgroundColor: theme.card,
            overflow: 'hidden',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4,
        },
        dropdownItem: {
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        dropdownItemText: {
            color: theme.text,
            fontSize: 16,
            fontFamily: 'Outfit_500Medium',
        },
        checkboxContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginVertical: 24,
            paddingHorizontal: 4,
        },
        checkboxText: {
            marginLeft: 12,
            color: theme.textSecondary,
            flex: 1,
            fontSize: 14,
            lineHeight: 20,
            fontFamily: 'Outfit_400Regular',
        },
        link: {
            color: theme.primary,
            fontWeight: '600',
            fontFamily: 'Outfit_600SemiBold',
        },
        signUpButton: {
            backgroundColor: theme.primary,
            borderRadius: 16,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
            marginTop: 8,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 32,
            alignItems: 'center',
        },
        footerText: {
            color: theme.textSecondary,
            fontSize: 14,
            fontFamily: 'Outfit_400Regular',
        },
        loginText: {
            color: theme.primary,
            fontWeight: 'bold',
            marginLeft: 4,
            fontSize: 14,
            fontFamily: 'Outfit_700Bold',
        },
        modalBackground: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContainer: {
            width: '85%',
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            elevation: 10,
            borderWidth: 1,
            borderColor: theme.border,
        },
        successIconContainer: {
            marginBottom: 24,
            backgroundColor: theme.background,
            borderRadius: 50,
            padding: 4,
        },
        modalTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 12,
            fontFamily: 'Outfit_700Bold',
        },
        modalText: {
            fontSize: 16,
            color: theme.textSecondary,
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 24,
            fontFamily: 'Outfit_400Regular',
        },
        modalButton: {
            width: '100%',
            borderRadius: 16,
            backgroundColor: theme.primary,
        },
        separator: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 32,
        },
        line: {
            flex: 1,
            height: 1,
            backgroundColor: theme.border,
        },
        orText: {
            marginHorizontal: 16,
            color: theme.textSecondary,
            fontSize: 14,
            fontWeight: '600',
            fontFamily: 'Outfit_500Medium',
        },
        socialButtons: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
        },
        socialButton: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.card,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2
        },
        socialIconPlaceholder: {
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%'
        },
        socialButtonText: {
            fontSize: 24,
            fontWeight: 'bold',
            fontFamily: 'Outfit_700Bold',
        },
        gradientButton: {
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        buttonText: {
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: 'bold',
            fontFamily: 'Outfit_700Bold',
        }
    });

    return (
        <View style={styles.mainContainer}>
            <StatusBar style={theme.statusBar} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onSignInPressed} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </TouchableOpacity>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join StudyFlow today!</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.form}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={theme.textSecondary}
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>

                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="student@example.com"
                                    placeholderTextColor={theme.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="At least 8 characters"
                                    placeholderTextColor={theme.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity
                                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                    style={styles.eyeButton}
                                >
                                    <Ionicons
                                        name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color={theme.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Re-enter your password"
                                    placeholderTextColor={theme.textSecondary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!isConfirmPasswordVisible}
                                />
                                <TouchableOpacity
                                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                    style={styles.eyeButton}
                                >
                                    <Ionicons
                                        name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color={theme.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>I am a</Text>
                            <TouchableOpacity style={styles.dropdown} onPress={() => setShowRolePicker(!showRolePicker)}>
                                <Text style={styles.dropdownText}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                            {showRolePicker && (
                                <View style={styles.dropdownList}>
                                    <TouchableOpacity style={styles.dropdownItem} onPress={() => { setRole('student'); setShowRolePicker(false); }}>
                                        <Text style={styles.dropdownItemText}>Student</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.dropdownItem, { borderBottomWidth: 0 }]} onPress={() => { setRole('teacher'); setShowRolePicker(false); }}>
                                        <Text style={styles.dropdownItemText}>Teacher</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.checkboxContainer}>
                                <TouchableOpacity onPress={() => setAgreeToTerms(!agreeToTerms)}>
                                    <Ionicons name={agreeToTerms ? "checkbox" : "square-outline"} size={24} color={theme.primary} />
                                </TouchableOpacity>
                                <Text style={styles.checkboxText}>
                                    I agree to the StudyFlow <Text style={styles.link}>Terms</Text> and <Text style={styles.link}>Privacy Policy</Text>
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.signUpButton}
                                onPress={onRegisterPressed}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={theme.gradient as any}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.buttonText}>{loading ? "Creating Account..." : "Sign Up"}</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.separator}>
                                <View style={styles.line} />
                                <Text style={styles.orText}>OR</Text>
                                <View style={styles.line} />
                            </View>

                            <View style={styles.socialButtons}>
                                <TouchableOpacity style={styles.socialButton} onPress={() => {
                                    Alert.alert(
                                        'Google Sign-In',
                                        'Use Mock Login for testing?',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Mock Login',
                                                onPress: () => handleBackendGoogleLogin({
                                                    email: "demo.google@studyflow.com",
                                                    name: "Demo Google User",
                                                    googleId: "mock_goog_789",
                                                    avatar: "https://ui-avatars.com/api/?name=Demo+User&background=DB4437&color=fff"
                                                })
                                            },
                                            { text: 'Try Real', onPress: () => promptAsync() }
                                        ]
                                    );
                                }}>
                                    <View style={styles.socialIconPlaceholder}>
                                        <Image
                                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }}
                                            style={{ width: 24, height: 24 }}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <TouchableOpacity onPress={onSignInPressed}>
                                    <Text style={styles.loginText}>Log In</Text>
                                </TouchableOpacity>
                            </View>
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
                        <Text style={styles.modalText}>Your account has been created successfully.</Text>
                        <TouchableOpacity style={styles.signUpButton} onPress={handleGoToLogin}>
                            <LinearGradient
                                colors={theme.gradient as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.buttonText}>Go to Login</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
