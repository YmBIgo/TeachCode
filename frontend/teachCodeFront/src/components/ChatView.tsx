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
            case "check_accuracy":
                wsRef.current?.send(JSON.stringify(yesButtonClickedResponse))
                break
            case "completion_result":
                clearAllTask()
                handleSendMessage()
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
                        case "check_accuracy":
                            setTextAreaDisabled(false)
                            setClaudeAsk("check_accuracy")
                            setPrimaryButtonText("Check Accuracy")
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
                height: "calc(100vh - 190px)",
                backgroundColor: "gray",
                overflow: "scroll"
            }}
            id="container"
        >
            {task ?
                <Box sx={{
                    border: "3px solid blue",
                    backgroundColor: "white",
                    padding: "10px",
                    borderRadius: "10px",
                    position: "absolute",
                    top: "10px",
                    left: "0px",
                    width: "270px"
                }}>
                    <p style={{
                        color: "white",
                        backgroundColor: "blue",
                        margin: "5px",
                        padding: "5px 10px",
                        borderRadius: "10px"
                    }}>
                        Your Current Task
                    </p>
                    Your current task is "{task.text?.slice(0, 100)}..."
                </Box>
            : (
                <Box sx={{
                    border: "3px solid blue",
                    backgroundColor: "white",
                    padding: "10px",
                    borderRadius: "10px",
                    position: "absolute",
                    top: "10px",
                    left: "0px",
                    width: "270px"
                }}>
                    <p>Let's start your task!</p>
                </Box>
            )}
            <Box
                id="messages"
                sx={{
                    marginTop: "170px"
                }}
            >
                {messages.map((message) => {
                    return <ChatRow message={message} />
                })}
            </Box>
            <Box sx={{
                position: "absolute",
                bottom: "10px",
                left: "0px",
                zIndex: "100",
                backgroundColor: "gray"
            }}>
                <TextareaAutosize
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleOnKeyDown}
                    disabled={textAreaDisabled}
                    style={{
                        width: "290px"
                    }}
                    minRows={3}
                />
                <Box sx={{display: "flex", justifyContent: "space-between"}}>
                    <Button
                        disabled={!secondaryButtonText}
                        onClick={handleSecondaryButtonClick}
                        variant="contained"
                        color="inherit"
                    >
                        {secondaryButtonText || "　"}
                    </Button>
                    <Button
                        disabled={!primaryButtonText}
                        onClick={handlePrimaryButtonClick}
                        variant="contained"
                        color="primary"
                    >
                        {primaryButtonText || "　"}
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default ChatView