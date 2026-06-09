import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PhotosStackParamList } from "../../navigation/types";
import { getPhotos } from "../../api/photos";
import { ProgressPhoto } from "../../types";

type Props = NativeStackScreenProps<PhotosStackParamList, "PhotoCompare">;

export default function PhotoCompareScreen({ navigation }: Props) {
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
    } catch (err) {}
    finally { setLoading(false); }
  };

  const photo1 = photos.find((p) => p.id === selected1);
  const photo2 = photos.find((p) => p.id === selected2);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}><ActivityIndicator color="#6366F1" /></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 24 }}>Compare Photos</Text>

      {photos.length < 2 ? (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 32, alignItems: "center" }}>
          <Text style={{ color: "#94A3B8", fontSize: 16, textAlign: "center" }}>You need at least 2 photos to compare</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 8 }}>Photo 1</Text>
              {photo1 ? (
                <Image source={{ uri: photo1.cloudinaryUrl }} style={{ width: "100%", height: 200, borderRadius: 12 }} resizeMode="cover" />
              ) : (
                <View style={{ width: "100%", height: 200, backgroundColor: "#1E293B", borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ color: "#475569" }}>Select</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 8 }}>Photo 2</Text>
              {photo2 ? (
                <Image source={{ uri: photo2.cloudinaryUrl }} style={{ width: "100%", height: 200, borderRadius: 12 }} resizeMode="cover" />
              ) : (
                <View style={{ width: "100%", height: 200, backgroundColor: "#1E293B", borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ color: "#475569" }}>Select</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Select Photos</Text>
          {photos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              onPress={() => {
                if (!selected1) setSelected1(photo.id);
                else if (!selected2 && photo.id !== selected1) setSelected2(photo.id);
                else { setSelected1(photo.id); setSelected2(null); }
              }}
              style={{
                backgroundColor: selected1 === photo.id || selected2 === photo.id ? "#4F46E5" : "#1E293B",
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: selected1 === photo.id || selected2 === photo.id ? 2 : 0,
                borderColor: "#6366F1",
              }}
            >
              <Image source={{ uri: photo.cloudinaryUrl }} style={{ width: 60, height: 60, borderRadius: 8 }} resizeMode="cover" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 14 }}>{new Date(photo.date).toLocaleDateString()}</Text>
                <Text style={{ color: "#94A3B8", fontSize: 12, textTransform: "capitalize" }}>{photo.type}</Text>
              </View>
              {selected1 === photo.id && <Text style={{ color: "#fff", fontSize: 12 }}>1</Text>}
              {selected2 === photo.id && <Text style={{ color: "#fff", fontSize: 12 }}>2</Text>}
            </TouchableOpacity>
          ))}

          {(selected1 || selected2) && (
            <TouchableOpacity
              onPress={() => { setSelected1(null); setSelected2(null); }}
              style={{ backgroundColor: "#334155", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 12 }}
            >
              <Text style={{ color: "#94A3B8" }}>Clear Selection</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}
