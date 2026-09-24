// Building blocks for the redesigned home (Conversations) screen. They are
// presentational only: the screen owns the data and passes callbacks in.
// Copy in CheckInCard and DepartureNotice is founder-approved; don't edit it.

import { Linking, Pressable, StyleSheet, View } from "react-native";
import { gutter, hairlineWidth, minTapTarget, radius, space, useTheme } from "../../theme";
import { Avatar, Button, Icon, ListRow, Text } from "../ui";

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
    <ListRow
      title={partnerName}
      subtitle={subtitle}
      emphasized={unread}
      onPress={onPress}
      accessibilityLabel={`${partnerName}${unread ? ", unread" : ""}. ${subtitle}`}
      leading={
        <View style={ended && styles.faded}>
          <Avatar seed={partnerId} name={partnerName} size={52} />
        </View>
      }
      trailing={
        <View style={styles.meta}>
          {time && (
            <Text variant="footnote" color={unread ? "accent" : "textTertiary"}>
              {time}
            </Text>
          )}
          <View
            style={[
              styles.unreadDot,
              { backgroundColor: unread ? color.accent : "transparent" },
            ]}
          />
        </View>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Onboarding: both steps in one progress block
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
  const done = Number(guidelinesDone) + Number(intakeDone);

  const steps = [
    {
      key: "guidelines",
      title: "Read the community guidelines",
      desc: "The ground rules for every conversation",
      complete: guidelinesDone,
      available: !guidelinesDone,
      onPress: onGuidelines,
    },
    {
      key: "intake",
      title: "Tell us about your loss",
      desc: "So we can match you with someone who understands",
      complete: intakeDone,
      available: guidelinesDone && !intakeDone,
      onPress: onIntake,
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: color.surface }]}>
      <View style={styles.cardIntro}>
        <Text variant="title2">
          Welcome{displayName ? `, ${displayName}` : ""}
        </Text>
        <Text variant="subhead" color="textSecondary">
          {"A couple of quick steps and we'll start looking for your match."}
        </Text>
      </View>

      <View
        style={styles.progressRow}
        accessibilityRole="progressbar"
        accessibilityLabel={`${done} of 2 steps done`}
        accessibilityValue={{ min: 0, max: 2, now: done }}
      >
        <View style={[styles.progressTrack, { backgroundColor: color.surfaceSunken }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: color.accent, width: `${(done / 2) * 100}%` },
            ]}
          />
        </View>
        <Text variant="caption" color="textTertiary">
          {done} of 2
        </Text>
      </View>

      {steps.map((step, i) => (
        <Pressable
          key={step.key}
          onPress={step.onPress}
          disabled={!step.available}
          accessibilityRole="button"
          accessibilityState={{ disabled: !step.available, checked: step.complete }}
          style={({ pressed }) => [
            styles.step,
            i > 0 && { borderTopWidth: hairlineWidth, borderTopColor: color.hairline },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Icon
            name={step.complete ? "checkCircle" : "circle"}
            size={24}
            color={step.complete || step.available ? color.accent : color.textTertiary}
          />
          <View style={styles.stepText}>
            <Text
              variant="bodyMedium"
              color={step.complete || !step.available ? "textSecondary" : "text"}
            >
              {step.title}
            </Text>
            <Text variant="footnote" color={step.complete ? "accent" : "textSecondary"}>
              {step.complete ? "Done" : step.desc}
            </Text>
          </View>
          {step.available && (
            <Icon name="chevronRight" size={14} color={color.textTertiary} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Check-in from Ndo. Never says why it was sent.
// ---------------------------------------------------------------------------

export function CheckInCard({ onDismiss }: { onDismiss: () => void }) {
  const { color } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: color.accentSoft }]}>
      <View style={styles.cardIntro}>
        <Text variant="title3">Checking in on you</Text>
        <Text variant="callout" color="textSecondary">
          {"Grief can get really heavy. If things feel like too much right now, you don't have to carry it alone."}
        </Text>
      </View>
      <Button
        title="Call or text 988"
        icon="phone"
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
      <Text variant="footnote" color="textSecondary" align="center">
        Both are free, confidential, and there any time, day or night.
      </Text>
      <Pressable onPress={onDismiss} accessibilityRole="button" style={styles.textLink}>
        <Text variant="subhead" color="textSecondary" align="center">
          {"I'm okay for now"}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Departure notice
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
    <View style={[styles.card, { backgroundColor: color.surfaceSunken }]}>
      <View style={styles.cardIntro}>
        <Text variant="headline">{leaverName} left the conversation.</Text>
        <Text variant="subhead" color="textSecondary">
          People step back for their own reasons — it isn&apos;t about you.
        </Text>
      </View>
      <Button
        title="Get matched with someone new"
        variant="secondary"
        onPress={onDismiss}
        style={styles.alignStart}
      />
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
      <View style={[styles.waitingIcon, { backgroundColor: color.accentSoft }]}>
        <Icon name="leaf" size={26} color={color.accent} />
      </View>
      <Text variant="title2" align="center">
        {"We'll have matches for you shortly"}
      </Text>
      <Text variant="callout" color="textSecondary" align="center">
        {"A real person reads your intake and pairs you with people whose experience fits yours. We'll bring them here as soon as they're ready."}
      </Text>
      <Text variant="footnote" color="textTertiary" align="center">
        Pull down to check for updates.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Quiet crisis entry point, for the header of every screen.
// ---------------------------------------------------------------------------

export function CrisisHelpButton({ onPress }: { onPress: () => void }) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Crisis help"
      hitSlop={space.sm}
      style={({ pressed }) => [
        styles.crisis,
        { borderColor: color.hairline, backgroundColor: pressed ? color.surfaceSunken : "transparent" },
      ]}
    >
      <Icon name="support" size={16} color={color.textSecondary} />
      <Text variant="footnote" color="textSecondary">
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
  faded: {
    opacity: 0.5,
  },
  meta: {
    alignItems: "flex-end",
    alignSelf: "stretch",
    justifyContent: "space-between",
    paddingVertical: space.xxs,
    gap: space.sm,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  card: {
    marginHorizontal: space.lg,
    marginBottom: space.lg,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.md,
  },
  cardIntro: {
    gap: space.xs + space.xxs,
    marginBottom: space.xs,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginBottom: space.xs,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  step: {
    minHeight: minTapTarget + space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
  },
  stepText: {
    flex: 1,
    gap: space.xxs,
  },
  textLink: {
    minHeight: minTapTarget,
    justifyContent: "center",
  },
  alignStart: {
    alignSelf: "flex-start",
  },
  waiting: {
    alignItems: "center",
    paddingHorizontal: gutter + space.lg,
    paddingTop: space.huge,
    gap: space.md,
  },
  waitingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.sm,
  },
  crisis: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
