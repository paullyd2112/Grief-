// Design preview: the redesigned home screen and the component kit, rendered
// with sample data so they can be screenshotted for review before the real
// screens change. Development builds only (see app/_layout.tsx).
//
//   /design-preview?state=new | waiting | active | support | chat | components
//                  &accent=ink | spruce | plum

import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CheckInCard,
  CONVERSATION_AVATAR_SIZE,
  ConversationRow,
  CrisisHelpButton,
  DepartureNotice,
  OnboardingProgress,
  WaitingState,
} from "../src/components/home/HomeBlocks";
import {
  DaySeparator,
  TextBubble,
  UnsentLine,
  buildChatItems,
  groupSpacing,
} from "../src/components/chat/ChatParts";
import { MediaBubble } from "../src/components/MediaBubble";
import type { Message } from "../src/lib/types";
import {
  Avatar,
  BottomSheet,
  Button,
  Icon,
  LargeTitleHeader,
  ListGroup,
  ListRow,
  ListSection,
  NoticeBanner,
  PillSelect,
  Text,
  TextField,
} from "../src/components/ui";
import {
  AccentContext,
  accents,
  gutter,
  hairlineWidth,
  minTapTarget,
  space,
  useTheme,
  type AccentName,
} from "../src/theme";

type PreviewState = "new" | "waiting" | "active" | "support" | "chat" | "components";

const conversations = [
  {
    id: "c1",
    partnerId: "7f3a9c21-sample-maya",
    partnerName: "Maya",
    preview: "Thank you for saying that. Sundays are the hardest for me too.",
    time: "9:41 AM",
    unread: true,
    ended: false,
  },
  {
    id: "c2",
    partnerId: "b18e44d0-sample-daniel",
    partnerName: "Daniel R.",
    preview: "Voice memo",
    time: "Yesterday",
    unread: false,
    ended: false,
  },
  {
    id: "c3",
    partnerId: "e920f1aa-sample-june",
    partnerName: "June",
    preview: null,
    time: "Tue",
    unread: false,
    ended: false,
  },
  {
    id: "c4",
    partnerId: "41cc7e02-sample-sam",
    partnerName: "Sam",
    preview: null,
    time: "Mar 3",
    unread: false,
    ended: true,
  },
];

export default function DesignPreview() {
  const { accent } = useLocalSearchParams<{ accent?: string }>();
  const accentName: AccentName = accent && accent in accents ? (accent as AccentName) : "plum";
  return (
    <AccentContext.Provider value={accentName}>
      <PreviewScreen />
    </AccentContext.Provider>
  );
}

function PreviewScreen() {
  const { state = "active" } = useLocalSearchParams<{ state?: PreviewState }>();
  const { color } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: color.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: space.xxl }}
      >
        {state === "components" ? (
          <ComponentKit />
        ) : state === "chat" ? (
          <ChatMock />
        ) : (
          <HomeMock state={state} />
        )}
      </ScrollView>
      {state === "chat" && <ComposerMock />}
      {state !== "components" && state !== "chat" && <TabBarMock />}
    </View>
  );
}

function HomeMock({ state }: { state: PreviewState }) {
  const noop = () => {};
  return (
    <>
      <LargeTitleHeader
        title="Conversations"
        trailing={<CrisisHelpButton onPress={noop} />}
      />

      {state === "new" && (
        <OnboardingProgress
          displayName="Alex"
          guidelinesDone
          intakeDone={false}
          onGuidelines={noop}
          onIntake={noop}
        />
      )}

      {state === "waiting" && <WaitingState />}

      {state === "support" && (
        <>
          <CheckInCard onDismiss={noop} />
          <DepartureNotice leaverName="Sam" onDismiss={noop} />
        </>
      )}

      {(state === "active" || state === "support") && (
        <ListSection inset={gutter + CONVERSATION_AVATAR_SIZE + space.lg}>
          {conversations.map((c) => (
            <ConversationRow key={c.id} {...c} onPress={noop} />
          ))}
        </ListSection>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Conversation screen sample: day separators, grouped bubbles, a photo card
// and an unsent line.
// ---------------------------------------------------------------------------

const ME = "me-sample";
const MAYA = "7f3a9c21-sample-maya";

function sampleMessages(): Message[] {
  const now = new Date();
  const at = (daysAgo: number, h: number, m: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const msg = (
    id: string,
    sender: string,
    created_at: string,
    body: string | null,
    extra: Partial<Message> = {}
  ): Message => ({
    id,
    conversation_id: "sample",
    sender_id: sender,
    kind: "text",
    body,
    voice_memo_id: null,
    allow_save: false,
    unsent_at: null,
    created_at,
    ...extra,
  });
  // Oldest first here; the screen's list is newest first.
  return [
    msg("1", MAYA, at(2, 21, 12), "I keep setting two mugs out in the morning."),
    msg("2", MAYA, at(2, 21, 12), "Three months and my hands still do it."),
    msg("3", ME, at(2, 21, 30), "I did that with his coat for a long time. I'd reach for it by the door."),
    msg("4", ME, at(2, 21, 31), "It doesn't mean you're stuck. It means it mattered."),
    msg("5", MAYA, at(0, 9, 38), "This is him at the lake, the summer before.", { kind: "media" }),
    msg("6", MAYA, at(0, 9, 41), "Thank you for saying that. Sundays are the hardest for me too."),
    msg("7", ME, at(0, 9, 52), null, { kind: "voice", unsent_at: at(0, 9, 53) }),
  ].reverse();
}

function ChatMock() {
  const { color } = useTheme();
  const items = buildChatItems(sampleMessages()).reverse();
  const noop = () => {};
  return (
    <View>
      <View style={[styles.chatHeader, { borderBottomColor: color.hairline }]}>
        <Avatar seed={MAYA} name="Maya" size={28} />
        <Text variant="headline" style={{ flex: 1 }}>
          Maya
        </Text>
        <Text variant="subhead" color="textSecondary">
          Get help
        </Text>
        <Icon name="more" size={22} color={color.text} />
      </View>
      <View style={styles.chatBody}>
        {items.map((item) =>
          item.type === "separator" ? (
            <DaySeparator key={item.key} label={item.label} />
          ) : (
            <View key={item.key} style={groupSpacing(item.groupStart)}>
              {item.message.kind === "media" ? (
                <MediaBubble
                  message={item.message}
                  isOwn={false}
                  partnerName="Maya"
                  showRightAway={false}
                  showExplainer
                  onRevealed={noop}
                  onLongPress={noop}
                />
              ) : item.message.unsent_at ? (
                <UnsentLine isOwn text="You unsent a voice memo" />
              ) : (
                <TextBubble
                  message={item.message}
                  isOwn={item.message.sender_id === ME}
                  groupEnd={item.groupEnd}
                  showTime={item.message.id === "6"}
                />
              )}
            </View>
          )
        )}
      </View>
    </View>
  );
}

function ComposerMock() {
  const { color } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.composerMock,
        { borderTopColor: color.hairline, paddingBottom: insets.bottom + space.md },
      ]}
    >
      <Icon name="plus" size={22} color={color.textSecondary} />
      <View style={[styles.inputMock, { backgroundColor: color.surfaceSunken }]}>
        <Text variant="body" color="textTertiary">
          Message
        </Text>
      </View>
      <Icon name="mic" size={22} color={color.textSecondary} />
    </View>
  );
}

// Stand-in for the bottom tab bar that the navigation step will add.
function TabBarMock() {
  const { color } = useTheme();
  const insets = useSafeAreaInsets();
  const tabs = [
    { label: "Conversations", icon: "conversationsFill" as const, active: true },
    { label: "You", icon: "person" as const, active: false },
  ];
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: color.background,
          borderTopColor: color.hairline,
          paddingBottom: Math.max(insets.bottom, space.sm),
        },
      ]}
    >
      {tabs.map((t) => (
        <View key={t.label} style={styles.tab}>
          <Icon name={t.icon} size={24} color={t.active ? color.text : color.textTertiary} />
          <Text variant="caption" color={t.active ? "text" : "textTertiary"}>
            {t.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ComponentKit() {
  const { color } = useTheme();
  const [relationship, setRelationship] = useState<string | null>("parent");
  const [support, setSupport] = useState<string[]>(["listening"]);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <View style={styles.kit}>
      <LargeTitleHeader title="Components" subtitle="Ndo design system" />

      <Section title="Type">
        <Text variant="display">Ndo</Text>
        <Text variant="title1">Title one, in serif</Text>
        <Text variant="title3">Title three, in serif</Text>
        <Text variant="headline">Headline in Figtree</Text>
        <Text variant="body">
          Body text is Figtree at 17pt, set loosely so long messages stay easy to read.
        </Text>
        <Text variant="footnote" color="textTertiary">
          Footnote for timestamps and hints
        </Text>
      </Section>

      <Section title="Color">
        <View style={styles.swatches}>
          {(
            [
              "background",
              "surface",
              "surfaceSunken",
              "text",
              "textSecondary",
              "accent",
              "accentSoft",
              "bubbleTheirs",
              "danger",
            ] as const
          ).map((k) => (
            <View key={k} style={styles.swatchItem}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: color[k], borderColor: color.hairline },
                ]}
              />
              <Text variant="caption" color="textTertiary" numberOfLines={1}>
                {k}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Buttons">
        <Button title="Continue" block />
        <Button title="Report a concern" variant="secondary" block />
        <Button title="Not now" variant="quiet" />
        <Button title="Yes, right now" variant="destructive" block />
      </Section>

      <Section title="Avatars">
        <View style={styles.rowWrap}>
          {conversations.map((c) => (
            <Avatar key={c.id} seed={c.partnerId} name={c.partnerName} />
          ))}
        </View>
      </Section>

      <Section title="Grouped list" flush>
        <ListGroup header="Account" footer="Your name is only shown to people you're matched with.">
          <ListRow title="Name" trailing="Alex" chevron onPress={() => {}} />
          <ListRow title="Your data" chevron onPress={() => {}} />
          <ListRow title="Community guidelines" chevron onPress={() => {}} />
        </ListGroup>
      </Section>

      <Section title="Notice banner">
        <NoticeBanner
          icon="lock"
          title="Keep contact details private"
          body="For your safety, Ndo doesn't allow phone numbers, emails or social handles in chat."
        />
        <NoticeBanner tone="accent" icon="info" body="Your match can see your first name only." />
      </Section>

      <Section title="Text field">
        <TextField label="What should we call you?" placeholder="First name or a nickname" />
        <TextField
          label="Their name"
          defaultValue="x"
          error="Please enter at least two letters."
        />
      </Section>

      <Section title="Pill select">
        <PillSelect
          accessibilityLabel="Relationship"
          options={[
            { value: "parent", label: "Parent" },
            { value: "partner", label: "Partner" },
            { value: "sibling", label: "Sibling" },
            { value: "child", label: "Child" },
            { value: "friend", label: "Friend" },
          ]}
          value={relationship}
          onChange={setRelationship}
        />
        <PillSelect
          multiple
          options={[
            { value: "listening", label: "Someone to listen" },
            { value: "advice", label: "Practical advice" },
            { value: "company", label: "Company on hard days" },
          ]}
          value={support}
          onChange={setSupport}
        />
      </Section>

      <Section title="Bottom sheet">
        <Button title="Open sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
      </Section>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="A sheet">
        <Text variant="callout" color="textSecondary">
          Sheets rise from the bottom, or fade in place when Reduce Motion is on.
        </Text>
        <Button title="Done" block onPress={() => setSheetOpen(false)} />
      </BottomSheet>
    </View>
  );
}

function Section({
  title,
  children,
  flush = false,
}: {
  title: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  const { color } = useTheme();
  return (
    <View style={[styles.section, { borderTopColor: color.hairline }]}>
      <Text variant="caption" color="textTertiary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.sectionBody, flush && styles.flush]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chatBody: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  composerMock: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputMock: { flex: 1, borderRadius: 20, paddingHorizontal: space.lg, paddingVertical: 9 },
  screen: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: hairlineWidth,
    paddingTop: space.sm,
  },
  tab: {
    flex: 1,
    minHeight: minTapTarget,
    alignItems: "center",
    gap: space.xxs,
  },
  kit: {
    paddingBottom: space.huge,
  },
  section: {
    borderTopWidth: hairlineWidth,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
  sectionTitle: {
    paddingHorizontal: gutter,
    marginBottom: space.md,
    letterSpacing: 0.6,
  },
  sectionBody: {
    paddingHorizontal: gutter,
    gap: space.md,
  },
  flush: {
    paddingHorizontal: 0,
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
  },
  swatchItem: {
    width: 96,
    gap: space.xs,
  },
  swatch: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  rowWrap: {
    flexDirection: "row",
    gap: space.md,
  },
});
