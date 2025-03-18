import { WebSocketServer } from "ws";
import { TeachCode } from "./teachCode";
import readline from "readline";
import { stdin, stdout } from "process";
import fs from "fs/promises"
import pWaitFor from "p-wait-for";
import { ClaudeAskResponse, WebviewMessageType } from "./type/WebviewMessage";
import { ClaudeAsk, ClaudeMessage, ClaudeSay, TeachCodeAskResponse } from "./type/TeachCodeMessage";

const rl = readline.createInterface({ input: stdin, output: stdout });
rl.question("Please Input working directory you want...", async (answer) => {
    try {
        const isExist = await fs.stat(answer)
    } catch (e) {
        console.log("Working Directory specified is not exists...")
        rl.close()
        return
    }
    createServer(answer)
    rl.close()
})

function createServer(workingDirectory: string) {
  const server = new WebSocketServer({ port: 8081 });
  server.on("connection", (socket) => {
    console.log("Connected With Client...");
    async function say(content: string, sayType: ClaudeSay): Promise<void> {
        const sayContentJson = JSON.stringify({
            type: "say",
            content,
            sayType
        })
        socket.send(sayContentJson)
    }
    async function ask(content: string, askType: ClaudeAsk): Promise<TeachCodeAskResponse> {
        const askContentJson = JSON.stringify({
            type: "ask",
            askType,
            content
        })
        socket.send(askContentJson)
        await pWaitFor(() => !!teachCode.askResponse, {interval: 500})
        const response = {
            askResponse: teachCode.askResponse as ClaudeAskResponse,
            text: teachCode.askResponseText
        }
        teachCode.clearWebViewAskResponse()
        return response as TeachCodeAskResponse
    }
    function sendState(messages: ClaudeMessage[]) {
        const stateJson = JSON.stringify({
            type: "state",
            messages
        })
        socket.send(stateJson)
    }
    let teachCode = new TeachCode(workingDirectory, say, ask, sendState);
    socket.on('message', (message) => {
        try {
            const messageJSON = JSON.parse(message.toString())
            // messageJSON have type
            // "askResponse" | "taskInput" | "showAnswer"
            switch (messageJSON.type as WebviewMessageType) {
                case "askResponse":
                    const askResponse = messageJSON.askResponse
                    const text = messageJSON.text
                    teachCode.handleWebViewAskResponse(askResponse, text)
                    break
                case "newTask":
                    teachCode.clearTask()
                    const taskText = messageJSON.text
                    teachCode.startTask(taskText)
                    break
                case "clearTask":
                    teachCode.clearTask()
                    break
                case "showAnswer":
                    const questionId = messageJSON.questionId
                    if (typeof questionId == "string") {
                        teachCode.showAnswer(questionId)
                    }
                    break
                default:
                    break
            }
        } catch(e) {
            console.error(e)
            return
        }
    })
  });
};
