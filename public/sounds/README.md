# Audio Files for Romish

## Accept Notification Sound

**Required File**: `accept-notification.mp3`

### Setup Instructions

1. Find or create your desired notification sound
2. Name it `accept-notification.mp3`
3. Place it in this directory (`public/sounds/`)

### Sound Recommendations

- **Duration**: 1-3 seconds
- **Volume**: Loud and attention-grabbing
- **Type**: Alert sound (bell, chime, horn, buzzer)
- **Format**: MP3 (best compatibility)

### Example Sound Sources

- **Free Sound Libraries**:
  - [Freesound.org](https://freesound.org/) - Search "notification" or "alert"
  - [Zapsplat.com](https://www.zapsplat.com/) - Free sound effects
  - [Mixkit.co](https://mixkit.co/free-sound-effects/) - Free audio

- **Create Your Own**:
  - Record custom sound
  - Use audio editing software (Audacity, etc.)
  - Export as MP3

### Current Status

⚠️ **Audio file not included** - You must add your own sound file.

The Accept Phase System will work without the audio file, but players won't hear the notification sound when the accept popup appears.

### Testing

After adding the file, test by:
1. Starting the dev server: `npm run dev`
2. Filling queue to 10 players
3. Listening for the sound when accept popup appears
4. Check browser console for audio errors

### Customization

To use a different filename or format, edit `src/components/AcceptMatchPopup.vue` line 28:

```javascript
audio.value = new Audio('/sounds/YOUR_SOUND_FILE.mp3');
```

To adjust volume, edit line 29:

```javascript
audio.value.volume = 0.7; // 0.0 (mute) to 1.0 (full volume)
```
