import { Anthropic } from "@anthropic-ai/sdk"
import { Tool } from "./type/Tool"

export class AnthropicHandler {
    private tools: Tool[]
    private client: Anthropic
    private attemptCount: number
    private model: string
    constructor(tools: Tool[]) {
        this.tools = tools
        this.client = new Anthropic({apiKey: process.env["CLAUDE_API_KEY"]})
        this.attemptCount = 0
        this.model = "claude-3-5-sonnet-20241022"
    }
    async createMessage(systemPrompt: string, history: Anthropic.MessageParam[]): Promise<Anthropic.Messages.Message> {
        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 8192,
                system: systemPrompt,
                messages: history,
                tools: this.tools,
                tool_choice: { type: "auto" }
            })
            this.attemptCount = 0
            return response
        } catch (error) {
            console.error(error)
            this.attemptCount += 1
            // should implement yes button
            if ( this.attemptCount > 3 ) throw new Error("fail to get api response")
            return this.createMessage(systemPrompt, history)
        }
    }
    async createIntentMessage(systemPrompt: string, code: string): Promise<Anthropic.Messages.Message> {
        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 8192,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: code
                    }
                ]
            })
            this.attemptCount = 0
            return response
        } catch (error) {
            console.error(error)
            this.attemptCount += 1
            if (this.attemptCount > 3) throw new Error("fail to get api response")
            return this.createIntentMessage(systemPrompt, code)
        }
    }
    getModel(): string {
        return this.model
    }
}