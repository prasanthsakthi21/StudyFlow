import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../../constants/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateQuizScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Metadata
    const [course, setCourse] = useState('');
    const [semester, setSemester] = useState('');
    const [unit, setUnit] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('medium');

    // Questions State
    const [questions, setQuestions] = useState([
        { text: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }
    ]);

    const addQuestion = () => {
        setQuestions([...questions, { text: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }]);
    };

    const updateQuestion = (index: number, text: string) => {
        const newQ = [...questions];
        newQ[index].text = text;
        setQuestions(newQ);
    };

    const addOption = (qIndex: number) => {
        const newQ = [...questions];
        newQ[qIndex].options.push({ text: '', isCorrect: false });
        setQuestions(newQ);
    };

    const updateOption = (qIndex: number, oIndex: number, text: string) => {
        const newQ = [...questions];
        newQ[qIndex].options[oIndex].text = text;
        setQuestions(newQ);
    };

    const toggleCorrect = (qIndex: number, oIndex: number) => {
        const newQ = [...questions];
        // Uncheck others if single choice (implied mcq)
        newQ[qIndex].options.forEach((opt, idx) => opt.isCorrect = idx === oIndex);
        setQuestions(newQ);
    };

    const removeQuestion = (index: number) => {
        const newQ = [...questions];
        newQ.splice(index, 1);
        setQuestions(newQ);
    };

    const handleSubmit = async () => {
        if (!title || !course || !semester) {
            Alert.alert('Error', 'Please fill basic details (Title, Course, Semester)');
            return;
        }

        try {
            const userStr = await AsyncStorage.getItem('userToken');
            const user = JSON.parse(userStr || '{}');

            const payload = {
                title, description, course, semester, unit, topic, difficulty,
                createdBy: user.id || 1,
                questions
            };

            const res = await fetch(`${API_URL}/quizzes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                Alert.alert('Success', 'Quiz Created!');
                router.back();
            } else {
                Alert.alert('Error', 'Failed to save quiz');
            }
        } catch (e) {
            Alert.alert('Error', 'Network error');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Create New Quiz</Text>

            <View style={styles.section}>
                <TextInput style={styles.input} placeholder="Quiz Title" value={title} onChangeText={setTitle} />
                <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />

                <View style={styles.row}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Course (e.g. MCA)" value={course} onChangeText={setCourse} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Semester" value={semester} onChangeText={setSemester} />
                </View>
                <View style={styles.row}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Unit" value={unit} onChangeText={setUnit} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Topic" value={topic} onChangeText={setTopic} />
                </View>
            </View>

            <Text style={styles.subHeader}>Questions</Text>
            {questions.map((q, qIndex) => (
                <View key={qIndex} style={styles.questionCard}>
                    <View style={styles.row}>
                        <Text style={{ fontWeight: 'bold' }}>Q{qIndex + 1}</Text>
                        <TouchableOpacity onPress={() => removeQuestion(qIndex)}><Ionicons name="trash" size={20} color="red" /></TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.input, { marginTop: 8 }]}
                        placeholder="Question Text"
                        value={q.text}
                        onChangeText={(t) => updateQuestion(qIndex, t)}
                    />

                    {q.options.map((opt, oIndex) => (
                        <View key={oIndex} style={styles.optionRow}>
                            <TouchableOpacity onPress={() => toggleCorrect(qIndex, oIndex)}>
                                <Ionicons name={opt.isCorrect ? "radio-button-on" : "radio-button-off"} size={20} color={opt.isCorrect ? "green" : "gray"} />
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.input, { flex: 1, marginVertical: 4 }]}
                                placeholder={`Option ${oIndex + 1}`}
                                value={opt.text}
                                onChangeText={(t) => updateOption(qIndex, oIndex, t)}
                            />
                        </View>
                    ))}
                    <TouchableOpacity onPress={() => addOption(qIndex)} style={styles.addOptionBtn}>
                        <Text style={{ color: '#6366f1' }}>+ Add Option</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
                <Text style={styles.buttonText}>+ Add Question</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Save Quiz</Text>
            </TouchableOpacity>
            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1e293b' },
    subHeader: { fontSize: 18, fontWeight: '600', marginBottom: 10, marginTop: 20, color: '#334155' },
    section: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2 },
    input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#fff' },
    row: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-between' },
    questionCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    addOptionBtn: { marginTop: 8, alignSelf: 'flex-start' },
    addButton: { backgroundColor: '#e0e7ff', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    saveButton: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    buttonText: { fontWeight: 'bold', color: '#fff' }
});
