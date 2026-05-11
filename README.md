# music-player

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

A simple, modern web music player with a clean, dark UI. It leverages the MediaSession API for native OS and hardware media controls (lock screen, Bluetooth, CarPlay) and supports playlists via CSV or M3U8.

## Demo

https://code4fukui.github.io/music-player/

## Features

- **Native Media Controls**: Integrates with the system via the MediaSession API, allowing control from the lock screen, notification shade, and connected devices.
- **Album-Based Playlists**: Load a collection of albums by listing their URLs in a simple `album.csv` file.
- **Direct M3U8 Playback**: Play HLS streams directly by passing the playlist URL as a `?m3u8=` query parameter.
- **Automatic Metadata**: If a track lacks metadata in the playlist, the player will parse ID3 tags (title, artist, artwork) directly from the audio file.
- **Seamless Playback**: Automatically advances to the next track. Upon finishing an album, it seamlessly transitions to the next one in the list, looping back to the start.
- **PWA Ready**: Installable as a Progressive Web App for a native-like experience on supported devices.
- **Responsive Dark UI**: A clean, responsive interface with album art that works great on desktop and mobile.

## Usage

There are two ways to load music into the player.

### 1. Using an Album List (`album.csv`)

This is the default mode. The player loads a list of album URLs from an `album.csv` file.

1.  Create an `album.csv` file in your project's root directory.
2.  Add the URLs of your albums, one per line. Each URL must point to a directory containing a `playlist.json` file.

**Example `album.csv`:**
```csv
url
https://code4fukui.github.io/music-slowtechno-fukui/
https://code4fukui.github.io/music-numeral-system/
```

The player provides a dropdown menu to switch between albums. When an album finishes, it automatically loads and plays the next one in the list.

### 2. Using a Direct M3U8 URL

You can play an M3U8 (HLS) playlist directly by providing its URL in the `m3u8` query parameter.

**Example URL:**
```
https://code4fukui.github.io/music-player/?m3u8=https://example.com/playlist.m3u8
```

### Playlist JSON Format

Each album URL specified in `album.csv` must host a `playlist.json` file at its root. The player is designed to be flexible with the JSON structure, but a typical format looks like this:

```json
{
  "name": "Album Title",
  "artist": "Album Artist",
  "playlist_clips": [
    {
      "title": "Track 1",
      "artist": "Track Artist (optional)",
      "audio_url": "path/to/track1.mp3",
      "image_url": "path/to/artwork1.jpg"
    },
    {
      "title": "Track 2",
      "audio_url": "path/to/track2.mp3"
    }
  ]
}
```
The player also recognizes other common keys, such as `tracks` or `files` for the track list, and `src` or `url` for the audio source.

## References

- [opendata-songs](https://github.com/code4fukui/opendata-songs/)
- [MediaSession API](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession)