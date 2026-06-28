import { defineExtensionMessaging } from '@webext-core/messaging';

type ProtocolMap = {
  echo(message: string): string;
};

export const messenger = defineExtensionMessaging<ProtocolMap>();
