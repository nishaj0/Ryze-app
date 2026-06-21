import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import { lightTheme } from "../theme/colors";
import { radius, space } from "../theme/spacing";

interface ExerciseImageCarouselProps {
  images: { url: string }[];
  intervalMs?: number;
}

export default function ExerciseImageCarousel({
  images,
  intervalMs = 2000,
}: ExerciseImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

  if (!images || images.length === 0) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator color={lightTheme.textMuted} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {images.map((img, index) => (
        <Image
          key={img.url}
          source={{ uri: img.url }}
          style={[
            styles.image,
            { opacity: index === currentIndex ? 1 : 0 },
          ]}
          resizeMode="cover"
          onLoadEnd={() => index === 0 && setLoading(false)}
        />
      ))}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={lightTheme.textMuted} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 200,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: lightTheme.surfaceSecondary,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: lightTheme.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.surfaceSecondary,
  },
});
