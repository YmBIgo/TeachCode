import { useEffect, useRef, useState } from "react"
import ChatView from "./components/ChatView"
import { ClaudeMessage } from "./type/ClaudeMessage"
import { Snackbar } from "@mui/material"

function App() {
  const wsRef = useRef<WebSocket>(null)
  const [messages, setMessages] = useState<ClaudeMessage[]>([])
  const [sayMessage, setSayMessage] = useState<string>("")
  const [askMessage, setAskMessage] = useState<string>("")
  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8081')
    wsRef.current.onopen = () => {
    }
    wsRef.current.onmessage = (event) => {
      const originalMessage = typeof event.data === "string"
        ? event.data
        : event.data.toString()
      console.log(originalMessage);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parsedMessage: any
      try {
        if (typeof originalMessage === "string") parsedMessage = JSON.parse(originalMessage)
        else if (typeof originalMessage === "object") parsedMessage = originalMessage
        else parsedMessage = JSON.parse(originalMessage)
      } catch (e) {
        console.error(e)
        parsedMessage = {}
      }
      const type = parsedMessage?.type
      switch (type){
        case "ask":
          setAskMessage(parsedMessage?.content.slice(0, 100) || "")
          break
        case "say":
          if (parsedMessage?.say === "stat") return
          setSayMessage(parsedMessage?.content.slice(0, 100) || "")
          break
        case "state":
          setMessages(parsedMessage?.messages.slice(0, 100) || [])
          break
      }
    }
  }, [])
  return (
    <>
      <ChatView
        messages={messages}
        wsRef={wsRef}
      />
      <Snackbar
        id="saySnackbar"
        open={!!sayMessage}
        message={sayMessage || undefined}
        autoHideDuration={5000}
        onClose={() => setSayMessage("")}
      />
      <Snackbar
        id="askSnackbar"
        open={!!askMessage}
        message={askMessage || undefined}
        autoHideDuration={5000}
        onClose={() => setAskMessage("")}
      />
    </>
  )
}

export default App
