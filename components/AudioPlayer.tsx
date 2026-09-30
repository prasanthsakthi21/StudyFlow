import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AudioPlayerProps {
    audioUrl: string | null;
    title?: string;
    duration?: number; // Estimated duration in seconds
    onFinish?: () => void;
}

const speeds = [0.5, 1.0, 1.5, 2.0];

export default function AudioPlayer({ audioUrl, title, duration = 60, onFinish }: AudioPlayerProps) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [position, setPosition] = useState(0); // ms
    const [actualDuration, setActualDuration] = useState(duration * 1000); // ms
    const [speedIndex, setSpeedIndex] = useState(1); // 1.0x (index 1)

    // Ensure audio mode is set up
    useEffect(() => {
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    const loadAudio = async () => {
        if (!audioUrl) return;
        setIsLoading(true);

        try {
            // Offline Caching Logic
            const filename = audioUrl.split('/').pop()?.split('?')[0] || `audio-${Date.now()}.mp3`;
            const localUri = `${FileSystem.cacheDirectory}${filename}`;
            const fileInfo = await FileSystem.getInfoAsync(localUri);

            let sourceUri = audioUrl;

            if (fileInfo.exists) {
                console.log('Playing from cache:', localUri);
                sourceUri = localUri;
            } else {
                console.log('Downloading audio to cache...');
                const downloadRes = await FileSystem.downloadAsync(audioUrl, localUri);
                sourceUri = downloadRes.uri;
            }

            const { sound: newSound, status } = await Audio.Sound.createAsync(
                { uri: sourceUri },
                { shouldPlay: true, rate: speeds[speedIndex] },
                onPlaybackStatusUpdate
            );

            setSound(newSound);
            setIsPlaying(true);
        } catch (error) {
            console.error('Audio loading failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            if (status.durationMillis) setActualDuration(status.durationMillis);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish && onFinish) {
                onFinish();
            }
        }
    };

    const togglePlayPause = async () => {
        if (!sound) {
            loadAudio();
        } else {
            if (isPlaying) {
                await sound.pauseAsync();
            } else {
                await sound.playAsync();
            }
        }
    };

    const cycleSpeed = async () => {
        const nextIndex = (speedIndex + 1) % speeds.length;
        setSpeedIndex(nextIndex);
        if (sound) {
            await sound.setRateAsync(speeds[nextIndex], true);
        }
    };

    // Calculate progress width
    const progressPercent = Math.min((position / actualDuration) * 100, 100);

    return (
        <View style={styles.container}>
            {/* Minimalist Progress Bar Top */}
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.controlsRow}>
                {/* Play/Pause Button */}
                <TouchableOpacity
                    onPress={togglePlayPause}
                    style={styles.playButton}
                    disabled={!audioUrl && !sound}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#020617" size="small" />
                    ) : (
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={20}
                            color="#020617"
                            style={{ marginLeft: isPlaying ? 0 : 2 }}
                        />
                    )}
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title || "Audio Lesson"}
                    </Text>
                    <Text style={styles.timeText}>
                        {formatTime(position)} / {formatTime(actualDuration)}
                    </Text>
                </View>

                {/* Speed Control */}
                <TouchableOpacity onPress={cycleSpeed} style={styles.speedButton}>
                    <Text style={styles.speedText}>{speeds[speedIndex]}x</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)', // Semi-transparent card
        borderRadius: 16,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
        overflow: 'hidden',
    },
    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#38bdf8',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8, // Make room for progress bar
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#38bdf8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        elevation: 2,
        shadowColor: '#38bdf8',
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    infoContainer: {
        flex: 1,
    },
    title: {
        color: '#f8fafc',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    timeText: {
        color: '#94a3b8',
        fontSize: 12,
        fontVariant: ['tabular-nums'],
    },
    speedButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    speedText: {
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: '700',
    },
});
