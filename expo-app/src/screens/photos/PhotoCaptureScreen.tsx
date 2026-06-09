import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PhotosStackParamList } from "../../navigation/types";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadPhoto } from "../../api/photos";

type Props = NativeStackScreenProps<PhotosStackParamList, "PhotoCapture">;

export default function PhotoCaptureScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
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
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 24 }}>Take Progress Photo</Text>

      {!imageUri ? (
        <View style={{ gap: 12, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => pickImage(true)}
            style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 32, alignItems: "center" }}
          >
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📷</Text>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Take Photo</Text>
            <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>Use your camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => pickImage(false)}
            style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 32, alignItems: "center" }}
          >
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🖼️</Text>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Choose from Gallery</Text>
            <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>Select existing photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ marginBottom: 24 }}>
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: 400, borderRadius: 16 }} resizeMode="cover" />
          <TouchableOpacity
            onPress={() => setImageUri(null)}
            style={{ marginTop: 12, backgroundColor: "#334155", borderRadius: 8, padding: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#94A3B8" }}>Choose Different Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {imageUri && (
        <>
          <Text style={{ color: "#CBD5E1", marginBottom: 12, fontSize: 14 }}>Photo Type</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {(["FRONT", "BACK", "SIDE"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={{
                  flex: 1,
                  backgroundColor: type === t ? "#4F46E5" : "#1E293B",
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  borderWidth: type === t ? 2 : 0,
                  borderColor: "#6366F1",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Notes (optional)</Text>
          <TextInput
            style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 24, fontSize: 16, minHeight: 80, textAlignVertical: "top" }}
            value={notes}
            onChangeText={setNotes}
            placeholder="How are you feeling?"
            placeholderTextColor="#475569"
            multiline
          />

          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploading}
            style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center" }}
          >
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Upload Photo</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
