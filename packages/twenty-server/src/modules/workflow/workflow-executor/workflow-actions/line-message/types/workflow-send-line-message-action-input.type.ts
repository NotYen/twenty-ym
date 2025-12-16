export type WorkflowSendLineMessageActionInput = {
  /**
   * LINE User ID to send message to
   * 可以是單一 User ID 或從 Person 實體取得
   */
  lineUserId: string;

  /**
   * 訊息內容
   */
  message: string;
};
