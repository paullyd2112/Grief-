// Building blocks for the redesigned home (Conversations) screen. They are
// presentational only: the screen owns the data and passes callbacks in.
// Copy in CheckInCard and DepartureNotice is founder-approved; don't edit it.
//
// The feel is stationery, not software: ink on paper, type doing the work,
// hairline rules instead of boxes, and nothing that counts or gamifies.

import { Linking, Pressable, StyleSheet, View } from "react-native";
import { fonts, gutter, hairlineWidth, minTapTarget, radius, space, useTheme } from "../../theme";
import { Avatar, Button, Icon, Text } from "../ui";

// ---------------------------------------------------------------------------
// Conversation row
// ---------------------------------------------------------------------------

export interface ConversationRowProps {
  partnerId: string;
  partnerName: string;
  preview: string | null;
  time: string | null;
  unread: boolean;
  ended: boolean;
  onPress: () => void;
}

export const CONVERSATION_AVATAR_SIZE = 48;

export function ConversationRow({
  partnerId,
  partnerName,
  preview,
  time,
  unread,
  ended,
  onPress,
}: ConversationRowProps) {
  const { color } = useTheme();
  const subtitle = ended
    ? "Conversation ended"
    : preview ?? "New match. Say hello when you're ready.";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${partnerName}${unread ? ", unread" : ""}. ${subtitle}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.surfaceSunken }]}
    >
      <View style={ended && styles.faded}>
        <Avatar seed={partnerId} name={partnerName} size={CONVERSATION_AVATAR_SIZE} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text variant="title3" numberOfLines={1} style={styles.rowName}>
            {partnerName}
          </Text>
          {unread && (
            <View
              style={[styles.unreadDot, { backgroundColor: color.accent }]}
              accessibilityElementsHidden
            />
          )}
          {time && (
            <Text variant="footnote" color="textTertiary">
              {time}
            </Text>
          )}
        </View>
        <Text
          variant="subhead"
          color={unread ? "text" : "textSecondary"}
          numberOfLines={2}
          style={ended && styles.italic}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Onboarding: the two steps as one quiet, numbered list
// ---------------------------------------------------------------------------

export interface OnboardingProgressProps {
  displayName?: string | null;
  guidelinesDone: boolean;
  intakeDone: boolean;
  onGuidelines: () => void;
  onIntake: () => void;
}

export function OnboardingProgress({
  displayName,
  guidelinesDone,
  intakeDone,
  onGuidelines,
  onIntake,
}: OnboardingProgressProps) {
  const { color } = useTheme();

  const steps = [
    {
      key: "guidelines",
      n: "1",
      title: "Read the community guidelines",
      desc: "The ground rules for every conversation",
      complete: guidelinesDone,
      available: !guidelinesDone,
      onPress: onGuidelines,
    },
    {
      key: "intake",
      n: "2",
      title: "Tell us about your loss",
      desc: "So we can match you with someone who understands",
      complete: intakeDone,
      available: guidelinesDone && !intakeDone,
      onPress: onIntake,
    },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.intro}>
        <Text variant="title1">
          Welcome{displayName ? `, ${displayName}` : ""}
        </Text>
        <Text variant="callout" color="textSecondary">
          {"A couple of quick steps and we'll start looking for your match."}
        </Text>
      </View>

      <View style={[styles.rules, { borderColor: color.hairline }]}>
        {steps.map((step, i) => (
          <Pressable
            key={step.key}
            onPress={step.onPress}
            disabled={!step.available}
            accessibilityRole="button"
            accessibilityLabel={`Step ${step.n}: ${step.title}${step.complete ? ", done" : ""}`}
            accessibilityState={{ disabled: !step.available }}
            style={({ pressed }) => [
              styles.step,
              i > 0 && { borderTopWidth: hairlineWidth, borderTopColor: color.hairline },
              pressed && { backgroundColor: color.surfaceSunken },
            ]}
          >
            <Text
              style={[
                styles.numeral,
                { color: step.available ? color.accent : color.textTertiary },
              ]}
            >
              {step.n}
            </Text>
            <View style={styles.stepText}>
              <Text
                variant="bodyMedium"
                color={step.available ? "text" : "textSecondary"}
              >
                {step.title}
              </Text>
              <Text variant="footnote" color="textSecondary">
                {step.complete ? "Done" : step.desc}
              </Text>
            </View>
            {step.complete ? (
              <Icon name="check" size={16} color={color.textTertiary} />
            ) : step.available ? (
              <Icon name="chevronRight" size={14} color={color.textTertiary} />
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Check-in from Ndo. Never says why it was sent. Set like a short letter.
// ---------------------------------------------------------------------------

export function CheckInCard({ onDismiss }: { onDismiss: () => void }) {
  const { color } = useTheme();
  return (
    <View
      style={[
        styles.letter,
        { backgroundColor: color.surface, borderColor: color.hairline },
      ]}
    >
      <Text variant="caption" color="textTertiary" style={styles.eyebrow}>
        FROM NDO
      </Text>
      <Text variant="title2">Checking in on you</Text>
      <Text variant="callout" color="textSecondary" style={styles.letterBody}>
        {"Grief can get really heavy. If things feel like too much right now, you don't have to carry it alone."}
      </Text>
      <Button
        title="Call or text 988"
        block
        onPress={() => Linking.openURL("tel:988")}
      />
      <Pressable
        onPress={() => Linking.openURL("sms:741741&body=HELLO")}
        accessibilityRole="link"
        style={styles.textLink}
      >
        <Text variant="subheadMedium" color="accent" align="center">
          Text HELLO to 741741
        </Text>
      </Pressable>
      <Text variant="footnote" color="textTertiary" align="center">
        Both are free, confidential, and there any time, day or night.
      </Text>
      <View style={[styles.letterFoot, { borderTopColor: color.hairline }]}>
        <Pressable onPress={onDismiss} accessibilityRole="button" style={styles.textLink}>
          <Text variant="subhead" color="textSecondary" align="center">
            {"I'm okay for now"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Departure notice: a quiet note between rules, not an alert.
// ---------------------------------------------------------------------------

export function DepartureNotice({
  leaverName,
  onDismiss,
}: {
  leaverName: string;
  onDismiss: () => void;
}) {
  const { color } = useTheme();
  return (
    <View style={[styles.note, { borderColor: color.hairline }]}>
      <Text variant="title3">{leaverName} left the conversation.</Text>
      <Text variant="callout" color="textSecondary">
        People step back for their own reasons — it isn&apos;t about you.
      </Text>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        style={({ pressed }) => [styles.noteAction, pressed && { opacity: 0.6 }]}
      >
        <Text variant="subheadMedium" color="accent">
          Get matched with someone new
        </Text>
        <Icon name="chevronRight" size={12} color={color.accent} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Waiting for a match
// ---------------------------------------------------------------------------

export function WaitingState() {
  const { color } = useTheme();
  return (
    <View style={styles.waiting}>
      <View style={[styles.rule, { backgroundColor: color.textTertiary }]} />
      <Text variant="title1" align="center">
        {"We'll have matches for you shortly"}
      </Text>
      <Text variant="callout" color="textSecondary" align="center">
        {"A real person reads your intake and pairs you with people whose experience fits yours. We'll bring them here as soon as they're ready."}
      </Text>
      <Text variant="footnote" color="textTertiary" align="center" style={styles.waitingHint}>
        Pull down to check for updates.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Quiet crisis entry point, for the header of every screen.
// ---------------------------------------------------------------------------

export function CrisisHelpButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Crisis help"
      style={({ pressed }) => [styles.crisis, pressed && { opacity: 0.6 }]}
    >
      <Text variant="subhead" color="textSecondary">
        Crisis help
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Time labels for the conversation list: "9:41 AM", "Yesterday", "Tue", "Mar 3".
// ---------------------------------------------------------------------------

export function formatListTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.lg,
    paddingHorizontal: gutter,
    paddingVertical: space.lg + space.xxs,
  },
  faded: {
    opacity: 0.45,
  },
  rowBody: {
    flex: 1,
    gap: space.xxs,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  rowName: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  italic: {
    fontStyle: "italic",
  },
  section: {
    paddingTop: space.sm,
  },
  intro: {
    paddingHorizontal: gutter,
    gap: space.sm,
    marginBottom: space.xxl,
  },
  rules: {
    borderTopWidth: hairlineWidth,
    borderBottomWidth: hairlineWidth,
  },
  step: {
    minHeight: minTapTarget + space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    paddingHorizontal: gutter,
    paddingVertical: space.lg,
  },
  numeral: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    width: 20,
  },
  stepText: {
    flex: 1,
    gap: space.xxs,
  },
  letter: {
    marginHorizontal: space.lg,
    marginBottom: space.xxl,
    borderRadius: radius.md,
    borderWidth: hairlineWidth,
    paddingHorizontal: space.xxl,
    paddingTop: space.xxl,
    paddingBottom: space.sm,
    gap: space.md,
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  letterBody: {
    marginBottom: space.sm,
  },
  letterFoot: {
    borderTopWidth: hairlineWidth,
    marginTop: space.xs,
  },
  textLink: {
    minHeight: minTapTarget,
    justifyContent: "center",
  },
  note: {
    marginHorizontal: gutter,
    marginBottom: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xs,
    borderTopWidth: hairlineWidth,
    borderBottomWidth: hairlineWidth,
    gap: space.xs + space.xxs,
  },
  noteAction: {
    minHeight: minTapTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    alignSelf: "flex-start",
  },
  waiting: {
    alignItems: "center",
    paddingHorizontal: gutter + space.lg,
    paddingTop: space.huge + space.xxl,
    gap: space.lg,
  },
  rule: {
    width: 32,
    height: 1,
    marginBottom: space.sm,
  },
  waitingHint: {
    marginTop: space.sm,
  },
  crisis: {
    minHeight: minTapTarget,
    minWidth: minTapTarget,
    justifyContent: "center",
    paddingLeft: space.sm,
  },
});
