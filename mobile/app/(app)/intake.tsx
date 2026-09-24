import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/hooks/useAuth";
import type {
  RelationshipType,
  MannerOfDeath,
  Suddenness,
  MatchPreference,
  TalkFrequency,
} from "../../src/lib/types";
import * as Localization from "expo-localization";

// --- Reusable pill selector ---
function PillSelect<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pills}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.pill, value === opt.value && styles.pillSelected]}
            onPress={() => onSelect(opt.value)}
          >
            <Text
              style={[
                styles.pillText,
                value === opt.value && styles.pillTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const RELATIONSHIPS: { value: RelationshipType; label: string }[] = [
  { value: "sibling", label: "Sibling" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "partner", label: "Partner" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

const MANNER: { value: MannerOfDeath; label: string }[] = [
  { value: "illness", label: "Illness" },
  { value: "accident", label: "Accident" },
  { value: "violence", label: "Violence" },
  { value: "overdose", label: "Overdose" },
  { value: "suicide", label: "Suicide" },
  { value: "natural", label: "Natural causes" },
  { value: "unknown", label: "Unknown" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const SUDDENNESS: { value: Suddenness; label: string }[] = [
  { value: "sudden", label: "Sudden" },
  { value: "gradual", label: "Gradual" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const TIME_OPTIONS = [
  "Less than 1 month",
  "1–3 months",
  "3–6 months",
  "6–12 months",
  "1–2 years",
  "2–5 years",
  "5+ years",
];

const TALK_FREQUENCY: { value: TalkFrequency; label: string }[] = [
  { value: "daily", label: "Most days" },
  { value: "few_times_a_week", label: "A few times a week" },
  { value: "weekly", label: "Once a week or so" },
  { value: "on_hard_days", label: "When a hard day hits" },
  { value: "not_sure", label: "Not sure yet" },
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

export default function IntakeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    if (!relationship) {
      Alert.alert("Please tell us your relationship to the person who died.");
      return;
    }
    if (!timeSince) {
      Alert.alert("Please tell us how long it's been.");
      return;
    }
    if (!matchPref) {
      Alert.alert("Please choose a matching preference.");
      return;
    }

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
    else router.replace("/(app)");
  };

  if (prefilling) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1C1917" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.intro}>
        This is private — encrypted and readable only by the person who matches
        you. It's not shared with anyone else. Take your time.
      </Text>

      {/* Relationship */}
      <PillSelect
        label="Your relationship to the person who died"
        options={RELATIONSHIPS}
        value={relationship}
        onSelect={setRelationship}
      />

      {relationship && (
        <View style={styles.field}>
          <Text style={styles.label}>
            Any detail? (e.g. "older brother", "stepmom")
          </Text>
          <TextInput
            style={styles.textInput}
            value={relationshipDetail}
            onChangeText={setRelationshipDetail}
            placeholder="Optional"
            placeholderTextColor="#A8A29E"
          />
        </View>
      )}

      {/* Manner of death */}
      <PillSelect
        label="How did they die?"
        options={MANNER}
        value={manner}
        onSelect={setManner}
      />

      {/* Suddenness */}
      <PillSelect
        label="Was it sudden or gradual?"
        options={SUDDENNESS}
        value={suddenness}
        onSelect={setSuddenness}
      />

      {/* Age of the person */}
      <View style={styles.field}>
        <Text style={styles.label}>How old were they?</Text>
        <TextInput
          style={styles.textInput}
          value={deceasedAge}
          onChangeText={setDeceasedAge}
          placeholder="e.g. 24, or 'early 20s'"
          placeholderTextColor="#A8A29E"
        />
      </View>

      {/* Time since */}
      <View style={styles.field}>
        <Text style={styles.label}>How long has it been?</Text>
        <View style={styles.pills}>
          {TIME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.pill, timeSince === opt && styles.pillSelected]}
              onPress={() => setTimeSince(opt)}
            >
              <Text
                style={[
                  styles.pillText,
                  timeSince === opt && styles.pillTextSelected,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Match preference */}
      <View style={styles.field}>
        <Text style={styles.label}>Matching preference</Text>
        {MATCH_PREFS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.matchCard,
              matchPref === opt.value && styles.matchCardSelected,
            ]}
            onPress={() => setMatchPref(opt.value)}
          >
            <Text
              style={[
                styles.matchCardTitle,
                matchPref === opt.value && styles.matchCardTitleSelected,
              ]}
            >
              {opt.label}
            </Text>
            <Text style={styles.matchCardDesc}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pace — optional */}
      <PillSelect
        label="How often would you like to talk?"
        options={TALK_FREQUENCY}
        value={talkFrequency}
        onSelect={(v) => setTalkFrequency(talkFrequency === v ? null : v)}
      />

      {/* Topics to avoid — optional */}
      <View style={styles.field}>
        <Text style={styles.label}>
          {"Anything you'd rather not talk about?"}
        </Text>
        <Text style={styles.hint}>
          {"Optional. We'll keep it in mind when choosing your match. Your match doesn't see your answers here, so let them know too if you'd like."}
        </Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={avoidTopics}
          onChangeText={setAvoidTopics}
          placeholder="e.g. religion, how they died, the funeral"
          placeholderTextColor="#A8A29E"
          multiline
          numberOfLines={3}
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>

      {/* Financial strain — optional, never inferred */}
      <View style={styles.field}>
        <Text style={styles.label}>
          Is financial strain part of what you're navigating?
        </Text>
        <Text style={styles.hint}>
          Some people want to match on this. Totally optional — never assumed
          from anything else.
        </Text>
        <View style={styles.pills}>
          <TouchableOpacity
            style={[styles.pill, financialStrain === true && styles.pillSelected]}
            onPress={() => setFinancialStrain(true)}
          >
            <Text
              style={[
                styles.pillText,
                financialStrain === true && styles.pillTextSelected,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, financialStrain === false && styles.pillSelected]}
            onPress={() => setFinancialStrain(false)}
          >
            <Text
              style={[
                styles.pillText,
                financialStrain === false && styles.pillTextSelected,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, financialStrain === null && styles.pillSelected]}
            onPress={() => setFinancialStrain(null)}
          >
            <Text
              style={[
                styles.pillText,
                financialStrain === null && styles.pillTextSelected,
              ]}
            >
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Free text */}
      <View style={styles.field}>
        <Text style={styles.label}>
          Anything else you want a match to know?
        </Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={freeText}
          onChangeText={setFreeText}
          placeholder="Optional — whatever feels important"
          placeholderTextColor="#A8A29E"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{isEdit ? "Save changes" : "Submit"}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>
        This information is encrypted at rest and readable only by the person
        who matches you by hand. It is never shared with your match directly — it
        helps us understand who to connect you with.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAF9",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  intro: {
    fontSize: 15,
    color: "#78716C",
    lineHeight: 22,
    marginTop: 16,
    marginBottom: 24,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1917",
    marginBottom: 10,
  },
  hint: {
    fontSize: 13,
    color: "#A8A29E",
    marginBottom: 10,
    lineHeight: 18,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: "#D6D3D1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  pillSelected: {
    backgroundColor: "#1C1917",
    borderColor: "#1C1917",
  },
  pillText: {
    fontSize: 15,
    color: "#44403C",
  },
  pillTextSelected: {
    color: "#fff",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D6D3D1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1C1917",
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 100,
  },
  matchCard: {
    borderWidth: 1,
    borderColor: "#D6D3D1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  matchCardSelected: {
    borderColor: "#1C1917",
    backgroundColor: "#1C1917",
  },
  matchCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1917",
    marginBottom: 4,
  },
  matchCardTitleSelected: {
    color: "#fff",
  },
  matchCardDesc: {
    fontSize: 14,
    color: "#57534E",
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: "#1C1917",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  footer: {
    fontSize: 13,
    color: "#A8A29E",
    lineHeight: 18,
    marginTop: 20,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
