import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { submitSupportTicket } from "../../api/support";
import { Typography, Card, Button, Input } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "ReportBug">;

export default function ReportBugScreen({ navigation }: Props) {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a summary of the bug.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please provide a description of steps to reproduce the bug.");
      return;
    }

    setSubmitting(true);
    try {
      await submitSupportTicket({
        type: "BUG",
        title: title.trim(),
        description: description.trim(),
      });

      Alert.alert(
        "Bug Reported",
        "Thank you for reporting this issue! Our team will look into it and update your ticket status.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to submit bug report.");
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
              Report a Bug
            </Typography>
            <Typography variant="body" color={theme.textSecondary}>
              Please describe the issue in detail, including steps to reproduce it. We appreciate your feedback to make Ryze better.
            </Typography>

            <Input
              label="Bug Title / Summary"
              placeholder="e.g. App crashes when viewing progress photos"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            <Input
              label="Steps to Reproduce / Details"
              placeholder="e.g. 1. Go to Photos tab&#10;2. Select Compare&#10;3. Tap compare photos"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={{ minHeight: 120, height: 120 }}
            />

            <Button
              title={submitting ? "Submitting..." : "Submit Report"}
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
