import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PhotosStackParamList } from "../../navigation/types";
import { getPhotos, deletePhoto } from "../../api/photos";
import { ProgressPhoto } from "../../types";

type Props = NativeStackScreenProps<PhotosStackParamList, "PhotosTimeline">;

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
    } catch (err) {}
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
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
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}><ActivityIndicator color="#6366F1" /></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff" }}>Progress Photos</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("PhotoCompare")}
          style={{ backgroundColor: "#334155", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ color: "#6366F1", fontSize: 12 }}>Compare</Text>
        </TouchableOpacity>
      </View>

      {photos.length === 0 ? (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 32, alignItems: "center" }}>
          <Text style={{ color: "#94A3B8", fontSize: 16, marginBottom: 16 }}>No photos yet</Text>
          <Text style={{ color: "#64748B", fontSize: 14, textAlign: "center" }}>Take your first progress photo to track your journey!</Text>
        </View>
      ) : (
        photos.map((photo) => (
          <View key={photo.id} style={{ backgroundColor: "#1E293B", borderRadius: 16, marginBottom: 16, overflow: "hidden" }}>
            <Image
              source={{ uri: photo.cloudinaryUrl }}
              style={{ width: "100%", height: 300 }}
              resizeMode="cover"
            />
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{new Date(photo.date).toLocaleDateString()}</Text>
                  <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 4, textTransform: "capitalize" }}>{photo.type}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(photo.id)} style={{ padding: 8 }}>
                  <Text style={{ color: "#EF4444", fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              </View>
              {photo.notes && <Text style={{ color: "#CBD5E1", fontSize: 14, marginTop: 8 }}>{photo.notes}</Text>}
            </View>
          </View>
        ))
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate("PhotoCapture")}
        style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16 }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Take New Photo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
