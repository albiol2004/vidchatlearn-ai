import { useUserStore } from '@/stores/userStore';

export default function SettingsPage() {
  const { preferences, setPreferences } = useUserStore();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Customize your learning experience</p>
      </div>

      {/* Language Settings */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Language</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">I want to learn</label>
            <select
              value={preferences.targetLanguage}
              onChange={(e) => setPreferences({ targetLanguage: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">My native language</label>
            <select
              value={preferences.nativeLanguage}
              onChange={(e) => setPreferences({ nativeLanguage: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="es">Spanish</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">My level</label>
            <select
              value={preferences.level}
              onChange={(e) =>
                setPreferences({
                  level: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Voice</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Speaking speed: {preferences.speakingSpeed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={preferences.speakingSpeed}
              onChange={(e) => setPreferences({ speakingSpeed: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">AI Voice</label>
            <select
              value={preferences.voicePreference}
              onChange={(e) => setPreferences({ voicePreference: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="default">Default</option>
              <option value="male-1">Male 1</option>
              <option value="female-1">Female 1</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Privacy</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.storeTranscripts}
              onChange={(e) => setPreferences({ storeTranscripts: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">Store conversation transcripts</span>
          </label>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Settings are saved automatically
      </p>
    </div>
  );
}
