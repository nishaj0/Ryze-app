import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PhotosStackParamList } from "../../navigation/types";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadPhoto } from "../../api/photos";
import { Typography, Card, Button, Icon, Input } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<PhotosStackParamList, "PhotoCapture">;

type UploadStatus = "idle" | "uploading" | "success" | "failed";

export default function PhotoCaptureScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const theme = useTheme();
  const [type, setType] = useState<"FRONT" | "BACK" | "SIDE">("FRONT");
  const [notes, setNotes] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedPhotoUri, setUploadedPhotoUri] = useState<string | null>(null);

  const pickImage = async (useCamera: boolean) => {
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take photos. Please enable it in Settings.",
          [{ text: "OK" }]
        );
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Photo library permission is required to select photos. Please enable it in Settings.",
          [{ text: "OK" }]
        );
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
      });
    }

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUri(manipulated.uri);
      // Reset upload state when a new image is picked
      setUploadStatus("idle");
      setUploadError(null);
      setUploadedPhotoUri(null);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert("No photo", "Please take or select a photo first");
      return;
    }

    setUploadStatus("uploading");
    setUploadError(null);

    try {
      const res = await uploadPhoto(imageUri, type, new Date().toISOString(), notes || undefined);
      setUploadedPhotoUri(res.photo.cloudinaryUrl);
      setUploadStatus("success");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please check your connection and try again.";
      setUploadError(message);
      setUploadStatus("failed");
    }
  };

  const handleRetry = () => {
    setUploadStatus("idle");
    setUploadError(null);
  };

  const handleDone = () => {
    navigation.goBack();
  };

  // --- Success screen ---
  if (uploadStatus === "success") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl, alignItems: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: theme.successBg,
              alignItems: "center",
              justifyContent: "center",
              marginTop: space.xl,
              marginBottom: space.lg,
            }}
          >
            <Icon name="CheckCircle" size={40} color={theme.success} />
          </View>

          <Typography variant="heading2" color={theme.textPrimary} align="center">
            Photo Uploaded!
          </Typography>
          <Typography
            variant="body"
            color={theme.textSecondary}
            align="center"
            style={{ marginTop: space.sm, marginBottom: space.xl }}
          >
            Your progress photo has been saved successfully.
          </Typography>

          {uploadedPhotoUri && (
            <Card shadow="sm" style={{ padding: 0, overflow: "hidden", width: "100%", marginBottom: space.xl }}>
              <Image
                source={{ uri: uploadedPhotoUri }}
                style={{ width: "100%", height: 320 }}
                resizeMode="cover"
              />
              <View style={{ padding: space.md, flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <View
                  style={{
                    backgroundColor: theme.primaryLight,
                    paddingHorizontal: space.sm,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Typography variant="caption" color={theme.primary} weight="700">
                    {type}
                  </Typography>
                </View>
                <Typography variant="bodySmall" color={theme.textMuted}>
                  {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </Typography>
              </View>
            </Card>
          )}

          <View style={{ width: "100%", gap: space.md }}>
            <Button
              title="Take Another Photo"
              onPress={() => {
                setImageUri(null);
                setUploadStatus("idle");
                setUploadError(null);
                setUploadedPhotoUri(null);
                setNotes("");
              }}
              variant="secondary"
              size="lg"
              icon={<Icon name="Camera" size={20} color={theme.secondaryText} />}
            />
            <Button
              title="View Timeline"
              onPress={handleDone}
              variant="primary"
              size="lg"
              icon={<Icon name="Images" size={20} color={theme.primaryText} />}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: space.lg }}>
          <Typography variant="caption" color={theme.textMuted} weight="600">
            NEW PHOTO
          </Typography>
          <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
            Take Progress Photo
          </Typography>
          <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.sm }}>
            Track your visual transformation
          </Typography>
        </View>

        {!imageUri ? (
          <View style={{ gap: space.md, marginBottom: space.lg }}>
            <TouchableOpacity onPress={() => pickImage(true)} activeOpacity={0.8}>
              <Card shadow="sm" style={{ alignItems: "center", padding: space.xl }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: space.md,
                  }}
                >
                  <Icon name="Camera" size={36} color={theme.primary} />
                </View>
                <Typography variant="heading3" color={theme.textPrimary}>
                  Take Photo
                </Typography>
                <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginTop: space.xs }}>
                  Use your camera
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => pickImage(false)} activeOpacity={0.8}>
              <Card shadow="sm" style={{ alignItems: "center", padding: space.xl }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: space.md,
                  }}
                >
                  <Icon name="Image" size={36} color={theme.primary} />
                </View>
                <Typography variant="heading3" color={theme.textPrimary}>
                  Choose from Gallery
                </Typography>
                <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginTop: space.xs }}>
                  Select existing photo
                </Typography>
              </Card>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginBottom: space.lg }}>
            <Card shadow="sm" style={{ padding: 0, overflow: "hidden" }}>
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: 400 }} resizeMode="cover" />
            </Card>
            <TouchableOpacity
              onPress={() => {
                setImageUri(null);
                setUploadStatus("idle");
                setUploadError(null);
              }}
              style={{
                marginTop: space.md,
                padding: space.md,
                backgroundColor: theme.surfaceSecondary,
                borderRadius: radius.md,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: space.sm,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Icon name="RefreshCw" size={16} color={theme.textSecondary} />
              <Typography variant="body" color={theme.textSecondary}>
                Choose Different Photo
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        {imageUri && (
          <>
            <View style={{ marginBottom: space.lg }}>
              <Typography variant="label" color={theme.textSecondary} style={{ marginBottom: space.sm }}>
                PHOTO TYPE
              </Typography>
              <View style={{ flexDirection: "row", gap: space.sm }}>
                {(["FRONT", "BACK", "SIDE"] as const).map((t) => {
                  const isSelected = type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setType(t)}
                      style={{
                        flex: 1,
                        backgroundColor: isSelected ? theme.primary : theme.surface,
                        borderRadius: radius.md,
                        padding: space.md,
                        alignItems: "center",
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? theme.primary : theme.border,
                      }}
                    >
                      <Typography variant="body" color={isSelected ? theme.primaryText : theme.textPrimary} weight="600">
                        {t}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ marginBottom: space.lg }}>
              <Input
                label="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                placeholder="How are you feeling?"
                multiline
                numberOfLines={4}
                style={{ minHeight: 100, textAlignVertical: "top" }}
              />
            </View>

            {/* Upload progress indicator */}
            {uploadStatus === "uploading" && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: space.md,
                  padding: space.lg,
                  backgroundColor: theme.primaryLight,
                  borderRadius: radius.md,
                  marginBottom: space.md,
                }}
              >
                <ActivityIndicator size="small" color={theme.primary} />
                <Typography variant="body" color={theme.primary} weight="600">
                  Uploading photo…
                </Typography>
              </View>
            )}

            {/* Error banner with retry */}
            {uploadStatus === "failed" && uploadError && (
              <View
                style={{
                  padding: space.md,
                  backgroundColor: theme.errorBg,
                  borderRadius: radius.md,
                  marginBottom: space.md,
                  gap: space.sm,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Icon name="AlertCircle" size={16} color={theme.danger} />
                  <Typography variant="body" color={theme.danger} weight="600">
                    Upload failed
                  </Typography>
                </View>
                <Typography variant="bodySmall" color={theme.danger}>
                  {uploadError}
                </Typography>
                <TouchableOpacity
                  onPress={handleRetry}
                  style={{
                    marginTop: space.xs,
                    paddingVertical: space.sm,
                    paddingHorizontal: space.md,
                    backgroundColor: theme.danger,
                    borderRadius: radius.sm,
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.xs,
                  }}
                >
                  <Icon name="RefreshCw" size={14} color="#fff" />
                  <Typography variant="bodySmall" color="#fff" weight="700">
                    Retry Upload
                  </Typography>
                </TouchableOpacity>
              </View>
            )}

            <Button
              title={uploadStatus === "uploading" ? "Uploading…" : "Upload Photo"}
              onPress={handleUpload}
              loading={uploadStatus === "uploading"}
              disabled={uploadStatus === "uploading"}
              variant="primary"
              size="lg"
              icon={<Icon name="Upload" size={20} color={theme.primaryText} />}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
