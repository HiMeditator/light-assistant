### Light Assistant ユーザーマニュアル

プラグインバージョン v0.0.3 適用

**機械翻訳を使用しているため、内容に不正確な部分が含まれる場合があります。**

[English Version](user-manual.md)
[简体中文版](user-manual_zh_cn.md)

## モデルの設定

![](img/manual/01.png)

### 設定ファイルを通じたモデルの設定

プラグインインターフェース右上隅の `Open Config` オプションをクリックして、プラグイン設定ファイルに移動します。ここでチャットモデルを迅速に設定できます。

設定フォーマットは次のとおりです：

```json
{
  "models": [
    {
      "type": "ollama/openai",
      "model": "model name",
      "title": "display name",
      "base_url": "https://model_base_url",
      "api_key": "sk-********************************"
    }
  ]
}
```

- `type`: 必須。モデルタイプで、選択肢は `ollama` または `openai` です。前者はローカル [Ollama](https://github.com/ollama/ollama) の設定されたモデルを使用し、後者は node.js の OpenAI ライブラリを使用してクラウドモデルを呼び出します。
- `model`: 必須。モデル名。例: `llama3.3-70b-instruct`。
- `title`: 省略可能。モデルの表示名。設定しない場合、デフォルトは `model` の値になります。
- `base_url`: `type` が `openai` の場合は必須。API 要求の基本 URL であり、モデルプロバイダーによって異なります。
- `api_key`: `type` が `openai` の場合は必須。API キーはモデルプロバイダーから取得します。

以下はいくつかのプロバイダーの `base_url` です：
- OpenAI: https://api.openai.com/v1
- DeepSeek: https://api.deepseek.com
- アリクラウド: https://dashscope.aliyuncs.com/compatible-mode/v1

以下は具体的な例です：

```json
{
  "models": [
    {
      "type": "ollama",
      "model": "qwen2.5",
      "title": "qwen2.5-7b"
    },
    {
      "type": "ollama",
      "model": "deepseek-r1"
    },
    {
      "type": "openai",
      "model": "qwen-max",
      "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "api_key": "sk-********************************"
    },
    {
      "model": "gpt-4o",
      "type": "openai",
      "base_url": "https://api.openai.com/v1",
      "api_key": "sk-proj-<omitted>"
    }
  ]
}
```

設定ファイルを作成したら、`Select Model` オプションにマウスをホバーさせ、表示される `Load Config` オプションをクリックすることで、設定されたモデルを読み込むことができます。

### プラグインを通じたモデルの設定

プラグイン左下隅にマウスをホバーさせ、`Select Model` オプションをクリックし、表示される `Add Model` オプションをクリックすると、モデル追加ウィンドウが表示されます。関連情報を入力して提出することで、モデルを追加できます。

## チャット

モデルを設定したらチャットを開始できます。入力ボックスに内容を入力し、`Ctrl+Enter` を押すか、送信オプションをクリックすることで、チャット内容を送信できます。

プラグインインターフェース右上隅の `View Chat Logs` オプションをクリックすることで、チャット記録ファイルを確認できます。

プラグインインターフェース右上隅の `New Chat Session` オプションをクリックすることで、新しいセッションを作成できます。

## その他

プラグインインターフェース右上隅の `Open Settings` をクリックして、設定を変更できます。