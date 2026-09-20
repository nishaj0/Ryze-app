import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Timer, Plus, SkipForward, Play, X } from "lucide-react-native";

export interface RestTimerModalProps {
  visible: boolean;
  initialSeconds?: number;
  nextExerciseName?: string;
  nextSetNumber?: number;
  totalSets?: number;
  onStartNextSet: () => void;
  onSkip: () => void;
  onClose?: () => void;
}

export default function RestTimerModal({
  visible,
  initialSeconds = 90,
  nextExerciseName = "Next Exercise",
  nextSetNumber = 2,
  totalSets = 3,
  onStartNextSet,
  onSkip,
  onClose,
}: RestTimerModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [totalDuration, setTotalDuration] = useState(initialSeconds);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setSecondsLeft(initialSeconds);
      setTotalDuration(initialSeconds);
      progressAnim.setValue(1);

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  }, [visible, initialSeconds]);

  useEffect(() => {
    if (!visible) return;

    if (secondsLeft <= 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        const nextVal = prev - 1;
        if (nextVal <= 0) {
          clearInterval(timer);
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
          return 0;
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, secondsLeft]);

  // Update progress animation
  useEffect(() => {
    if (totalDuration > 0) {
      Animated.timing(progressAnim, {
        toValue: Math.max(0, secondsLeft / totalDuration),
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [secondsLeft, totalDuration]);

  const handleAdd30s = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setSecondsLeft((prev) => prev + 30);
    setTotalDuration((prev) => prev + 30);
  };

  const handleStartNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    onStartNextSet();
  };

  const handleSkip = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    onSkip();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#7a766c" />
            </TouchableOpacity>
          )}

          {/* Header Tag */}
          <View style={styles.headerTag}>
            <Timer size={14} color="#c24914" />
            <Text style={styles.headerTagText}>REST INTERVAL</Text>
          </View>

          {/* Big Countdown Timer */}
          <Text style={styles.countdownText}>{formatTime(secondsLeft)}</Text>

          {/* Linear Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          {/* Next Up Focus Info */}
          <View style={styles.nextUpCard}>
            <Text style={styles.nextUpLabel}>
              UP NEXT · SET {nextSetNumber} OF {totalSets}
            </Text>
            <Text style={styles.nextUpName} numberOfLines={1}>
              {nextExerciseName}
            </Text>
          </View>

          {/* Quick Time Adjusters */}
          <View style={styles.adjustRow}>
            <TouchableOpacity onPress={handleAdd30s} style={styles.adjustBtn} activeOpacity={0.7}>
              <Plus size={14} color="#1a1917" />
              <Text style={styles.adjustBtnText}>+30s</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} style={styles.adjustBtn} activeOpacity={0.7}>
              <SkipForward size={14} color="#7a766c" />
              <Text style={styles.skipBtnText}>Skip Rest</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            onPress={handleStartNext}
            activeOpacity={0.88}
            style={styles.startNextBtn}
          >
            <Play size={18} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.startNextBtnText}>Start Next Set</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26, 25, 23, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 24,
    alignItems: "center",
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f6f3ed",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fbeee8",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    marginBottom: 12,
  },
  headerTagText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    fontWeight: "700",
    color: "#c24914",
    letterSpacing: 0.8,
  },
  countdownText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 48,
    fontWeight: "700",
    color: "#1a1917",
    letterSpacing: -1,
    marginVertical: 4,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#f6f3ed",
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#c24914",
    borderRadius: 3,
  },
  nextUpCard: {
    width: "100%",
    backgroundColor: "#f6f3ed",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e2dc",
    padding: 12,
    alignItems: "center",
    marginVertical: 8,
  },
  nextUpLabel: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    fontWeight: "700",
    color: "#7a766c",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  nextUpName: {
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    color: "#1a1917",
  },
  adjustRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginVertical: 12,
  },
  adjustBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  adjustBtnText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    color: "#1a1917",
  },
  skipBtnText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    color: "#7a766c",
  },
  startNextBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    backgroundColor: "#c24914",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#c24914",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  startNextBtnText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
});
