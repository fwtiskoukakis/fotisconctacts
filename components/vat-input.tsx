import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { validateGreekVAT, formatVATNumber } from '../utils/aade-contract-helper';

interface VATInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  editable?: boolean;
}

/**
 * VAT number input with validation
 */
export function VATInput({
  value,
  onChangeText,
  label = 'ΑΦΜ',
  placeholder = 'Εισάγετε 9ψήφιο ΑΦΜ',
  containerStyle,
  inputStyle,
  editable = true,
}: VATInputProps) {
  const [touched, setTouched] = useState(false);

  const validation = validateGreekVAT(value);
  const showError = touched && !validation.isValid && value.length > 0;

  function handleChangeText(text: string) {
    // Remove non-numeric characters
    const cleaned = text.replace(/[^0-9]/g, '');
    // Limit to 9 digits
    const limited = cleaned.slice(0, 9);
    onChangeText(limited);
  }

  function handleBlur() {
    setTouched(true);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TextInput
        style={[
          styles.input,
          inputStyle,
          showError && styles.inputError,
        ]}
        value={value}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType="numeric"
        maxLength={9}
        editable={editable}
      />

      {showError && (
        <Text style={styles.errorText}>{validation.error}</Text>
      )}

      {validation.isValid && value.length === 9 && (
        <View style={styles.validContainer}>
          <Text style={styles.validIcon}>✓</Text>
          <Text style={styles.validText}>
            Έγκυρο ΑΦΜ: {formatVATNumber(value)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
  validContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  validIcon: {
    fontSize: 14,
    color: '#28a745',
    marginRight: 4,
  },
  validText: {
    fontSize: 12,
    color: '#28a745',
  },
});

