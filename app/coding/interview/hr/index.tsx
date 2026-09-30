import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function HRPrepScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = [
        'All',
        'Introduction',
        'Career Goals',
        'Behavioral',
        'Weakness',
        'Company Fit'
    ];

    const hrQuestions = [
        {
            id: 1,
            category: 'Introduction',
            question: 'Tell me about yourself.',
            answer: "I’m an MCA graduate with a strong interest in software development. I have hands-on experience in building web and mobile applications using technologies like Java, React Native, and MySQL. I enjoy learning new technologies and solving real-world problems through coding."
        },
        {
            id: 2,
            category: 'Introduction',
            question: 'Why should we hire you?',
            answer: "I have a strong learning mindset, good technical fundamentals, and hands-on project experience. I adapt quickly, work well in teams, and I’m motivated to contribute positively to the organization while continuously improving my skills."
        },
        {
            id: 3,
            category: 'Weakness',
            question: 'What are your weaknesses?',
            answer: "I sometimes spend extra time perfecting my work, but I’m learning to manage time better by prioritizing tasks effectively."
        },
        {
            id: 4,
            category: 'Career Goals',
            question: 'Where do you see yourself in 5 years?',
            answer: "In five years, I see myself as a skilled software professional contributing to complex projects, taking more responsibility, and continuously learning new technologies."
        },
        {
            id: 5,
            category: 'Company Fit',
            question: 'Why do you want to work in our company?',
            answer: "Your company has a strong reputation for innovation and learning. I believe this environment will help me grow professionally while allowing me to contribute my skills effectively."
        },
        {
            id: 6,
            category: 'Behavioral',
            question: 'How do you handle pressure?',
            answer: "I stay calm, break tasks into smaller steps, and focus on completing one task at a time. This helps me manage pressure effectively."
        },
        {
            id: 7,
            category: 'Behavioral',
            question: 'Describe a challenging situation and how you handled it.',
            answer: "During a project deadline, I faced integration issues. I analyzed the problem, collaborated with teammates, and resolved it by optimizing the code and managing time better."
        },
        {
            id: 8,
            category: 'Company Fit',
            question: 'Are you willing to relocate?',
            answer: "Yes, I’m open to relocation as it gives me exposure to new environments and opportunities to grow."
        },
        {
            id: 9,
            category: 'Career Goals',
            question: 'Why did you choose MCA?',
            answer: "I chose MCA to gain strong technical and practical knowledge in software development and to build a long-term career in the IT industry."
        },
        {
            id: 10,
            category: 'Weakness',
            question: 'Why is your percentage low?',
            answer: "I focused more on skill development and practical learning, and I’ve significantly improved my performance over time."
        }
    ];

    const filteredQuestions = hrQuestions.filter(q =>
        (activeCategory === 'All' || q.category === activeCategory) &&
        q.question.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            paddingBottom: 20,
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 8,
        },
        searchContainer: {
            backgroundColor: theme.input,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        searchInput: {
            flex: 1,
            color: theme.text,
            marginLeft: 12,
            fontSize: 16,
        },
        categoryScroll: {
            paddingHorizontal: 24,
            marginBottom: 16,
        },
        categoryChip: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            marginRight: 10,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
        },
        activeChip: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        categoryText: {
            fontSize: 14,
            color: theme.textSecondary,
            fontWeight: '600',
        },
        activeCategoryText: {
            color: '#fff',
        },
        list: {
            padding: 24,
            paddingTop: 0,
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
            lineHeight: 24,
        },
        answerContainer: {
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        answerText: {
            fontSize: 15,
            color: theme.text,
            lineHeight: 24,
            opacity: 0.9,
        },
        badge: {
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            marginBottom: 8,
        },
        badgeText: {
            fontSize: 10,
            color: theme.primary,
            fontWeight: 'bold',
            textTransform: 'uppercase',
        },
        tipBox: {
            marginTop: 24,
            padding: 16,
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#eab308',
            marginHorizontal: 24,
            marginBottom: 24,
        },
        tipTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#ca8a04',
            marginBottom: 4,
        },
        tipText: {
            fontSize: 13,
            color: theme.text,
            lineHeight: 20,
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>HR Interview Q&A</Text>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search questions..."
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={{ height: 50 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryChip, activeCategory === cat && styles.activeChip]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {filteredQuestions.map((q) => (
                    <TouchableOpacity key={q.id} style={styles.card} onPress={() => toggleExpand(q.id)} activeOpacity={0.9}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{q.category}</Text>
                        </View>
                        <View style={styles.questionRow}>
                            <Text style={styles.questionText}>{q.question}</Text>
                            <Ionicons name={expandedId === q.id ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                        </View>
                        {expandedId === q.id && (
                            <View style={styles.answerContainer}>
                                <Text style={styles.answerText}>{q.answer}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                <View style={styles.tipBox}>
                    <Text style={styles.tipTitle}>💡 WINNING TIP</Text>
                    <Text style={styles.tipText}>Answer calmly, confidently, and honestly. HR is checking your attitude, not just technical knowledge.</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}
