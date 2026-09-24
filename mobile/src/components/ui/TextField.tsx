import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { fonts, minTapTarget, radius, space, type as typeScale, useTheme } from "../../theme";
import { Icon } from "./Icon";
import { Text } from "./Text";

export interface TextFieldProps extends TextInputProps {
  label: string;
  helper?: string;
  error?: string | null;
}

// Errors are marked with an icon and a darker outline, not red: red is kept
// for the one urgent answer in the worried sheet.
export function TextField({
  label,
  helper,
  error,
  multiline,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const { color } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? color.text : focused ? color.accent : "transparent";

  return (
    <View style={styles.wrap}>
      <Text variant="subheadMedium" color="textSecondary">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? helper}
        placeholderTextColor={color.textTertiary}
        selectionColor={color.accent}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          typeScale.body,
          {
            fontFamily: fonts.sans,
            color: color.text,
            backgroundColor: color.surfaceSunken,
            borderColor,
          },
          multiline && styles.multiline,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <View style={styles.message}>
          <Icon name="alert" size={16} color={color.text} />
          <Text variant="footnote" style={styles.messageText}>
            {error}
          </Text>
        </View>
      ) : helper ? (
        <Text variant="footnote" color="textTertiary">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
  },
  input: {
    minHeight: minTapTarget + space.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  message: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  messageText: {
    flex: 1,
  },
});
