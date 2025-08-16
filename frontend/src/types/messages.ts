export enum MessageType {
  INIT = "init",
  LOAD_CODE = "load_code",
  GET_CODE_FOR_DISPLAY = "get_code_for_display",
  CODE_DISPLAY_RESPONSE = "code_display_response",
  ERROR = "error",
  PING = "ping",
  AGENT_FINAL = "agent_final",
  AGENT_PARTIAL = "agent_partial",
  USER = "user",
  UPDATE_IN_PROGRESS = "update_in_progress",
  UPDATE_FILE = "update_file",
  UPDATE_COMPLETED = "update_completed",
}

export enum Sender {
  ASSISTANT = "assistant",
  USER = "user",
}

export interface Message {
  type: MessageType;
  data: Record<string, any>;
  id?: string;
  timestamp?: number;
}

export const createMessage = (
  type: MessageType,
  data: Record<string, any> = {},
  id?: string,
  timestamp?: number
): Message => ({
  type,
  data,
  id,
  timestamp: timestamp || Date.now(),
});