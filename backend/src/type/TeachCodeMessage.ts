import { ClaudeAskResponse } from "./WebviewMessage"

export type TeachCodeAskResponse = {
    askResponse: ClaudeAskResponse;
    text?: string;
}

export type TeachCodeRequestResult = {
    didEndLoop: boolean;
    inputTokenCount: number;
    outputTokenCount: number;
}

export type TeachCodeQuestion = {
    questionCode: string;
    codeLine: number;
    codeFilePath: string;
    questionCodeComment: string;
    answerCode: string;
}

export type ClaudeAsk =
    "command" |
    "api_req_failed" |
    "completion_result" |
    "tool" |
    "followup" |
    "request_limit_reached"

export type ClaudeSay =
    "task" |
    "error" |
    "completion_result" |
    "text" |
    "command_output" |
    "show_answer"

export type ClaudeMessage = {
    time: number;
    type: "ask" | "say"
    ask?: ClaudeAsk
    say?: ClaudeSay
    text?: string
}