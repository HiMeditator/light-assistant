# Light Assistant User Manual

Applies to plugin version v0.1.0

- [简体中文版](user-manual_zh_cn.md)
- [日本語版](user-manual_ja.md)

![](./img/manual/01.png)

## Configuring Models

### Configuring Models via Configuration File

Click the `Open Config` option in the top-right corner of the plugin interface to navigate to the plugin configuration file, where you can quickly configure chat models.

The configuration format is as follows:

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

- `type`: Required. Model type, options are: `ollama` or `openai`. `ollama` uses locally configured models with [Ollama](https://github.com/ollama/ollama), while the `openai` uses the OpenAI library in Node.js to call cloud-based models.
- `model`: Required. Model name, for example: `llama3.3-70b-instruct`.
- `title`: Optional. Display name for the model. If not set, it defaults to the value of `model`.
- `base_url`: Required if `type` is `openai`. The base URL for API requests, depending on your model service provider.
- `api_key`: Required if `type` is `openai`. The API key is obtained from your model service provider.

Here are the `base_url` of some providers:
- OpenAI: https://api.openai.com/v1
- DeepSeek: https://api.deepseek.com
- Alibaba Cloud: https://dashscope.aliyuncs.com/compatible-mode/v1

Here is a specific example:

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

After writing the configuration file, hover over the `Select Model` option and click the `Load Config` option that appears to load the configured models.

### Configuring Models via Plugin Interface

In the lower-left corner of the plugin, hover over the `Select Model` option and click the `Add Model` option that appears. Fill in the relevant information and submit to add a model.

## Chatting

### Chat Options

After configuring the models, you can start chatting. Enter content in the input box and press `Ctrl+Enter` or click the send button to send the chat content.

Click the `Add Context` option above the input box to add file contents from the IDE as context. Only files that have been opened in the code editor are supported.

Click on any file already added to the context to remove it.

### Conversation Management

You can click the `Chat Sessions` option in the top-right corner of the plugin interface to view chat record files.

You can click the `New Chat Session` option in the top-right corner of the plugin interface to create a new conversation.

### Chat Content

While the LLM is generating content, hover over the top-left corner of the user message box and click the `Stop Generation` option to stop the current response.

## Settings

You can click the `Open Settings` option in the top-right corner of the plugin interface to access the plugin settings page.