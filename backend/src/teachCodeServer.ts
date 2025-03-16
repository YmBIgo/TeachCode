import Websocket from "ws";
import { TeachCode } from "./teachCode";
import readline from "readline";
import { stdin, stdout } from "process";
import fs from "fs/promises"
import pWaitFor from "p-wait-for";
import { ClaudeAskResponse, WebviewMessageType } from "./type/WebviewMessage";
import { TeachCodeAskResponse } from "./type/TeachCodeMessage";

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
  const server = new Websocket.Server({ port: 8080 });
  server.on("connection", (socket) => {
    console.log("Connected With Client...");
    async function say(content: string): Promise<void> {
        const sayContentJson = JSON.stringify({
            type: "say",
            content
        })
        socket.send(sayContentJson)
    }
    async function ask(content: string, askType: string): Promise<TeachCodeAskResponse> {
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
    const teachCode = new TeachCode(workingDirectory, say, ask);
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
                    break
                case "clearTask":
                    break
                case "showAnswer":
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
