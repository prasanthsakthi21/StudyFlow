import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/Api';
import { useTheme } from '../../context/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
                await AsyncStorage.setItem('userToken', JSON.stringify(data.user));
                const role = (data.user.role || '').toLowerCase().trim();
                if (role === 'admin' || role === 'teacher') {
                    router.replace('/admin/(tabs)');
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                Alert.alert('Login Failed', data.error);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to connect to StudyFlow server');
        } finally {
            setLoading(false);
        }
    };

    const onSignInPressed = async () => {
        if (!email || !password) {
            setErrorMessage('Please fill in all fields');
            return;
        }
        setErrorMessage('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: activeTab }),
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem('userToken', JSON.stringify(data.user));
                if (activeTab === 'teacher') {
                    router.replace('/admin/(tabs)');
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                setErrorMessage(data.error || 'Invalid credentials');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            let displayMessage = 'Network error. Please try again.';
            if (error.message && error.message.includes('Network request failed')) {
                displayMessage = `Could not reach server at ${API_URL}.\n\nMake sure:\n1. Server is running (npm start)\n2. Phone & PC are on SAME WiFi\n3. Windows Firewall is not blocking Node.js`;
                Alert.alert('Connection Error', displayMessage);
            }
            setErrorMessage(displayMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- STYLES DEFINED HERE TO ACCESS THEME ---
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        scrollContent: {
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
        },
        headerContainer: {
            alignItems: 'center',
            marginBottom: 40,
        },
        logoBox: {
            width: 100,
            height: 100,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            backgroundColor: theme.primary,
            borderRadius: 30,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
        },
        logo: {
            width: 60,
            height: 60,
        },
        title: {
            fontSize: 32,
            fontWeight: 'bold',
            color: theme.text,
            textAlign: 'center',
            marginBottom: 8,
            fontFamily: 'Outfit_700Bold',
        },
        subtitle: {
            fontSize: 16,
            color: theme.textSecondary,
            textAlign: 'center',
            fontFamily: 'Outfit_400Regular',
        },
        tabContainer: {
            flexDirection: 'row',
            backgroundColor: theme.input,
            borderRadius: 16,
            padding: 4,
            marginBottom: 32,
            borderWidth: 1,
            borderColor: theme.border
        },
        tab: {
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderRadius: 12,
        },
        activeTab: {
            backgroundColor: theme.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        tabText: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.textSecondary,
            fontFamily: 'Outfit_600SemiBold',
        },
        activeTabText: {
            color: theme.primary,
            fontWeight: 'bold',
        },
        formContainer: {
            marginBottom: 24,
        },
        inputGroup: {
            marginBottom: 20,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.text,
            marginBottom: 8,
            marginLeft: 4,
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
        inputIcon: {
            marginRight: 12,
        },
        input: {
            flex: 1,
            height: '100%',
            color: theme.text,
            fontSize: 16,
            fontFamily: 'Outfit_400Regular',
        },
        eyeButton: {
            padding: 8,
        },
        loginButton: {
            borderRadius: 16,
            overflow: 'hidden',
            marginTop: 8,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        gradientButton: {
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        loginButtonText: {
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: 'bold',
            fontFamily: 'Outfit_700Bold',
        },
        forgotPassword: {
            alignSelf: 'flex-end',
            marginBottom: 24,
        },
        forgotPasswordText: {
            color: theme.primary,
            fontSize: 14,
            fontWeight: '600',
            fontFamily: 'Outfit_500Medium',
        },
        dividerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
        },
        divider: {
            flex: 1,
            height: 1,
            backgroundColor: theme.border,
        },
        dividerText: {
            marginHorizontal: 16,
            color: theme.textSecondary,
            fontSize: 14,
            fontFamily: 'Outfit_500Medium',
        },
        socialButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 16,
            paddingVertical: 16,
            marginBottom: 24,
        },
        socialIcon: {
            width: 24,
            height: 24,
            marginRight: 12,
        },
        socialButtonText: {
            color: theme.text,
            fontSize: 16,
            fontWeight: '600',
            fontFamily: 'Outfit_600SemiBold',
        },
        registerContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        registerText: {
            color: theme.textSecondary,
            fontSize: 14,
            fontFamily: 'Outfit_400Regular',
        },
        registerLink: {
            color: theme.primary,
            fontSize: 14,
            fontWeight: 'bold',
            marginLeft: 4,
            fontFamily: 'Outfit_700Bold',
        },
        errorText: {
            color: '#EF4444',
            textAlign: 'center',
            marginBottom: 16,
            fontFamily: 'Outfit_500Medium',
        }
    });

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style={theme.statusBar} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <View style={styles.logoBox}>
                        <Image
                            source={require('../../assets/images/transparent-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Sign in to continue your learning journey</Text>
                </View>

                {/* Role Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'student' && styles.activeTab]}
                        onPress={() => setActiveTab('student')}
                    >
                        <Text style={[styles.tabText, activeTab === 'student' && styles.activeTabText]}>Student</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'teacher' && styles.activeTab]}
                        onPress={() => setActiveTab('teacher')}
                    >
                        <Text style={[styles.tabText, activeTab === 'teacher' && styles.activeTabText]}>Teacher</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={theme.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
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
                    </View>

                    <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/auth/reset-password')}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={onSignInPressed}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={theme.gradient as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.loginButtonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>Or continue with</Text>
                    <View style={styles.divider} />
                </View>

                {/* Google Login */}
                <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => promptAsync()}
                >
                    <Image
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }}
                        style={styles.socialIcon}
                    />
                    <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                {/* Register Link */}
                <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => router.push('/auth/register')}>
                        <Text style={styles.registerLink}>Sign Up</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}
