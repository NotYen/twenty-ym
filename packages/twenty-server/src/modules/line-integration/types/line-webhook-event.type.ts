/**
 * LINE Webhook Event Types
 * 參考: https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects
 */

export interface LineWebhookBody {
  destination: string;
  events: LineWebhookEvent[];
}

export type LineWebhookEvent =
  | LineFollowEvent
  | LineUnfollowEvent
  | LineMessageEvent
  | LinePostbackEvent;

export interface LineBaseEvent {
  type: string;
  timestamp: number;
  source: LineEventSource;
  webhookEventId: string;
  deliveryContext: {
    isRedelivery: boolean;
  };
}

export interface LineEventSource {
  type: 'user' | 'group' | 'room';
  userId?: string;
  groupId?: string;
  roomId?: string;
}

export interface LineFollowEvent extends LineBaseEvent {
  type: 'follow';
  replyToken: string;
}

export interface LineUnfollowEvent extends LineBaseEvent {
  type: 'unfollow';
}

export interface LineMessageEvent extends LineBaseEvent {
  type: 'message';
  replyToken: string;
  message: {
    id: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker';
    text?: string;
  };
}

export interface LinePostbackEvent extends LineBaseEvent {
  type: 'postback';
  replyToken: string;
  postback: {
    data: string;
    params?: any;
  };
}
