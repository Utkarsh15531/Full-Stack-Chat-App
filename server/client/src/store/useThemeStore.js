import {create} from "zustand";

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem("chat-theme") || "coffee",
    soundEnabled: localStorage.getItem("sound-enabled") === "true" || true, // Default to true
    setTheme: (theme) => {
        localStorage.setItem("chat-theme", theme);
        set({theme});
    },
    setSoundEnabled: (enabled) => {
        localStorage.setItem("sound-enabled", enabled.toString());
        set({soundEnabled: enabled});
    },
}));
