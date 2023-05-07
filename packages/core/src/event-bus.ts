import {
  generateEventBusHelpers,
  EventBridgeWrapper,
} from 'jfsi/node/event-bus';
import { EventBus } from 'sst/node/event-bus';

declare module 'jfsi/node/event-bus' {
  interface EventBusEvents {
    'chats.awaiting': {
      organizationId: string;
      documentId: string;
      chatId: string;
    };
  }
}

const { publishEvent } = generateEventBusHelpers(
  'unbind',
  EventBus['event-bus'].eventBusName
);

export { publishEvent };
