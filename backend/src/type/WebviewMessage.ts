export type WebviewMessageType =
    "maxRequestsPerTask" |
    "newTask" |
    "askResponse" |
    "clearTask" |
    "showAnswer"

export type ClaudeAskResponse =
    "yesButtonClicked" |
    "noButtonClicked"

export type WebviewMessage = {
    type: WebviewMessageType;
    text?: string;
    askResponse?: ClaudeAskResponse;
}