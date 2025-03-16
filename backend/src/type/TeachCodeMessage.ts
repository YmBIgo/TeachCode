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