export type ClaudeAsk =
    "command" |
    "api_req_failed" |
    "completion_result" |
    "tool" |
    "followup" |
    "request_limit_reached" |
    "check_accuracy"

export type ClaudeSay =
    "task" |
    "error" |
    "completion_result" |
    "text" |
    "command_output" |
    "show_answer" |
    "stat"

export type ClaudeMessage = {
    time: number;
    type: "ask" | "say"
    ask?: ClaudeAsk
    say?: ClaudeSay
    text?: string
}