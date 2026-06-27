import { defineExtensionMessaging } from '@webext-core/messaging';

// `キー(引数): 戻り値` を1行足すごとに送受信が型安全になる。
type ProtocolMap = {};

export const messenger = defineExtensionMessaging<ProtocolMap>();
