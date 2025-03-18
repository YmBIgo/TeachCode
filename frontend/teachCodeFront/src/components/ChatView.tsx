import { RefObject, useEffect, useState } from "react"
import { ClaudeAsk, ClaudeMessage } from "../type/ClaudeMessage"
import { Box, Button, TextareaAutosize } from "@mui/material"
import ChatRow from "./ChatRow"

type Props = {
    wsRef: RefObject<WebSocket | null>
    messages: ClaudeMessage[]
}

const ChatView: React.FC<Props> = ({
    messages,
    wsRef
}) => {
    const [claudeAsk, setClaudeAsk] = useState<ClaudeAsk | "">("")
    const [primaryButtonText, setPrimaryButtonText] = useState<string>("")
    const [secondaryButtonText, setSecondaryButtonText] = useState<string>("")
    const [textAreaDisabled, setTextAreaDisabled] = useState<boolean>(false)
    const [inputValue, setInputValue] = useState("")
    const task = messages.length ? messages[0] : undefined

    const handleOnKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleSendMessage = () => {
        const text = inputValue.trim()
        if (text) {
            if (!messages.length) {
                const sendNewTask = JSON.stringify({
                    type: "newTask",
                    text
                })
                wsRef.current?.send(sendNewTask)
            }
            setInputValue("")
            setTextAreaDisabled(true)
            setClaudeAsk("")
        }
    }

    const handlePrimaryButtonClick = () => {
        const yesButtonClickedResponse = {
            type: "askResponse",
            askResponse: "yesButtonClicked"
        }
        switch(claudeAsk){
            case "command":
            case "tool":
                wsRef.current?.send(JSON.stringify(yesButtonClickedResponse))
                break
            case "completion_result":
                clearAllTask()
                break
        }
        setTextAreaDisabled(true)
        setClaudeAsk("")
    }

    const handleSecondaryButtonClick = () => {
        const noButtonClickedResponse = {
            type: "askResponse",
            askResponse: "noButtonClicked"
        }
        switch (claudeAsk){
            case "command":
            case "tool":
                wsRef.current?.send(JSON.stringify(noButtonClickedResponse))
        }
        setTextAreaDisabled(true)
        setClaudeAsk("")
    }

    const clearAllTask = () => {
        const clearTaskJson = {
            type: "clearTask"
        }
        wsRef.current?.send(JSON.stringify(clearTaskJson))
    }

    useEffect(() => {
        const lastMessage = messages.slice(messages.length - 1)[0]
        if(lastMessage) {
            switch(lastMessage.type){
                case "ask":
                    switch(lastMessage.ask){
                        case "command":
                            setTextAreaDisabled(false)
                            setClaudeAsk("command")
                            setPrimaryButtonText("Run Command")
                            setSecondaryButtonText("Reject")
                            break
                        case "tool":
                            setTextAreaDisabled(false)
                            setClaudeAsk("tool")
                            setPrimaryButtonText("Approve")
                            setSecondaryButtonText("Reject")
                            break
                        case "followup":
                            setTextAreaDisabled(false)
                            setClaudeAsk("followup")
                            setPrimaryButtonText("Follow up")
                            setSecondaryButtonText("Cancel")
                            break
                        case "completion_result":
                            setTextAreaDisabled(false)
                            setClaudeAsk("completion_result")
                            setPrimaryButtonText("Start New Task")
                            setSecondaryButtonText("")
                            break
                        // case "api_req_failed"
                        // case "request_limit_reached"
                    }
                    break
                case "say":
                    switch(lastMessage.say) {
                        case "text":
                            break
                        case "task":
                            break
                        case "error":
                            break
                        case "command_output":
                            break
                        case "show_answer":
                            break
                        case "completion_result":
                            break
                    }
            }
        }
    }, [messages])

    useEffect(() => {
        if (messages.length) return
        setClaudeAsk("")
    }, [messages.length])

    return (
        <Box
            sx={{
                width: "300px",
                height: "100vh",
                backgroundColor: "gray",
                overflow: "scroll"
            }}
            id="container"
        >
            {task &&
                <Box>
                    Your current task is "{task.text}"
                </Box>
            }
            <Box id="messages">
                {messages.map((message) => {
                    return <ChatRow message={message} />
                })}
            </Box>
            <Box>
                <TextareaAutosize
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleOnKeyDown}
                    disabled={textAreaDisabled}
                    style={{
                        width: "250px"
                    }}
                />
                <Box sx={{display: "flex", justifyContent: "space-between"}}>
                    <Button
                        disabled={!secondaryButtonText}
                        onClick={handleSecondaryButtonClick}
                    >
                        {secondaryButtonText}
                    </Button>
                    <Button
                        disabled={!primaryButtonText}
                        onClick={handlePrimaryButtonClick}
                    >
                        {primaryButtonText}
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default ChatView