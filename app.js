import { M3U8 } from "https://code4fukui.github.io/M3U8/M3U8.js";
import { MediaTags } from "https://code4fukui.github.io/jsmediatags-es/MediaTags.js";

const audio = document.getElementById('player');
const $ = (id) => document.getElementById(id);

let index = 0;
let queue = [];

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
  index = (index - 1 + queue.length) % queue.length;
  await loadTrack(index);
  audio.play();
}
async function next() {
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
audio.addEventListener('play',  () => navigator.mediaSession.playbackState = 'playing');
audio.addEventListener('pause', () => navigator.mediaSession.playbackState = 'paused');
audio.addEventListener('ended', next);

function formatTime(sec) {
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// 初期化
export const init = async (files) => {
  queue = files;
  index = 0;
  await loadTrack(index);
};

export const initByM3U8 = async (url) => {
  const m3u8 = await M3U8.fetch(url);
  const queue = m3u8.getFiles().map(i => ({ src: i }));
  init(queue);
};
