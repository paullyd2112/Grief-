import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as Localization from "expo-localization";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/hooks/useAuth";
import type {
  RelationshipType,
  MannerOfDeath,
  Suddenness,
  MatchPreference,
  TalkFrequency,
} from "../../src/lib/types";
import {
  Button,
  Icon,
  PillSelect,
  Screen,
  Text,
  TextField,
  haptics,
  type PillOption,
} from "../../src/components/ui";
import { radius, space, useTheme } from "../../src/theme";

const RELATIONSHIPS: PillOption<RelationshipType>[] = [
  { value: "sibling", label: "Sibling" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "partner", label: "Partner" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

const MANNER: PillOption<MannerOfDeath>[] = [
  { value: "illness", label: "Illness" },
  { value: "accident", label: "Accident" },
  { value: "violence", label: "Violence" },
  { value: "overdose", label: "Overdose" },
  { value: "suicide", label: "Suicide" },
  { value: "natural", label: "Natural causes" },
  { value: "unknown", label: "Unknown" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const SUDDENNESS: PillOption<Suddenness>[] = [
  { value: "sudden", label: "Sudden" },
  { value: "gradual", label: "Gradual" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const TIME_OPTIONS: PillOption<string>[] = [
  "Less than 1 month",
  "1–3 months",
  "3–6 months",
  "6–12 months",
  "1–2 years",
  "2–5 years",
  "5+ years",
].map((t) => ({ value: t, label: t }));

const TALK_FREQUENCY: PillOption<TalkFrequency>[] = [
  { value: "daily", label: "Most days" },
  { value: "few_times_a_week", label: "A few times a week" },
  { value: "weekly", label: "Once a week or so" },
  { value: "on_hard_days", label: "When a hard day hits" },
  { value: "not_sure", label: "Not sure yet" },
];

const FINANCIAL: PillOption<"yes" | "no">[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const MATCH_PREFS: { value: MatchPreference; label: string; desc: string }[] = [
  {
    value: "similar_only",
    label: "Similar loss only",
    desc: "Only match me with people who experienced a similar kind of loss.",
  },
  {
    value: "prefer_similar",
    label: "Prefer similar",
    desc: "Prefer someone similar, but I'm open to others.",
  },
  {
    value: "open_to_anyone",
    label: "Open to anyone",
    desc: "Anyone who's grieving. The connection matters more than the category.",
  },
];

// One question per screen: a long form is a lot to face while grieving.
// Required steps hold Continue until answered; the rest can be skipped.
export default function IntakeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { color } = useTheme();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  // Form state
  const [relationship, setRelationship] = useState<RelationshipType | null>(null);
  const [relationshipDetail, setRelationshipDetail] = useState("");
  const [manner, setManner] = useState<MannerOfDeath | null>(null);
  const [suddenness, setSuddenness] = useState<Suddenness | null>(null);
  const [deceasedAge, setDeceasedAge] = useState("");
  const [timeSince, setTimeSince] = useState<string | null>(null);
  const [matchPref, setMatchPref] = useState<MatchPreference | null>(null);
  const [financialStrain, setFinancialStrain] = useState<boolean | null>(null);
  const [talkFrequency, setTalkFrequency] = useState<TalkFrequency | null>(null);
  const [avoidTopics, setAvoidTopics] = useState("");
  const [freeText, setFreeText] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [prefilling, setPrefilling] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("intake_responses")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setIsEdit(true);
          setRelationship(data.relationship);
          setRelationshipDetail(data.relationship_detail ?? "");
          setManner(data.manner_of_death);
          setSuddenness(data.suddenness);
          setDeceasedAge(data.deceased_age_range ?? "");
          setTimeSince(data.time_since_loss);
          setMatchPref(data.match_preference);
          setFinancialStrain(data.financial_strain);
          setTalkFrequency(data.talk_frequency);
          setAvoidTopics(data.avoid_topics ?? "");
          setFreeText(data.free_text ?? "");
        }
        setPrefilling(false);
      });
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!relationship || !timeSince || !matchPref) return;

    setLoading(true);

    const tz = Localization.getCalendars?.()[0]?.timeZone ?? null;

    const { error } = await supabase.from("intake_responses").upsert(
      {
        user_id: user.id,
        relationship,
        relationship_detail: relationshipDetail.trim() || null,
        manner_of_death: manner,
        suddenness,
        deceased_age_range: deceasedAge.trim() || null,
        time_since_loss: timeSince,
        match_preference: matchPref,
        financial_strain: financialStrain,
        talk_frequency: talkFrequency,
        avoid_topics: avoidTopics.trim() || null,
        free_text: freeText.trim() || null,
        timezone: tz,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    setLoading(false);

    if (error) {
      Alert.alert("Something went wrong", error.message);
      return;
    }

    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(tabs)");
  };

  if (prefilling) {
    return (
      <View style={[styles.center, { backgroundColor: color.background }]}>
        <ActivityIndicator color={color.textSecondary} />
      </View>
    );
  }

  const steps: { required?: boolean; answered: boolean; body: ReactNode }[] = [
    {
      required: true,
      answered: !!relationship,
      body: (
        <>
          <Question
            title="Who did you lose?"
            hint="This is private — encrypted and readable only by the person who matches you. It's not shared with anyone else. Take your time."
          />
          <PillSelect
            options={RELATIONSHIPS}
            value={relationship}
            onChange={setRelationship}
            accessibilityLabel="Your relationship to the person who died"
          />
          {relationship && (
            <TextField
              label="Any detail?"
              helper={'Optional. For example "older brother" or "stepmom".'}
              value={relationshipDetail}
              onChangeText={setRelationshipDetail}
            />
          )}
        </>
      ),
    },
    {
      answered: !!manner || !!suddenness,
      body: (
        <>
          <Question title="How did they die?" hint="Only if you want to say." />
          <PillSelect options={MANNER} value={manner} onChange={setManner} />
          <Text variant="headline" style={styles.subQuestion}>
            Was it sudden or gradual?
          </Text>
          <PillSelect options={SUDDENNESS} value={suddenness} onChange={setSuddenness} />
        </>
      ),
    },
    {
      answered: !!deceasedAge.trim(),
      body: (
        <>
          <Question title="How old were they?" />
          <TextField
            label="Their age"
            value={deceasedAge}
            onChangeText={setDeceasedAge}
            placeholder="e.g. 24, or 'early 20s'"
          />
        </>
      ),
    },
    {
      required: true,
      answered: !!timeSince,
      body: (
        <>
          <Question title="How long has it been?" />
          <PillSelect options={TIME_OPTIONS} value={timeSince} onChange={setTimeSince} />
        </>
      ),
    },
    {
      required: true,
      answered: !!matchPref,
      body: (
        <>
          <Question title="Who would you like to be matched with?" />
          <View style={styles.choices} accessibilityRole="radiogroup">
            {MATCH_PREFS.map((opt) => (
              <ChoiceCard
                key={opt.value}
                title={opt.label}
                body={opt.desc}
                selected={matchPref === opt.value}
                onPress={() => setMatchPref(opt.value)}
              />
            ))}
          </View>
        </>
      ),
    },
    {
      answered: !!talkFrequency,
      body: (
        <>
          <Question title="How often would you like to talk?" />
          <PillSelect options={TALK_FREQUENCY} value={talkFrequency} onChange={setTalkFrequency} />
        </>
      ),
    },
    {
      answered: !!avoidTopics.trim(),
      body: (
        <>
          <Question
            title="Anything you'd rather not talk about?"
            hint="We'll keep it in mind when choosing your match. Your match doesn't see your answers here, so let them know too if you'd like."
          />
          <TextField
            label="Topics to avoid"
            value={avoidTopics}
            onChangeText={setAvoidTopics}
            placeholder="e.g. religion, how they died, the funeral"
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
        </>
      ),
    },
    {
      answered: financialStrain !== null,
      body: (
        <>
          <Question
            title="Is financial strain part of what you're navigating?"
            hint="Some people want to match on this. Totally optional — never assumed from anything else."
          />
          <PillSelect
            options={FINANCIAL}
            value={financialStrain === null ? null : financialStrain ? "yes" : "no"}
            onChange={(v) => setFinancialStrain(v === "yes")}
          />
        </>
      ),
    },
    {
      answered: !!freeText.trim(),
      body: (
        <>
          <Question title="Anything else you want a match to know?" />
          <TextField
            label="Anything else"
            value={freeText}
            onChangeText={setFreeText}
            placeholder="Optional — whatever feels important"
            multiline
            textAlignVertical="top"
          />
          <Text variant="footnote" color="textTertiary">
            This information is encrypted at rest and readable only by the person who matches you
            by hand. It is never shared with your match directly — it helps us understand who to
            connect you with.
          </Text>
        </>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const next = () => {
    haptics.select();
    if (isLast) handleSubmit();
    else setStep(step + 1);
  };

  return (
    <Screen
      underHeader
      footer={
        <>
          <Button
            title={isLast ? (isEdit ? "Save changes" : "Submit") : "Continue"}
            block
            loading={loading}
            disabled={current.required && !current.answered}
            onPress={next}
          />
          {!current.required && !current.answered && !isLast && (
            <Button title="Skip" variant="quiet" block onPress={() => setStep(step + 1)} />
          )}
        </>
      }
    >
      <View style={styles.progressRow}>
        <View
          style={[styles.track, { backgroundColor: color.surfaceSunken }]}
          accessibilityRole="progressbar"
          accessibilityLabel={`Question ${step + 1} of ${steps.length}`}
        >
          <View
            style={[
              styles.fill,
              {
                backgroundColor: color.accent,
                width: `${((step + 1) / steps.length) * 100}%`,
              },
            ]}
          />
        </View>
        <Text variant="caption" color="textTertiary">
          {step + 1} of {steps.length}
        </Text>
      </View>

      {step > 0 && (
        <Pressable
          onPress={() => setStep(step - 1)}
          accessibilityRole="button"
          hitSlop={12}
          style={styles.back}
        >
          <Text variant="subheadMedium" color="accent">
            Previous question
          </Text>
        </Pressable>
      )}

      <View key={step} style={styles.body}>
        {current.body}
      </View>
    </Screen>
  );
}

function Question({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.question}>
      <Text variant="title2" accessibilityRole="header">
        {title}
      </Text>
      {hint && (
        <Text variant="callout" color="textSecondary">
          {hint}
        </Text>
      )}
    </View>
  );
}

function ChoiceCard({
  title,
  body,
  selected,
  onPress,
}: {
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
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
      <View style={styles.cardText}>
        <Text variant="headline" color={selected ? "accent" : "text"}>
          {title}
        </Text>
        <Text variant="subhead" color="textSecondary">
          {body}
        </Text>
      </View>
      {selected && <Icon name="check" size={18} color={color.accent} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  track: { flex: 1, height: 4, borderRadius: radius.sm, overflow: "hidden" },
  fill: { height: 4, borderRadius: radius.sm },
  back: { alignSelf: "flex-start" },
  body: { gap: space.lg },
  question: { gap: space.sm, marginBottom: space.xs },
  subQuestion: { marginTop: space.md },
  choices: { gap: space.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  cardText: { flex: 1, gap: space.xxs },
});
