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