import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../context/ThemeContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function CNPrepScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const questions = [
        {
            id: 1,
            question: 'What is the OSI Model (7 Layers)?',
            answer: 'The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.',
            details: 'Mnemonic: Please Do Not Throw Sausage Pizza Away.'
        },
        {
            id: 2,
            question: 'TCP vs UDP?',
            answer: 'TCP is connection-oriented, reliable, and slower (Error checking). UDP is connectionless, unreliable, and faster (Streaming, Gaming).',
            details: 'TCP: 3-Way Handshake. UDP: Fire and forget.'
        },
        {
            id: 3,
            question: 'What is DNS?',
            answer: 'DNS (Domain Name System) translates human-readable domain names (google.com) into IP addresses (142.250.xxx.xxx).',
            details: 'Port 53. Uses UDP mostly.'
        },
        {
            id: 4,
            question: 'HTTP vs HTTPS?',
            answer: 'HTTP sends data in plaintext (Port 80). HTTPS uses SSL/TLS encryption for security (Port 443).',
            details: 'S stands for Secure.'
        },
        {
            id: 5,
            question: 'What happens when you type a URL?',
            answer: '1. DNS lookup 2. TCP Handshake 3. HTTP Request 4. Server Response 5. Browser Rendering.',
            details: 'Involves IP, MAC, Routing, ARP.'
        },
        {
            id: 6,
            question: 'What is DHCP?',
            answer: 'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses and other network configuration parameters to devices on a network.',
            details: 'Eliminates need for manual IP configuration.'
        },
        {
            id: 7,
            question: 'What is ARP?',
            answer: 'ARP (Address Resolution Protocol) maps an IP address (Logical) to a MAC address (Physical) in a local network.',
            details: 'ARP Request is broadcast, ARP Reply is unicast.'
        },
        {
            id: 8,
            question: 'What is a Firewall?',
            answer: 'A Firewall is a network security system that monitors and controls incoming and outgoing network traffic based on predetermined security rules.',
            details: 'Can be Hardware-based or Software-based.'
        },
        {
            id: 9,
            question: 'Difference between MAC and IP Address?',
            answer: 'MAC Address is a unique physical address assigned by the manufacturer (Permanent). IP Address is a logical address assigned by the network (Changeable).',
            details: 'MAC operates at Data Link Layer. IP operates at Network Layer.'
        },
        {
            id: 10,
            question: 'What is Subnet Mask?',
            answer: 'A Subnet Mask divides an IP address into two parts: the Network Address and the Host Address.',
            details: 'Example: 255.255.255.0 identifies the network portion of an IP.'
        }
    ];

    const toggleExpand = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        header: {
            paddingTop: 60,
            paddingHorizontal: 24,
            paddingBottom: 24,
            backgroundColor: theme.card,
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.text,
        },
        list: {
            padding: 24,
        },
        card: {
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
        },
        questionRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        questionText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
            flex: 1,
            marginRight: 16,
        },
        answerContainer: {
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        answerText: {
            fontSize: 14,
            color: theme.text,
            lineHeight: 22,
        },
        detailsContainer: {
            marginTop: 12,
            padding: 12,
            backgroundColor: theme.input,
            borderRadius: 8,
        },
        detailsText: {
            fontSize: 13,
            color: theme.textSecondary,
            fontFamily: 'monospace',
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Computer Networks</Text>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {questions.map((q) => (
                    <TouchableOpacity key={q.id} style={styles.card} onPress={() => toggleExpand(q.id)} activeOpacity={0.8}>
                        <View style={styles.questionRow}>
                            <Text style={styles.questionText}>{q.id}. {q.question}</Text>
                            <Ionicons name={expandedId === q.id ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                        </View>
                        {expandedId === q.id && (
                            <View style={styles.answerContainer}>
                                <Text style={styles.answerText}>{q.answer}</Text>
                                <View style={styles.detailsContainer}>
                                    <Text style={styles.detailsText}>{q.details}</Text>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}
