import { M3U8 } from "https://code4fukui.github.io/M3U8/M3U8.js";
import { MediaTags } from "https://code4fukui.github.io/jsmediatags-es/MediaTags.js";

const audio = document.getElementById('player');
const $ = (id) => document.getElementById(id);

let index = 0;
let queue = [];
let albums = [];

const bin2src = (bin, type) => {
  return URL.createObjectURL(new Blob([bin], { type }))
};

async function loadTrack(i) {
  const t = queue[i];
  if (!t) return;
  if (!t.title) {
    const bin = new Uint8Array(await (await fetch(t.src)).arrayBuffer());
    audio.src = bin2src(bin, "audio/mp3");
    const tags = await MediaTags.decode(bin);
    t.title = tags.tags.title;
    t.artist = tags.tags.artist;
    if (tags.tags.picture) {
      const p = tags.tags.picture;
      const bin = new Uint8Array(p.data);
      const ext = p.format.substring(p.format.indexOf("/") + 1);
      t.artwork = [
        {
          src: bin2src(bin, p.format),
          sizes: "512x512",
          type: p.format,
        }
      ];
    }
  } else {
    audio.src = t.src;
  }
  $('title').textContent = t.title || '';
  $('artist').textContent = t.artist || '';
  $('art').src = (t.artwork?.[t.artwork.length - 1]?.src) || '';

  // Media Session: メタデータ
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: t.artist,
      album: t.album,
      artwork: t.artwork,
    });
    // 再生位置情報（スクラブ/UIの精度が増す）
    updatePositionState();
  }
}

function updatePositionState() {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: isFinite(audio.duration) ? audio.duration : 0,
      playbackRate: audio.playbackRate || 1,
      position: isFinite(audio.currentTime) ? audio.currentTime : 0,
    });
  } catch (_) { /* iOS未対応版があっても安全に無視 */ }
}

async function prev() {
  if (!queue.length) return;
  index = (index - 1 + queue.length) % queue.length;
  await loadTrack(index);
  audio.play();
}
async function next() {
  if (!queue.length) return;
  if (index === queue.length - 1 && albums.length) {
    const albumIndex = albums.findIndex((album) => album.url === $("album")?.value);
    const nextAlbum = albums[(albumIndex + 1) % albums.length];
    if (nextAlbum) {
      await selectAlbum(nextAlbum.url, true);
      return;
    }
  }
  index = (index + 1) % queue.length;
  await loadTrack(index);
  audio.play();
}

// リモコン（CarPlay/BTボタン/ロック画面/イヤホン）ハンドラ
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play',  () => audio.play());
  navigator.mediaSession.setActionHandler('pause', () => audio.pause());
  navigator.mediaSession.setActionHandler('previoustrack', prev);
  navigator.mediaSession.setActionHandler('nexttrack',     next);
  navigator.mediaSession.setActionHandler('seekto', (d) => {
    if (typeof d.seekTime === 'number') audio.currentTime = d.seekTime;
    updatePositionState();
  });
}

// UIイベント
$('play').onclick  = () => audio.play();   // iOSは「ユーザー操作で開始」が要件
$('pause').onclick = () => audio.pause();
$('prev').onclick  = prev;
$('next').onclick  = next;
/*
$('load').onclick  = () => {
  const url = $('src').value.trim();
  if (url) {
    queue[0].src = url;
    loadTrack(0);
  }
};
*/

audio.addEventListener('loadedmetadata', () => updatePositionState());
audio.addEventListener('timeupdate', () => {
  updatePositionState();
  $('time').textContent = formatTime(audio.currentTime);
});
audio.addEventListener('play',  () => {
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
});
audio.addEventListener('pause', () => {
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
});
audio.addEventListener('ended', next);

function formatTime(sec) {
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function resolveUrl(src, baseUrl) {
  if (!src) return "";
  return new URL(src, baseUrl).href;
}

function albumBaseUrl(url) {
  const baseUrl = new URL(url, location.href);
  if (!baseUrl.pathname.endsWith("/")) {
    baseUrl.pathname += "/";
  }
  return baseUrl.href;
}

function getPlaylistTracks(playlist) {
  if (Array.isArray(playlist)) return playlist;
  if (Array.isArray(playlist.playlist_clips)) {
    return playlist.playlist_clips.map((item) => item.clip || item);
  }
  return playlist.files || playlist.tracks || playlist.songs || [];
}

function normalizeTrack(track, baseUrl, album) {
  const src = track.src || track.audio_url || track.audioUrl || track.url;
  const image = track.image_large_url || track.image_url || track.artwork?.[0]?.src;
  const artist = track.artist || track.display_name || album.user_display_name || album.artist || "";

  return {
    src: resolveUrl(src, baseUrl),
    title: track.title || "",
    artist,
    album: album.name || album.title || "",
    artwork: image ? [{
      src: resolveUrl(image, baseUrl),
      sizes: "512x512",
      type: image.endsWith(".png") ? "image/png" : "image/jpeg",
    }] : undefined,
  };
}

function playlistToFiles(playlist, playlistUrl) {
  return getPlaylistTracks(playlist)
    .map((track) => normalizeTrack(track, playlistUrl, playlist))
    .filter((track) => track.src);
}

function albumName(url) {
  const u = new URL(url, location.href);
  const slug = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || u.hostname);
  return slug.replace(/^music-/, "").replaceAll("-", " ");
}

function parseAlbumCSV(csv) {
  return csv.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line, i) => line && !(i === 0 && line.toLowerCase() === "url"))
    .map((url) => ({ url, name: albumName(url) }));
}

async function loadAlbumInfo(album) {
  const baseUrl = albumBaseUrl(album.url);
  const playlistUrl = new URL("playlist.json", baseUrl).href;
  const playlist = await (await fetch(playlistUrl)).json();
  return {
    ...album,
    name: playlist.name || playlist.title || album.name,
    playlistUrl,
    playlist,
  };
}

async function selectAlbum(url, autoplay = false) {
  let album = albums.find((album) => album.url === url);
  if (!album?.playlist) {
    album = await loadAlbumInfo(album || { url, name: albumName(url) });
    const albumIndex = albums.findIndex((album) => album.url === url);
    if (albumIndex >= 0) albums[albumIndex] = album;
  }
  const playlistUrl = album.playlistUrl || new URL("playlist.json", albumBaseUrl(url)).href;
  const playlist = album.playlist;
  const files = playlistToFiles(playlist, playlistUrl);
  await init(files);
  const select = $("album");
  if (select) select.value = url;
  if ($("albumtitle")) $("albumtitle").textContent = album.name;
  if (autoplay) audio.play();
}

function setupAlbumSelect() {
  const select = $("album");
  if (!select) return;
  select.textContent = "";
  for (const album of albums) {
    const option = document.createElement("option");
    option.value = album.url;
    option.textContent = album.name;
    select.appendChild(option);
  }
  select.onchange = () => selectAlbum(select.value, true);
}

// 初期化
export const init = async (files) => {
  queue = files;
  index = 0;
  await loadTrack(index);
};

export const initByAlbumCSV = async (url = "./album.csv") => {
  const csv = await (await fetch(url)).text();
  albums = await Promise.all(parseAlbumCSV(csv).map(async (album) => {
    try {
      return await loadAlbumInfo(album);
    } catch (e) {
      console.error(e);
      return album;
    }
  }));
  setupAlbumSelect();
  if (albums.length) {
    await selectAlbum(albums[0].url);
  }
};

export const initByPlaylist = async (url, autoplay = false) => {
  await selectAlbum(url, autoplay);
};

export const initByM3U8 = async (url) => {
  const m3u8 = await M3U8.fetch(url);
  const queue = m3u8.getFiles().map(i => ({ src: i }));
  init(queue);
};
