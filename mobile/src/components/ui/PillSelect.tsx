import { Pressable, StyleSheet, View } from "react-native";
import { minTapTarget, radius, space, useTheme } from "../../theme";
import { Icon } from "./Icon";
import { haptics } from "./motion";
import { Text } from "./Text";

export interface PillOption<T extends string> {
  value: T;
  label: string;
}

interface BaseProps<T extends string> {
  options: PillOption<T>[];
  accessibilityLabel?: string;
}

interface SingleProps<T extends string> extends BaseProps<T> {
  multiple?: false;
  value: T | null;
  onChange: (value: T) => void;
}

interface MultiProps<T extends string> extends BaseProps<T> {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
}

export type PillSelectProps<T extends string> = SingleProps<T> | MultiProps<T>;

export function PillSelect<T extends string>(props: PillSelectProps<T>) {
  const { color } = useTheme();
  const isSelected = (v: T) =>
    props.multiple ? props.value.includes(v) : props.value === v;

  const toggle = (v: T) => {
    haptics.select();
    if (props.multiple) {
      props.onChange(
        props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]
      );
    } else {
      props.onChange(v);
    }
  };

  return (
    <View
      style={styles.wrap}
      accessibilityRole={props.multiple ? undefined : "radiogroup"}
      accessibilityLabel={props.accessibilityLabel}
    >
      {props.options.map((opt) => {
        const selected = isSelected(opt.value);
        return (
          <Pressable
            key={opt.value}
            onPress={() => toggle(opt.value)}
            accessibilityRole={props.multiple ? "checkbox" : "radio"}
            accessibilityState={props.multiple ? { checked: selected } : { selected }}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: selected
                  ? color.accentSoft
                  : pressed
                    ? color.surfaceSunken
                    : color.surface,
                borderColor: selected ? color.accent : color.hairline,
              },
            ]}
          >
            {selected && <Icon name="check" size={14} color={color.accent} />}
            <Text variant="subheadMedium" color={selected ? "accent" : "text"}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  pill: {
    minHeight: minTapTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs + space.xxs,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
