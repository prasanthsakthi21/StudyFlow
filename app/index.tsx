import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function Index() {
    const router = useRouter();
    const { theme } = useTheme();

    const features = [
        {
            icon: 'rocket-outline',
            title: 'Fast Revision',
            color: theme.primary,
            bg: theme.input
        },
        {
            icon: 'location-outline',
            title: 'On-the-Go Learning',
            color: '#F97316',
            bg: theme.input
        },
        {
            icon: 'person-outline',
            title: 'Personalized Tracking',
            color: '#8B5CF6',
            bg: theme.input
        },
        {
            icon: 'search-outline',
            title: 'Bookmark & Search',
            color: '#EC4899',
            bg: theme.input
        }
    ];

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        mainContent: {
            flex: 1,
            justifyContent: 'space-between',
        },
        header: {
            paddingHorizontal: 24,
            paddingTop: 20,
        },
        logoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        logoContainer: {
            backgroundColor: '#fff',
            padding: 12,
            borderRadius: 20,
            marginRight: 16,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 8,
        },
        logo: {
            width: 80,
            height: 80,
        },
        brandName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
            fontFamily: 'Outfit_700Bold',
        },
        contentContainer: {
            backgroundColor: theme.card,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            padding: 30,
            paddingBottom: 40,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: -4,
            },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 10,
        },
        textGroup: {
            alignItems: 'center',
            marginBottom: 30,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.text,
            textAlign: 'center',
            marginBottom: 10,
            fontFamily: 'Outfit_700Bold',
        },
        subtitle: {
            fontSize: 16,
            color: theme.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
            fontFamily: 'Outfit_400Regular',
            paddingHorizontal: 20,
        },
        gridContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: 30,
        },
        gridItem: {
            width: '48%',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            backgroundColor: theme.background,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border
        },
        iconContainer: {
            width: 36,
            height: 36,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
        },
        featureTitle: {
            flex: 1,
            fontSize: 13,
            fontWeight: '600',
            color: theme.text,
            fontFamily: 'Outfit_500Medium',
        },
        buttonContainer: {
            width: '100%',
            gap: 16,
        },
        primaryButton: {
            borderRadius: 16,
            overflow: 'hidden',
        },
        gradient: {
            paddingVertical: 18,
            alignItems: 'center',
        },
        primaryButtonText: {
            color: '#ffffff',
            fontSize: 18,
            fontWeight: 'bold',
            fontFamily: 'Outfit_700Bold',
        },
        secondaryButton: {
            paddingVertical: 18,
            alignItems: 'center',
            borderRadius: 16,
            backgroundColor: theme.input,
            borderWidth: 1,
            borderColor: theme.border,
        },
        secondaryButtonText: {
            color: theme.textSecondary,
            fontSize: 18,
            fontWeight: '600',
            fontFamily: 'Outfit_600SemiBold',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style={theme.statusBar} />
            <View style={styles.mainContent}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoRow}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../assets/images/transparent-logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.brandName}>Developed by Prasanth</Text>
                    </View>
                </View>

                {/* Hero Image Removed */}

                {/* Main Content */}
                <View style={styles.contentContainer}>
                    <View style={styles.textGroup}>
                        <Text style={styles.title}>Your Daily Dose of Knowledge</Text>
                        <Text style={styles.subtitle}>
                            Unlock your potential with micro-lessons designed for rapid learning.
                        </Text>
                    </View>

                    {/* Features Grid */}
                    <View style={styles.gridContainer}>
                        {features.map((item, index) => (
                            <View key={index} style={styles.gridItem}>
                                <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                                </View>
                                <Text style={styles.featureTitle}>{item.title}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push('/auth/register')}
                        >
                            <LinearGradient
                                colors={theme.gradient as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradient}
                            >
                                <Text style={styles.primaryButtonText}>Get Started</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ position: 'absolute', right: 20, top: 20 }} />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.push('/auth/login')}
                        >
                            <Text style={styles.secondaryButtonText}>I already have an account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
