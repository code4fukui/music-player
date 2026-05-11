# music-player

クリーンなダークUIを採用した、シンプルでモダンなウェブ音楽プレイヤーです。MediaSession APIを活用して、ネイティブOSおよびハードウェアのメディアコントロール（ロック画面、Bluetooth、CarPlay）に対応し、CSVまたはM3U8経由のプレイリストをサポートしています。

## デモ

https://code4fukui.github.io/music-player/

## 機能

- **ネイティブメディアコントロール**: MediaSession APIを通じてシステムと統合し、ロック画面、通知シェード、接続デバイスからの操作を可能にします。
- **アルバムベースのプレイリスト**: シンプルな `album.csv` ファイルにURLを列挙することで、アルバムのコレクションを読み込むことができます。
- **M3U8の直接再生**: `?m3u8=` クエリパラメータにプレイリストのURLを渡すことで、HLSストリームを直接再生できます。
- **メタデータの自動取得**: プレイリストにトラックのメタデータが含まれていない場合、プレイヤーは音声ファイルから直接ID3タグ（タイトル、アーティスト、アートワーク）を解析します。
- **シームレスな再生**: 次のトラックへ自動的に進みます。アルバムの再生が終了すると、シームレスにリスト内の次のアルバムへ移行し、最後まで再生すると先頭に戻ってループします。
- **PWA対応**: 対応デバイスではProgressive Web Appとしてインストール可能で、ネイティブアプリに近い体験を提供します。
- **レスポンシブなダークUI**: アルバムアートを備えたクリーンでレスポンシブなインターフェースにより、デスクトップとモバイルの両方で快適に動作します。

## 使い方

プレイヤーに音楽を読み込む方法は2つあります。

### 1. アルバムリストの使用 (`album.csv`)

これはデフォルトのモードです。プレイヤーは `album.csv` ファイルからアルバムURLのリストを読み込みます。

1. プロジェクトのルートディレクトリに `album.csv` ファイルを作成します。
2. 各アルバムのURLを1行ずつ追加します。各URLは `playlist.json` ファイルを含むディレクトリを指している必要があります。

**例: `album.csv`**
```csv
url
https://code4fukui.github.io/music-slowtechno-fukui/
https://code4fukui.github.io/music-numeral-system/
```

プレイヤーには、アルバムを切り替えるためのドロップダウンメニューが用意されています。アルバムの再生が終了すると、自動的にリスト内の次のアルバムを読み込んで再生します。

### 2. M3U8 URLの直接指定

`m3u8` クエリパラメータにURLを指定することで、M3U8（HLS）プレイリストを直接再生できます。

**URLの例:**
```
https://code4fukui.github.io/music-player/?m3u8=https://example.com/playlist.m3u8
```

### プレイリストのJSONフォーマット

`album.csv` で指定する各アルバムのURLは、そのルートに `playlist.json` ファイルをホストしている必要があります。プレイヤーはJSONの構造に対して柔軟に設計されていますが、一般的なフォーマットは以下のようになります。

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

プレイヤーは、トラックリストとして `tracks` や `files`、音声ソースとして `src` や `url` といった他の一般的なキーも認識します。

## 参考資料

- [opendata-songs](https://github.com/code4fukui/opendata-songs/)
- [MediaSession API](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession)
