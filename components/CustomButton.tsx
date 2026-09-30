import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomButtonProps {
    onPress: () => void;
    title: string;
    type?: 'PRIMARY' | 'SECONDARY' | 'OUTLINE';
    style?: ViewStyle;
    icon?: keyof typeof Ionicons.glyphMap;
}

export default function CustomButton({ onPress, title, type = 'PRIMARY', style, icon }: CustomButtonProps) {
    const getBackgroundColor = () => {
        switch (type) {
            case 'PRIMARY': return '#8B5CF6'; // Purple from design
            case 'SECONDARY': return '#F3F4F6';
            case 'OUTLINE': return 'transparent';
            default: return '#8B5CF6';
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'PRIMARY': return '#fff';
            case 'SECONDARY': return '#333';
            case 'OUTLINE': return '#333';
            default: return '#fff';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.container,
                { backgroundColor: getBackgroundColor() },
                type === 'OUTLINE' && styles.outline,
                style
            ]}
        >
            {icon && <Ionicons name={icon} size={20} color={getTextColor()} style={{ marginRight: 10 }} />}
            <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 5,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    outline: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    text: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});
