import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Image, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PhotosStackParamList } from "../../navigation/types";
import { getPhotos, deletePhoto } from "../../api/photos";
import { ProgressPhoto } from "../../types";
import { Typography, Card, Button, Icon, PhotosTimelineScreenSkeleton } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";

type Props = NativeStackScreenProps<PhotosStackParamList, "PhotosTimeline">;

const { width: screenW } = Dimensions.get("window");

export default function PhotosTimelineScreen({ navigation }: Props) {
  const theme = useTheme();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const res = await getPhotos();
      setPhotos(res.photos);
    } catch (err) {
      console.error("[PhotosTimeline] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Photo", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePhoto(id);
            setPhotos((prev) => prev.filter((p) => p.id !== id));
          } catch (err) {
            Alert.alert("Error", "Failed to delete photo");
          }
        },
      },
    ]);
  };

  const handleDownload = async (photo: ProgressPhoto) => {
    try {
      // Request media library permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Photo library permission is required to save photos. Please enable it in Settings."
        );
        return;
      }

      setDownloadingId(photo.id);

      // Download the image to a temp file
      const filename = `ryze-progress-${photo.type.toLowerCase()}-${photo.id}.jpg`;
      const localUri = `${FileSystem.cacheDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(photo.cloudinaryUrl, localUri);

      if (downloadResult.status !== 200) {
        throw new Error("Download failed");
      }

      // Save to device camera roll
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      Alert.alert("Saved!", "Photo saved to your gallery.");
    } catch (err: any) {
      console.error("[PhotosTimeline] download error:", err);
      Alert.alert("Download failed", "Could not save the photo. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <PhotosTimelineScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
          <View>
            <Typography variant="caption" color={theme.textMuted} weight="600">
              VISUAL JOURNEY
            </Typography>
            <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
              Progress Photos
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.sm }}>
              {photos.length} photo{photos.length !== 1 ? "s" : ""} captured
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("PhotoCompare")}
            style={{
              backgroundColor: theme.primaryLight,
              paddingHorizontal: space.md,
              paddingVertical: space.sm,
              borderRadius: radius.md,
              flexDirection: "row",
              alignItems: "center",
              gap: space.xs,
            }}
          >
            <Icon name="GitCompare" size={14} color={theme.primary} />
            <Typography variant="bodySmall" color={theme.primary} weight="700">
              COMPARE
            </Typography>
          </TouchableOpacity>
        </View>

        {photos.length === 0 ? (
          <View style={{ paddingHorizontal: space.lg }}>
            <Card padding="lg" shadow="sm" style={{ alignItems: "center" }}>
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
              <Typography variant="heading3" color={theme.textPrimary} align="center">
                No photos yet
              </Typography>
              <Typography variant="body" color={theme.textSecondary} align="center" style={{ marginTop: space.sm }}>
                Take your first progress photo to start tracking your visual journey!
              </Typography>
              <View style={{ marginTop: space.lg, width: "100%" }}>
                <Button
                  title="Take First Photo"
                  onPress={() => navigation.navigate("PhotoCapture")}
                  variant="primary"
                  size="md"
                  icon={<Icon name="Camera" size={18} color={theme.primaryText} />}
                />
              </View>
            </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: space.lg, gap: space.lg }}>
            {photos.map((photo) => {
              const isDownloading = downloadingId === photo.id;
              return (
                <Card key={photo.id} shadow="sm" style={{ padding: 0, overflow: "hidden" }}>
                  <Image
                    source={{ uri: photo.cloudinaryUrl }}
                    style={{ width: "100%", height: 320 }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: space.lg }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: 4 }}>
                          <View
                            style={{
                              backgroundColor: theme.primaryLight,
                              paddingHorizontal: space.sm,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Typography variant="caption" color={theme.primary} weight="700" style={{ textTransform: "uppercase" }}>
                              {photo.type}
                            </Typography>
                          </View>
                        </View>
                        <Typography variant="body" color={theme.textPrimary} weight="600">
                          {new Date(photo.date).toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Typography>
                      </View>

                      {/* Action buttons: download + delete */}
                      <View style={{ flexDirection: "row", gap: space.sm }}>
                        <TouchableOpacity
                          onPress={() => handleDownload(photo)}
                          disabled={isDownloading}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: theme.primaryLight,
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: isDownloading ? 0.5 : 1,
                          }}
                        >
                          <Icon name={isDownloading ? "Loader" : "Download"} size={16} color={theme.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDelete(photo.id)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: theme.errorBg,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name="Trash2" size={16} color={theme.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {photo.notes && (
                      <View
                        style={{
                          marginTop: space.md,
                          padding: space.md,
                          backgroundColor: theme.surfaceSecondary,
                          borderRadius: radius.md,
                          flexDirection: "row",
                          gap: space.sm,
                        }}
                      >
                        <Icon name="MessageSquare" size={14} color={theme.textMuted} />
                        <Typography variant="bodySmall" color={theme.textSecondary} style={{ flex: 1 }}>
                          {photo.notes}
                        </Typography>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {photos.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginTop: space.lg }}>
            <Button
              title="Take New Photo"
              onPress={() => navigation.navigate("PhotoCapture")}
              variant="primary"
              size="lg"
              icon={<Icon name="Camera" size={20} color={theme.primaryText} />}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
