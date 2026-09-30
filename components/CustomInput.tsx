import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    isPassword?: boolean;
    onTogglePasswordVisibility?: () => void;
    isPasswordVisible?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export default function CustomInput({
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    icon,
    isPassword,
    onTogglePasswordVisibility,
    isPasswordVisible,
    keyboardType = 'default',
    autoCapitalize = 'none'
}: CustomInputProps) {
    return (
        <View style={styles.container}>
            {icon && <Ionicons name={icon} size={20} color="#666" style={styles.icon} />}
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize}
                keyboardType={keyboardType}
                autoCorrect={false}
            />
            {isPassword && (
                <TouchableOpacity onPress={onTogglePasswordVisibility}>
                    <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
});
