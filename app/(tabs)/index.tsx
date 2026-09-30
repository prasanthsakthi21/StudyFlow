import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert, Image, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { API_URL } from '../../constants/Api';
import { useTheme } from '../../context/ThemeContext';
import i18n from '../../constants/i18n';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Analyzing...');
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [totalCredits, setTotalCredits] = useState(0);
  const [locale, setLocale] = useState(i18n.locale);
  const [lastRead, setLastRead] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // --- STYLES DEFINED HERE TO ACCESS THEME ---
  const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.background,
      width: '100%',
      maxWidth: 500,
      alignSelf: 'center',
    },
    container: {
      flex: 1,
    },
    headerBackground: {
      paddingTop: 60,
      paddingBottom: 30,
      paddingHorizontal: 24,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    headerContent: {
      flexDirection: 'column',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    logoContainer: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.card, // Use theme card color
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    headerAppName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
      fontFamily: 'Outfit_700Bold',
      letterSpacing: 0.5,
    },
    creditsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)'
    },
    creditsText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
      fontFamily: 'Outfit_600SemiBold',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    searchText: {
      color: '#94a3b8',
      fontSize: 15,
      fontFamily: 'Outfit_400Regular',
    },
    rightHeader: {
      flexDirection: 'row',
      gap: 12,
    },
    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      position: 'relative'
    },
    notificationBadge: {
      position: 'absolute',
      top: 10,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
      borderWidth: 1,
      borderColor: '#fff'
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'Outfit_800ExtraBold',
      color: '#fff',
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.9)',
      fontFamily: 'Outfit_500Medium',
    },
    contentContainer: {
      padding: 24,
      marginTop: -20,
    },
    continueCard: {
      marginBottom: 20,
      borderRadius: 20,
      overflow: 'hidden',
      elevation: 8,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    continueGradient: {
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card
    },
    continueLabel: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    continueTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: 'bold',
      letterSpacing: 0.3,
    },
    quizCard: {
      marginBottom: 24,
      borderRadius: 24,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    },
    quizGradient: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      borderRadius: 24,
    },
    quizTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 4,
    },
    quizSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
    },
    uploadSection: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 24,
      marginBottom: 32,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.border
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 18,
      backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : '#f0f9ff',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: 'dashed',
      marginBottom: 20,
    },
    uploadButtonText: {
      marginLeft: 12,
      fontSize: 16,
      color: theme.primary,
      fontWeight: '600',
    },
    videoInputContainer: {
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
    urlInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      fontFamily: 'Outfit_500Medium',
    },
    goButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
    },
    goButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    processingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
      marginBottom: 24,
    },
    processingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    processingText: {
      marginLeft: 10,
      color: theme.primary,
      fontWeight: '600',
    },
    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border
    },
    fileIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.input,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    fileDetails: {
      flex: 1,
    },
    fileName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    fileDate: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      opacity: 0.6,
    },
    emptyStateText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.textSecondary,
    },
    openButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
    },
    openButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary
    },
    menuOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    menuContainer: {
      position: 'absolute',
      top: 100, // Adjust based on header height
      right: 24,
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.border,
      minWidth: 180,
      zIndex: 1001,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    menuItemText: {
      fontSize: 16,
      marginLeft: 12,
      color: theme.text,
      fontWeight: '500',
    },

    actionButton: {
      flex: 1,
      height: 80,
      borderRadius: 16,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    actionButtonGradient: {
      flex: 1,
      padding: 8,
      justifyContent: 'space-between',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtonLabel: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 0,
    },
    actionButtonTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      letterSpacing: -0.2,
      lineHeight: 17,
    },
  });

  const loadLastRead = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('lastReadFile');
      if (jsonValue != null) {
        setLastRead(JSON.parse(jsonValue));
      }
    } catch (e) { console.error('Failed to load last read', e); }
  };

  // Combine initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('userToken');
        if (userStr) {
          const userData = JSON.parse(userStr);
          // Only set user if ID changed to avoid loops
          setUser((prev: any) => (prev?.id === userData.id ? prev : userData));
        }
      } catch (e) {
        console.error('Failed to load user', e);
      }
      loadLastRead();
    };
    loadUser();
  }, []);

  // One consolidated useFocusEffect
  useFocusEffect(
    useCallback(() => {
      setLocale(i18n.locale);
      loadLastRead();

      // Refresh data if user exists
      if (user?.id) {
        fetchUserFiles(user.id);
        fetchCredits(user.id);
      }
    }, [user?.id]) // Depend only on ID, not full object
  );

  const fetchUserFiles = useCallback(async (userId: number) => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/users/${userId}/files`);
      const data = await response.json();
      if (response.ok) {
        setUserFiles(data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch user files:', error);
    }
  }, []); // Stable function

  const fetchCredits = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/credits`, { method: 'POST', body: JSON.stringify({ credits: 0 }), headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (res.ok) setTotalCredits(data.totalCredits);
    } catch (e) {
      console.error(e);
    }
  }, []); // Stable function

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchUserFiles(user.id);
      await fetchCredits(user.id);
    }
    setRefreshing(false);
  }, [user]);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      const fileSizeInMB = file.size ? file.size / (1024 * 1024) : 0;

      if (fileSizeInMB > 30) {
        Alert.alert('File too large', 'Please upload a file smaller than 30MB.');
        return;
      }

      setUploadedFile(file);
      setIsProcessing(true);
      setProcessingMessage('Analyzing Document...');

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      let currentUserId = user?.id;
      if (!currentUserId) {
        try {
          const userStr = await AsyncStorage.getItem('userToken');
          if (userStr) currentUserId = JSON.parse(userStr).id;
        } catch (e) { }
      }
      formData.append('userId', currentUserId ? String(currentUserId) : '1');

      console.log('Sending file for Upload & Analysis...');
      const response = await fetch(`${API_URL}/upload-and-analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'Upload failed';
        try {
          const errJson = JSON.parse(errorText);
          errorMsg = errJson.details || errJson.error || errorText;
        } catch (e) { errorMsg = errorText; }
        throw new Error(`Server Error: ${response.status} - ${errorMsg}`);
      }

      const data = await response.json();
      console.log('Analysis Complete. File ID:', data.fileId);

      setIsProcessing(false);

      if (user?.id) fetchUserFiles(user.id);

      const newLastRead = {
        fileId: data.fileId,
        title: file.name,
        type: 'document',
        videoUrl: data.relatedVideoUrl,
        fileUrl: data.fileUrl
      };
      await AsyncStorage.setItem('lastReadFile', JSON.stringify(newLastRead));
      setLastRead(newLastRead);

      Alert.alert(
        'Success',
        'Micro-lessons generated successfully',
        [
          {
            text: 'View Lessons',
            onPress: () => {
              router.push({
                pathname: '/summary',
                params: {
                  fileId: data.fileId,
                  fileName: file.name,
                  title: file.name,
                  videoUrl: data.relatedVideoUrl,
                  fileUrl: data.fileUrl
                }
              });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Process Error Details:', error);
      let displayMessage = error.message;
      if (error.message.includes('Network request failed')) {
        displayMessage = `Could not reach server at ${API_URL}. \n\nPossible Causes:\n1. Server not running?\n2. Phone/PC not on same WiFi?\n3. Wrong IP in constants/Api.ts?`;
        Alert.alert('Network Connection Error', displayMessage);
      } else {
        Alert.alert('Process Error', `Details: ${displayMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVideoUrlSubmit = async () => {
    if (!videoUrl) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Fetching video info...');

    try {
      // 1. Fetch Video Metadata for Preview (Fast)
      try {
        const infoRes = await fetch(`${API_URL}/video-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: videoUrl })
        });
        if (infoRes.ok) {
          const info = await infoRes.json();
          setProcessingMessage(`Found: ${info.title}\n\nRunning Deep AI Analysis (fetching captions)...\nThis may take up to 60 seconds.`);
        } else {
          setProcessingMessage('Running Deep AI Analysis (fetching captions)...\nThis may take up to 60 seconds.');
        }
      } catch (e) {
        console.warn('Preview fetch failed:', e);
        setProcessingMessage('Analyzing Video Content...');
      }

      console.log('Sending video for analysis:', videoUrl);
      const response = await fetch(`${API_URL}/analyze-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoUrl,
          userId: user?.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (user?.id) fetchUserFiles(user.id);
        setVideoUrl('');

        const newLastRead = {
          fileId: data.fileId,
          title: data.original_name || 'Video Micro-Lesson',
          type: 'video_url',
          videoUrl: videoUrl
        };
        await AsyncStorage.setItem('lastReadFile', JSON.stringify(newLastRead));
        setLastRead(newLastRead);

        router.push({
          pathname: '/summary',
          params: {
            fileId: data.fileId,
            fileName: 'YouTube Video',
            title: data.original_name || 'Video Micro-Lesson',
            videoUrl: videoUrl
          }
        });
      } else {
        Alert.alert('Analysis Failed', data.error || 'Could not process video');
      }

    } catch (error: any) {
      console.error('Video Analysis Error:', error);
      let displayMessage = error.message;
      if (error.message.includes('Network request failed')) {
        displayMessage = `Could not reach server at ${API_URL}. \n\nPlease check:\n- Is the backend server running?\n- Is the IP ${API_URL} correct?\n- Are devices on the same WiFi?`;
        Alert.alert('Network Connection Error', displayMessage);
      } else {
        Alert.alert('Analysis Error', `Failed to process video.\n\nDebug Info: ${displayMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const openSummary = async (file: any) => {
    const currentLastRead = {
      fileId: file.id,
      title: file.original_name,
      type: file.file_type,
      videoUrl: file.file_type === 'video_url' ? file.file_url : undefined
    };
    await AsyncStorage.setItem('lastReadFile', JSON.stringify(currentLastRead));
    setLastRead(currentLastRead);

    router.push({
      pathname: '/summary',
      params: {
        fileId: file.id,
        fileName: file.original_name,
        title: file.original_name,
        videoUrl: file.file_type === 'video_url' ? file.file_url : undefined
      }
    });
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style={theme.statusBar} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <LinearGradient
          colors={theme.gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBackground}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.logoRow}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../../assets/images/transparent-logo.png')}
                    style={{ width: 32, height: 32, tintColor: theme.primary }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={styles.rightHeader}>
                <View style={styles.creditsContainer}>
                  <Ionicons name="star" size={14} color="#fbbf24" style={{ marginRight: 4 }} />
                  <Text style={styles.creditsText}>{totalCredits}</Text>
                </View>

                <TouchableOpacity style={styles.notificationButton} onPress={() => setMenuVisible(true)}>
                  <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.searchBar}
              activeOpacity={0.9}
              onPress={() => router.push('/search')}
            >
              <Ionicons name="search" size={20} color="#94a3b8" style={{ marginRight: 10 }} />
              <Text style={styles.searchText}>Search for quizzes, files...</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 10 }}>
              <Text style={styles.headerTitle}>{i18n.t('welcome')}</Text>
              <Text style={styles.headerSubtitle}>Ready to continue learning?</Text>
              <Text style={[styles.headerAppName, { fontSize: 14, marginTop: 8, opacity: 0.9 }]}>Developed by Prasanth Sakthi</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.contentContainer}>
          <View style={{ marginBottom: 24, gap: 16 }}>
            {/* Row 1 */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {/* Bookmark / Continue Learning Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (lastRead) {
                    openSummary({
                      id: lastRead.fileId,
                      original_name: lastRead.title,
                      file_type: lastRead.type,
                      file_url: lastRead.videoUrl
                    });
                  } else {
                    Alert.alert('No Bookmarks', 'You haven\'t started learning anything yet!');
                  }
                }}
              >
                <LinearGradient
                  colors={theme.type === 'dark' ? ['#0f172a', '#1e293b'] : ['#fff', '#f0f9ff']}
                  style={[styles.actionButtonGradient, { borderColor: theme.border }]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : '#e0f2fe' }]}>
                    <Ionicons name="bookmark" size={16} color={theme.primary} />
                  </View>
                  <View>
                    <Text style={[styles.actionButtonLabel, { color: theme.primary }]}>Continue</Text>
                    <Text style={[styles.actionButtonTitle, { color: theme.text }]} numberOfLines={2}>
                      {lastRead ? lastRead.title : 'Start Learning'}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Exam Prep Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/exam_prep')}
              >
                <LinearGradient
                  colors={theme.type === 'dark' ? ['#0f172a', '#1e293b'] : ['#fff', '#f0f9ff']}
                  style={[styles.actionButtonGradient, { borderColor: theme.border }]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : '#e0f2fe' }]}>
                    <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                  </View>
                  <View>
                    <Text style={[styles.actionButtonLabel, { color: theme.primary }]}>EXAM PREP</Text>
                    <Text style={[styles.actionButtonTitle, { color: theme.text }]}>Study Planner</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Row 2 */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {/* Career Advisor Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/career_path')}
              >
                <LinearGradient
                  colors={theme.type === 'dark' ? ['#0f172a', '#1e293b'] : ['#fff', '#f0f9ff']}
                  style={[styles.actionButtonGradient, { borderColor: theme.border }]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : '#e0f2fe' }]}>
                    <Ionicons name="briefcase-outline" size={16} color={theme.primary} />
                  </View>
                  <View>
                    <Text style={[styles.actionButtonLabel, { color: theme.primary }]}>CAREER</Text>
                    <Text style={[styles.actionButtonTitle, { color: theme.text }]}>Path Finder</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Coding Platform Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/coding' as any)}
              >
                <LinearGradient
                  colors={theme.type === 'dark' ? ['#0f172a', '#1e293b'] : ['#fff', '#f0f9ff']}
                  style={[styles.actionButtonGradient, { borderColor: theme.border }]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : '#e0f2fe' }]}>
                    <Ionicons name="code-slash-outline" size={16} color={theme.primary} />
                  </View>
                  <View>
                    <Text style={[styles.actionButtonLabel, { color: theme.primary }]}>PRACTICE</Text>
                    <Text style={[styles.actionButtonTitle, { color: theme.text }]}>Coding Arena</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Row 3 - Code Debugger */}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/code_debugger' as any)}
              >
                <LinearGradient
                  colors={theme.type === 'dark' ? ['#0f172a', '#1e293b'] : ['#fff', '#f0f9ff']}
                  style={[styles.actionButtonGradient, { borderColor: theme.border }]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : '#fee2e2' }]}>
                    <Ionicons name="bug-outline" size={16} color="#ef4444" />
                  </View>
                  <View>
                    <Text style={[styles.actionButtonLabel, { color: '#ef4444' }]}>DEBUG</Text>
                    <Text style={[styles.actionButtonTitle, { color: theme.text }]}>Error Analyzer</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Concept Graph Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/concept_graph' as any)}
              >
                <LinearGradient
                  colors={theme.type === 'dark' ? ['#0f172a', '#1e293b'] : ['#fff', '#f0f9ff']}
                  style={[styles.actionButtonGradient, { borderColor: theme.border }]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : '#dcfce7' }]}>
                    <Ionicons name="git-network-outline" size={16} color="#22c55e" />
                  </View>
                  <View>
                    <Text style={[styles.actionButtonLabel, { color: '#22c55e' }]}>ROADMAP</Text>
                    <Text style={[styles.actionButtonTitle, { color: theme.text }]}>Concept Graph</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Row 4 - Tools */}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
              {/* Code Converter Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/code_converter' as any)}
              >
                <LinearGradient
                  colors={theme.type === 'dark' ? ['#0f172a', '#1e293b'] : ['#fff', '#f0f9ff']}
                  style={[styles.actionButtonGradient, { borderColor: theme.border }]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : '#dbeafe' }]}>
                    <Ionicons name="swap-horizontal" size={16} color="#3b82f6" />
                  </View>
                  <View>
                    <Text style={[styles.actionButtonLabel, { color: '#3b82f6' }]}>CONVERT</Text>
                    <Text style={[styles.actionButtonTitle, { color: theme.text }]}>Code Translator</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Spacer for alignment if odd number of items */}
              <View style={{ flex: 1 }} />
            </View>

          </View>



          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>{i18n.t('upload')}</Text>
            <Text style={styles.sectionSubtitle}>Supported: PDF, PPT, Word (Max 30MB)</Text>

            <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
              <Ionicons name="cloud-upload-outline" size={24} color={theme.primary} />
              <Text style={styles.uploadButtonText}>
                {uploadedFile ? uploadedFile.name : 'Select Document / PPT'}
              </Text>
            </TouchableOpacity>

            <View style={styles.videoInputContainer}>
              <Ionicons name="link-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.urlInput}
                placeholder={i18n.t('pasteUrl')}
                placeholderTextColor={theme.textSecondary}
                value={videoUrl}
                onChangeText={setVideoUrl}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.goButton} onPress={handleVideoUrlSubmit}>
                <Text style={styles.goButtonText}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isProcessing && (
            <View style={styles.processingContainer}>
              <View style={styles.processingBadge}>
                <Ionicons name="sync" size={24} color={theme.primary} />
                <Text style={styles.processingText}>{processingMessage}</Text>
              </View>
            </View>
          )}

          <View style={{ marginBottom: 24 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Your Library</Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: theme.card,
                padding: 20,
                borderRadius: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
                borderWidth: 1,
                borderColor: theme.border
              }}
              onPress={() => router.push('/(tabs)/library')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: theme.type === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16
                }}>
                  <Ionicons name="library" size={24} color={theme.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>My Documents</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                    {userFiles.length} files saved
                  </Text>
                </View>
              </View>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.background,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Ionicons name="arrow-forward" size={20} color={theme.text} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView >
      {menuVisible && (
        <>
          <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)} activeOpacity={1} />
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              router.push('/profile');
            }}>
              <Ionicons name="person-outline" size={20} color={theme.text} />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); Alert.alert('Notifications', 'No new notifications'); }}>
              <Ionicons name="notifications-outline" size={20} color={theme.text} />
              <Text style={styles.menuItemText}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </>
      )
      }
    </View >
  );
}
