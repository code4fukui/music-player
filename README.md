# music-player

https://code4fukui.github.io/music-player/

## album playlist

`album.csv` にアルバムURLを1行ずつ追加します。
各アルバムURLの `playlist.json` から曲情報を取得して再生します。

```csv
url
https://code4fukui.github.io/music-slowtechno-fukui/
```

画面のアルバム選択から再生するアルバムを切り替えられます。
アルバムを最後まで再生すると、`album.csv` の次のアルバムへ自動で移ります。
最後のアルバムの後は先頭のアルバムに戻ります。

## m3u8

URLパラメータ `m3u8` を指定すると、M3U8プレイリストを直接再生できます。

```txt
https://code4fukui.github.io/music-player/?m3u8=https://example.com/playlist.m3u8
```

## reference

- [opendata-songs](https://github.com/code4fukui/opendata-songs/)
- [MediaSession API](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession)
