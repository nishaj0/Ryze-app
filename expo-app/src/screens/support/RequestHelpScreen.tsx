import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { submitSupportTicket } from "../../api/support";
import { Typography, Card, Button, Input } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "RequestHelp">;

export default function RequestHelpScreen({ navigation }: Props) {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a subject.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please provide details about your request.");
      return;
    }

    setSubmitting(true);
    try {
      await submitSupportTicket({
        type: "HELP",
        title: title.trim(),
        description: description.trim(),
      });

      Alert.alert(
        "Request Submitted",
        "Your help request has been submitted. Our support team will review it and reply as soon as possible.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg }}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={{ padding: space.lg, gap: space.lg }}>
            <Typography variant="heading2" color={theme.textPrimary}>
              Request Help
            </Typography>
            <Typography variant="body" color={theme.textSecondary}>
              Need assistance or have a question? Describe what you need help with, and we'll get back to you shortly.
            </Typography>

            <Input
              label="Subject"
              placeholder="e.g. Question about custom workout splits"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            <Input
              label="How can we help you?"
              placeholder="e.g. I want to set up a 4-day workout routine but am not sure how to configure rest days..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={{ minHeight: 120, height: 120 }}
            />

            <Button
              title={submitting ? "Submitting..." : "Submit Request"}
              onPress={handleSubmit}
              loading={submitting}
              style={{ marginTop: space.md }}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
