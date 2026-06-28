export default defineBackground(() => {
  // @webext-core/messaging sample: reply to a content-script request.
  // @webext-core/messaging のサンプル: content script からのリクエストに応答します。
  messenger.onMessage('echo', (message) => message.data);
});
