import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PhotosStackParamList } from "../../navigation/types";
import { getPhotos } from "../../api/photos";
import { ProgressPhoto } from "../../types";
import { Typography, Card, Button, Icon, PhotoCompareScreenSkeleton } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<PhotosStackParamList, "PhotoCompare">;

const { width: screenW } = Dimensions.get("window");

export default function PhotoCompareScreen({ navigation }: Props) {
  const theme = useTheme();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [selected1, setSelected1] = useState<string | null>(null);
  const [selected2, setSelected2] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const res = await getPhotos();
      setPhotos(res.photos);
    } catch (err) {
      console.error("[PhotoCompare] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const photo1 = photos.find((p) => p.id === selected1);
  const photo2 = photos.find((p) => p.id === selected2);

  // Calculate days between photos
  const daysBetween = photo1 && photo2
    ? Math.abs(Math.round((new Date(photo1.date).getTime() - new Date(photo2.date).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <PhotoCompareScreenSkeleton />
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
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
          <Typography variant="caption" color={theme.textMuted} weight="600">
            SIDE BY SIDE
          </Typography>
          <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
            Compare Photos
          </Typography>
          <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.sm }}>
            See your transformation
          </Typography>
        </View>

        {photos.length < 2 ? (
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
                <Icon name="GitCompare" size={36} color={theme.primary} />
              </View>
              <Typography variant="heading3" color={theme.textPrimary} align="center">
                Need more photos
              </Typography>
              <Typography variant="body" color={theme.textSecondary} align="center" style={{ marginTop: space.sm }}>
                Capture at least 2 photos to start comparing your progress.
              </Typography>
            </Card>
          </View>
        ) : (
          <>
            {/* Side by side comparison */}
            <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
              <View style={{ flexDirection: "row", gap: space.md }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginBottom: space.sm }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: theme.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="caption" color={theme.primaryText} weight="700">
                        1
                      </Typography>
                    </View>
                    <Typography variant="caption" color={theme.textMuted} weight="700">
                      BEFORE
                    </Typography>
                  </View>
                  <Card shadow="sm" style={{ padding: 0, overflow: "hidden" }}>
                    {photo1 ? (
                      <Image source={{ uri: photo1.cloudinaryUrl }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: 220,
                          backgroundColor: theme.surfaceSecondary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="Image" size={32} color={theme.textMuted} />
                      </View>
                    )}
                  </Card>
                  {photo1 && (
                    <Typography variant="caption" color={theme.textPrimary} weight="600" style={{ marginTop: space.sm, textAlign: "center" }}>
                      {new Date(photo1.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </Typography>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginBottom: space.sm }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: theme.success,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="caption" color={theme.primaryText} weight="700">
                        2
                      </Typography>
                    </View>
                    <Typography variant="caption" color={theme.textMuted} weight="700">
                      AFTER
                    </Typography>
                  </View>
                  <Card shadow="sm" style={{ padding: 0, overflow: "hidden" }}>
                    {photo2 ? (
                      <Image source={{ uri: photo2.cloudinaryUrl }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: 220,
                          backgroundColor: theme.surfaceSecondary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="Image" size={32} color={theme.textMuted} />
                      </View>
                    )}
                  </Card>
                  {photo2 && (
                    <Typography variant="caption" color={theme.textPrimary} weight="600" style={{ marginTop: space.sm, textAlign: "center" }}>
                      {new Date(photo2.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </Typography>
                  )}
                </View>
              </View>

              {photo1 && photo2 && (
                <View
                  style={{
                    backgroundColor: theme.primaryLight,
                    borderRadius: radius.md,
                    padding: space.md,
                    marginTop: space.lg,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.sm,
                  }}
                >
                  <Icon name="Calendar" size={16} color={theme.primary} />
                  <Typography variant="bodySmall" color={theme.primary} weight="700">
                    {daysBetween} day{daysBetween !== 1 ? "s" : ""} of progress
                  </Typography>
                </View>
              )}
            </View>

            {/* Photo selection */}
            <View style={{ paddingHorizontal: space.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Icon name="Images" size={18} color={theme.textPrimary} />
                <Typography variant="heading3" color={theme.textPrimary}>
                  Select Photos
                </Typography>
              </View>

              {photos.map((photo) => {
                const isFirst = selected1 === photo.id;
                const isSecond = selected2 === photo.id;
                const isSelected = isFirst || isSecond;
                return (
                  <TouchableOpacity
                    key={photo.id}
                    onPress={() => {
                      if (!selected1) setSelected1(photo.id);
                      else if (!selected2 && photo.id !== selected1) setSelected2(photo.id);
                      else {
                        setSelected1(photo.id);
                        setSelected2(null);
                      }
                    }}
                    style={{ marginBottom: space.sm }}
                    activeOpacity={0.8}
                  >
                    <Card
                      shadow="sm"
                      style={{
                        padding: space.md,
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderWidth: isSelected ? 2 : 1,
                        backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                        <Image
                          source={{ uri: photo.cloudinaryUrl }}
                          style={{ width: 56, height: 56, borderRadius: radius.md }}
                          resizeMode="cover"
                        />
                        <View style={{ flex: 1 }}>
                          <Typography variant="body" color={theme.textPrimary} weight="600">
                            {new Date(photo.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </Typography>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginTop: 2 }}>
                            <View
                              style={{
                                backgroundColor: theme.primary,
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                                borderRadius: 4,
                              }}
                            >
                              <Typography variant="caption" color={theme.primaryText} weight="700" style={{ fontSize: 10 }}>
                                {photo.type}
                              </Typography>
                            </View>
                          </View>
                        </View>
                        {isFirst && (
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: theme.primary,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography variant="bodySmall" color={theme.primaryText} weight="700">
                              1
                            </Typography>
                          </View>
                        )}
                        {isSecond && (
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: theme.success,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography variant="bodySmall" color={theme.primaryText} weight="700">
                              2
                            </Typography>
                          </View>
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}

              {(selected1 || selected2) && (
                <View style={{ marginTop: space.lg }}>
                  <Button
                    title="Clear Selection"
                    onPress={() => { setSelected1(null); setSelected2(null); }}
                    variant="secondary"
                    size="md"
                    icon={<Icon name="X" size={18} color={theme.secondaryText} />}
                  />
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
