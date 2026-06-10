import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PhotosStackParamList } from "../../navigation/types";
import { getPhotos, deletePhoto } from "../../api/photos";
import { ProgressPhoto } from "../../types";
import { Typography, Card, Button, Icon } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<PhotosStackParamList, "PhotosTimeline">;

const { width: screenW } = Dimensions.get("window");

export default function PhotosTimelineScreen({ navigation }: Props) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={lightTheme.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
          <View>
            <Typography variant="caption" color={lightTheme.textMuted} weight="600">
              VISUAL JOURNEY
            </Typography>
            <Typography variant="heading1" color={lightTheme.textPrimary} style={{ marginTop: space.xs }}>
              Progress Photos
            </Typography>
            <Typography variant="body" color={lightTheme.textSecondary} style={{ marginTop: space.sm }}>
              {photos.length} photo{photos.length !== 1 ? "s" : ""} captured
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("PhotoCompare")}
            style={{
              backgroundColor: lightTheme.primaryLight,
              paddingHorizontal: space.md,
              paddingVertical: space.sm,
              borderRadius: radius.md,
              flexDirection: "row",
              alignItems: "center",
              gap: space.xs,
            }}
          >
            <Icon name="GitCompare" size={14} color={lightTheme.primary} />
            <Typography variant="bodySmall" color={lightTheme.primary} weight="700">
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
                  backgroundColor: lightTheme.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: space.md,
                }}
              >
                <Icon name="Camera" size={36} color={lightTheme.primary} />
              </View>
              <Typography variant="heading3" color={lightTheme.textPrimary} align="center">
                No photos yet
              </Typography>
              <Typography variant="body" color={lightTheme.textSecondary} align="center" style={{ marginTop: space.sm }}>
                Take your first progress photo to start tracking your visual journey!
              </Typography>
              <View style={{ marginTop: space.lg, width: "100%" }}>
                <Button
                  title="Take First Photo"
                  onPress={() => navigation.navigate("PhotoCapture")}
                  variant="primary"
                  size="md"
                  icon={<Icon name="Camera" size={18} color={lightTheme.primaryText} />}
                />
              </View>
            </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: space.lg, gap: space.lg }}>
            {photos.map((photo) => (
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
                            backgroundColor: lightTheme.primaryLight,
                            paddingHorizontal: space.sm,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Typography variant="caption" color={lightTheme.primary} weight="700" style={{ textTransform: "uppercase" }}>
                            {photo.type}
                          </Typography>
                        </View>
                      </View>
                      <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                        {new Date(photo.date).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Typography>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(photo.id)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: lightTheme.errorBg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="Trash2" size={16} color={lightTheme.danger.DEFAULT} />
                    </TouchableOpacity>
                  </View>
                  {photo.notes && (
                    <View
                      style={{
                        marginTop: space.md,
                        padding: space.md,
                        backgroundColor: lightTheme.surfaceSecondary,
                        borderRadius: radius.md,
                        flexDirection: "row",
                        gap: space.sm,
                      }}
                    >
                      <Icon name="MessageSquare" size={14} color={lightTheme.textMuted} />
                      <Typography variant="bodySmall" color={lightTheme.textSecondary} style={{ flex: 1 }}>
                        {photo.notes}
                      </Typography>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}

        {photos.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginTop: space.lg }}>
            <Button
              title="Take New Photo"
              onPress={() => navigation.navigate("PhotoCapture")}
              variant="primary"
              size="lg"
              icon={<Icon name="Camera" size={20} color={lightTheme.primaryText} />}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
