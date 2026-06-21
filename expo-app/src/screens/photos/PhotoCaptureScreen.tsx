import React, { useState } from "react";
import { View, TouchableOpacity, Image, Alert, ScrollView } from "react-native";
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

export default function PhotoCaptureScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const theme = useTheme();
  const [type, setType] = useState<"FRONT" | "BACK" | "SIDE">("FRONT");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required");
        return;
      }
      result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library permission is required");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    }

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUri(manipulated.uri);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert("No photo", "Please take or select a photo first");
      return;
    }

    setUploading(true);
    try {
      await uploadPhoto(imageUri, type, new Date().toISOString(), notes || undefined);
      Alert.alert("Success", "Photo uploaded!", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

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
              onPress={() => setImageUri(null)}
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

            <Button
              title="Upload Photo"
              onPress={handleUpload}
              loading={uploading}
              disabled={uploading}
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
