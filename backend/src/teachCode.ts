import defaultShell from "default-shell"
import * as diff from "diff"
import { execa } from "execa"
import fs from "fs/promises"
import { globby } from "globby"
import osName from "os-name"
import Anthropic from "@anthropic-ai/sdk"

import { Tool, ToolName } from "./type/Tool"
import { AnthropicHandler } from "./claude"
import { ClaudeAskResponse } from "./type/WebviewMessage"
import { TeachCodeAskResponse, TeachCodeQuestion, TeachCodeRequestResult } from "./type/TeachCodeMessage"
import path from "path"
import { uuid } from "./util"
import { TextBlockParam } from "@anthropic-ai/sdk/resources/messages"

const SYSTEM_PROMPT = (workingDirectory: string) => {
return `You are TeachCodes Dev, a highly skilled software developer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.

====
 
CAPABILITIES

- You can read and analyze code in various programming languages, and can write clean, efficient, and well-documented code.
- You can debug complex issues and providing detailed explanations, offering architectural insights and design patterns.
- You have access to tools that let you analyze software projects, execute CLI commands on the user's computer, list files in a directory, read and write files, and ask follow-up questions. These tools help you effectively accomplish a wide range of tasks, such as writing code, making edits or improvements to existing files, understanding the current state of a project, performing system operations, and much more.
    - For example, when asked to make edits or improvements you might use the list_files and read_file tools to examine the contents of relevant files, list the code structure or make necessary edits, then use the write_to_file tool to implement changes.
- The execute_command tool lets you run commands on the user's computer and should be used whenever you feel it can help accomplish the user's task. When you need to execute a CLI command, you must provide a clear explanation of what the command does. Prefer to execute complex CLI commands over creating executable scripts, since they are more flexible and easier to run.

====

RULES

- Unless otherwise specified by the user, you MUST accomplish your task within the following directory: ${
	workingDirectory
}
- Your current working directory is '${process.cwd()}', and you cannot \`cd\` into a different directory to complete a task. You are stuck operating from '${process.cwd()}', so be sure to pass in the appropriate 'path' parameter when using tools that require a path.
- If you do not know the contents of an existing file you need to edit, use the read_file tool to help you make informed changes. However if you have seen this file before, you should be able to remember its contents.
- When editing files, always provide the complete file content in your response, regardless of the extent of changes. The system handles diff generation automatically.
- Before using the execute_command tool, you must first think about the System Information context provided by the user to understand their environment and tailor your commands to ensure they are compatible with the user's system.
- When using the execute_command tool, avoid running servers or executing commands that don't terminate on their own (e.g. Flask web servers, continuous scripts). If a task requires such a process or server, explain in your task completion result why you can't execute it directly and provide clear instructions on how the user can run it themselves.
- When creating a new project (such as an app, website, or any software project), unless the user specifies otherwise, organize all new files within a dedicated project directory. Use appropriate file paths when writing files, as the write_to_file tool will automatically create any necessary directories. Structure the project logically, adhering to best practices for the specific type of project being created. Unless otherwise specified, new projects should be easily run without additional setup, for example most projects can be built in HTML, CSS, and JavaScript - which you can open in a browser.
- You must try to use multiple tools in one request when possible. For example if you were to create a website, you would use the write_to_file tool to create the necessary files with their appropriate contents all at once. Or if you wanted to analyze a project, you could use the read_file tool multiple times to look at several key files. This will help you accomplish the user's task more efficiently.
- Be sure to consider the type of project (e.g. Python, JavaScript, web application) when determining the appropriate structure and files to include. Also consider what files may be most relevant to accomplishing the task, for example looking at a project's manifest file would help you understand the project's dependencies, which you could incorporate into any code you write.
- When making changes to code, always consider the context in which the code is being used. Ensure that your changes are compatible with the existing codebase and that they follow the project's coding standards and best practices.
- Do not ask for more information than necessary. Use the tools provided to accomplish the user's request efficiently and effectively. When you've completed your task, you must use the attempt_completion tool to present the result to the user. The user may provide feedback, which you can use to make improvements and try again.
- You are only allowed to ask the user questions using the ask_followup_question tool. Use this tool only when you need additional details to complete a task, and be sure to use a clear and concise question that will help you move forward with the task.
- Your goal is to try to accomplish the user's task, NOT engage in a back and forth conversation.
- NEVER end completion_attempt with a question or request to engage in further conversation! Formulate the end of your result in a way that is final and does not require further input from the user. 
- NEVER start your responses with affirmations like "Certaintly", "Okay", "Sure", "Great", etc. You should NOT be conversational in your responses, but rather direct and to the point.
- Feel free to use markdown as much as you'd like in your responses. When using code blocks, always include a language specifier.

====

OBJECTIVE

You accomplish a given task iteratively, breaking it down into clear steps and working through them methodically.

1. Analyze the user's task and set clear, achievable goals to accomplish it. Prioritize these goals in a logical order.
2. Work through these goals sequentially, utilizing available tools as necessary. Each goal should correspond to a distinct step in your problem-solving process.
3. Remember, you have extensive capabilities with access to a wide range of tools that can be used in powerful and clever ways as necessary to accomplish each goal. Before calling a tool, do some analysis within <thinking></thinking> tags. First, think about which of the provided tools is the relevant tool to answer the user's request. Second, go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value. When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value. If all of the required parameters are present or can be reasonably inferred, close the thinking tag and proceed with the tool call. BUT, if one of the values for a required parameter is missing, DO NOT invoke the function (not even with fillers for the missing params) and instead, ask the user to provide the missing parameters using the ask_followup_question tool. DO NOT ask for more information on optional parameters if it is not provided.
4. Once you've completed the user's task, you must use the attempt_completion tool to present the result of the task to the user. You may also provide a CLI command to showcase the result of your task; this can be particularly useful for web development tasks, where you can run e.g. \`open index.html\` to show the website you've built. Avoid commands that run indefinitely (like servers). Instead, if such a command is needed, include instructions for the user to run it in the 'result' parameter.
5. The user may provide feedback, which you can use to make improvements and try again. But DO NOT continue in pointless back and forth conversations, i.e. don't end your responses with questions or offers for further assistance.

====

SYSTEM INFORMATION

Operating System: ${osName()}
Default Shell: ${defaultShell}
`
}

const QUESTION_SYSTEM_PROMPT = `You are TeachCodes Dev, a highly skilled software developer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.

====

CAPABILITIES

- You can read code and tell user intent of that code

====

RULES

- User would give you a line of code and you should answer the intent of that code.
[ example ]
1. user send code below which is written in javascript
<user> users.map((u) => u.name)
<you> Given user array, this code is returning array of user name

2. user send code below which is written in python
<user> def test(args1):
<you> Define function name of test with arguments of args1
`

const tools: Tool[] = [
	{
		name: "execute_command",
		description:
			"Execute a CLI command on the system. Use this when you need to perform system operations or run specific commands to accomplish any step in the user's task. You must tailor your command to the user's system and provide a clear explanation of what the command does. Do not run servers or commands that don't terminate on their own. Prefer to execute complex CLI commands over creating executable scripts, as they are more flexible and easier to run.",
		input_schema: {
			type: "object",
			properties: {
				command: {
					type: "string",
					description:
						"The CLI command to execute. This should be valid for the current operating system. Ensure the command is properly formatted and does not contain any harmful instructions. Avoid commands that run indefinitely (like servers) that don't terminate on their own.",
				},
			},
			required: ["command"],
		},
	},
	{
		name: "list_files",
		description:
			"List all files and directories at the top level of the specified directory. This should only be used for generic directories you don't necessarily need the nested structure of, like the Desktop. If you think you need the nested structure of a directory, use the analyze_project tool instead.",
		input_schema: {
			type: "object",
			properties: {
				path: {
					type: "string",
					description: "The path of the directory to list contents for.",
				},
			},
			required: ["path"],
		},
	},
	{
		name: "read_file",
		description:
			"Read the contents of a file at the specified path. Use this when you need to examine the contents of an existing file, for example to analyze code, review text files, or extract information from configuration files. Be aware that this tool may not be suitable for very large files or binary files, as it returns the raw content as a string.",
		input_schema: {
			type: "object",
			properties: {
				path: {
					type: "string",
					description: "The path of the file to read.",
				},
			},
			required: ["path"],
		},
	},
	{
		name: "write_to_file",
		description:
			"Write content to a file at the specified path. If the file exists, only the necessary changes will be applied. If the file doesn't exist, it will be created. Always provide the full intended content of the file. This tool will automatically create any directories needed to write the file.",
		input_schema: {
			type: "object",
			properties: {
				path: {
					type: "string",
					description: "The path of the file to write to.",
				},
				content: {
					type: "string",
					description: "The full content to write to the file",
				},
			},
			required: ["path", "content"],
		},
	},
	{
		name: "ask_followup_question",
		description:
			"Ask the user a question to gather additional information needed to complete the task. This tool should be used when you encounter ambiguities, need clarification, or require more details to proceed effectively. It allows for interactive problem-solving by enabling direct communication with the user. Use this tool judiciously to maintain a balance between gathering necessary information and avoiding excessive back-and-forth.",
		input_schema: {
			type: "object",
			properties: {
				question: {
					type: "string",
					description:
						"The question to ask the user. This should be a clear, specific question that addresses the information you need.",
				},
			},
			required: ["question"],
		},
	},
	{
		name: "attempt_completion",
		description:
			"Once you've completed the task, use this tool to present the result to the user. They may respond with feedback if they are not satisfied with the result, which you can use to make improvements and try again.",
		input_schema: {
			type: "object",
			properties: {
				command: {
					type: "string",
					description:
						"The CLI command to execute to show a live demo of the result to the user. For example, use 'open -a \"Google Chrome\" index.html' to display a created website. Avoid commands that run indefinitely (like servers) that don't terminate on their own. Instead, if such a command is needed, include instructions for the user to run it in the 'result' parameter.",
				},
				result: {
					type: "string",
					description:
						"The result of the task. Formulate this result in a way that is final and does not require further input from the user. Don't end your result with questions or offers for further assistance.",
				},
			},
			required: ["result"],
		},
	},
]

const MAX_REQUEST_COUNT_PER_TASK = 20
const COMMENT_SHARP_LANGUAGE = ["rb", "py", "r", "pl"]

export class TeachCode {
    private apiHandler: AnthropicHandler
	private workingDirectory: string
	private systemPrompt: string
	private saySocket: (content: string) => void
	private askSocket: (content: string, askType: string) => Promise<TeachCodeAskResponse>
	private history: Anthropic.MessageParam[]
	private requestCount: number
	askResponse?: ClaudeAskResponse
	askResponseText?: string
	questionMap: {[key: string]: TeachCodeQuestion}
	constructor(
		workingDirectory: string,
		saySocket: (content: string) => void,
		askSocket: (content: string, askType: string) => Promise<TeachCodeAskResponse>
	) {
		this.workingDirectory = workingDirectory
		this.apiHandler = new AnthropicHandler(tools)
		this.saySocket = saySocket
		this.askSocket = askSocket
		this.history = []
		this.requestCount = 0
		this.systemPrompt = SYSTEM_PROMPT(this.workingDirectory)
		this.questionMap = {}
	}
	async executeTool(toolName: ToolName, toolInput: any): Promise<string> {
		switch(toolName) {
			case "write_to_file":
				return this.writeToFile(toolInput.path, toolInput.content)
			case "read_file":
				return this.readFile(toolInput.path)
			case "list_files":
				return this.listFiles(toolInput.path)
			case "execute_command":
				return this.executeCommand(toolInput.command)
			case "ask_followup_question":
				return this.askFollowupQuestion(toolInput.question)
			case "attempt_completion":
				return this.attemptCompletion(toolInput.result, toolInput.command)
			default:
				return `Unknown tool: ${toolName}`
		}
	}
	async writeToFile(filePath: string, newContent: string): Promise<string> {
		const fileExtension = filePath.split(".").at(-1) || ""
		const isCommentSharp = COMMENT_SHARP_LANGUAGE.includes(fileExtension)
		try {
			const fileExists = await fs.access(filePath).then(() => true).catch(() => false)
			if (fileExists) {
				const originalContent = await fs.readFile(filePath, "utf-8")
				const diffResult = diff.createPatch(filePath, originalContent, newContent)
				const diffLines = diff.diffLines(originalContent, newContent)
				const diffRepresentation = diffLines.map((part) => {
					const prefix = part.added ? "+" : part.removed ? "-" : " "
					return (part.value || "")
						.split("\n")
						.map((line) => line ? prefix + line : "")
						.join("\n")
				}).join("")
				const diffAddedLines = diffRepresentation
					.split("\n")
					.filter((d) => d.startsWith("+"))
					.map((d) => d.slice(1))
				const diffQuestionCount = Math.ceil(diffAddedLines.length / 5)
				diffAddedLines.sort(() => 0.5 - Math.random())
				const selectedAddedLines = diffAddedLines.slice(0, diffQuestionCount)
				const newFileLines = newContent.split("\n")
				let codeLine = 0
				const maskedNewFile = newFileLines.map(async (nfl) => {
					codeLine += 1
					if (!selectedAddedLines.includes(nfl)) return nfl
					let intent = ""
					try {
						const response = await this.apiHandler.createIntentMessage(QUESTION_SYSTEM_PROMPT, nfl)
						intent = response.content.join(", ")
					} catch (e) {
						console.error(e)
						return nfl
					}
					const questionId = uuid()
					const comment = isCommentSharp ? "#" : "//"
					const codeComment = ` <do not edit> marked as questionId ${questionId}`
					const questionCode = "-".repeat(nfl.length)
					const maskedLine =
						comment + intent + " | " + codeComment + "\n" +
						questionCode + comment + codeComment
					codeLine += 1
					this.questionMap[questionId] = {
						questionCode,
						codeLine,
						codeFilePath: filePath,
						questionCodeComment: codeComment,
						answerCode: nfl
					}
					return maskedLine
				}).join(("\n"))
				const maskedDiffRepresentation = diffRepresentation
					.split("\n")
					.map((d) => {
						if (!selectedAddedLines.includes(d.slice(0))) return d
						return "+" + "-".repeat(d.length - 1)
					}).join("\n")
				const askWriteFileContent = `Write to file ${filePath}
diff : ${maskedDiffRepresentation}`
				const { askResponse } = await this.askSocket(askWriteFileContent, "tool")
				if (askResponse !== "yesButtonClicked") {
					return "The user denied this operation"
				}
				await fs.writeFile(filePath, maskedNewFile)
				return `Changed applied to ${filePath}: \n ${diffResult}`
			} else {
				let codeLine = 0
				const splitNewContent = newContent.split("\n")
				const diffQuestionCount = Math.ceil(splitNewContent.length / 5)
				splitNewContent.sort(() => 0.5 - Math.random())
				const selectedMaskedLine = splitNewContent.slice(0, diffQuestionCount)
				const maskedNewFile = newContent
					.split("\n")
					.map( async (nfl) => {
						codeLine += 1
						if (selectedMaskedLine.includes(nfl)) return
						let intent = ""
						try {
							const response = await this.apiHandler.createIntentMessage(QUESTION_SYSTEM_PROMPT, nfl)
							intent = response.content.join(", ")
						} catch (e) {
							console.error(e)
							return nfl
						}
						const questionId = uuid()
						const comment = isCommentSharp ? "#" : "//"
						const codeComment = ` <do not edit> marked as questionId ${questionId}`
						const questionCode = "-".repeat(nfl.length)
						const maskedLine =
							comment + intent + " | " + codeComment + "\n" +
							questionCode + comment + codeComment
						codeLine += 1
						this.questionMap[questionId] = {
							questionCode,
							codeLine,
							codeFilePath: filePath,
							questionCodeComment: codeComment,
							answerCode: nfl
						}
						return maskedLine
					}).join("\n")
				const askNewFileContent = `New to file ${filePath}
content : ${maskedNewFile}`
				const { askResponse } = await this.askSocket(askNewFileContent, "tool")
				if (askResponse !== "yesButtonClicked") {
					return "The user denied this operation"
				}
				await fs.mkdir(path.dirname(filePath), {recursive: true})
				await fs.writeFile(filePath, maskedNewFile)
				return `New file created and content written to ${filePath}`
			}
		} catch (e) {
			console.error(e)
			const errorMessage = `Error writing file ${filePath} : ${JSON.stringify(e)}`
			this.saySocket(errorMessage)
			return errorMessage
		}
	}
	async readFile(filePath: string): Promise<string> {
		try {
			const content = await fs.readFile(filePath, "utf-8")
			const { askResponse } = await this.askSocket(`Share readFile result : "${content.slice(0, 100)}..."`, "tool")
			if (askResponse !== "yesButtonClicked") {
				return "The user denied this operation"
			}
			return content
		} catch (error) {
			console.error(error)
			const errorMessage = `Error reading file ${filePath} : ${JSON.stringify(error)}`
			this.saySocket(JSON.stringify({error: errorMessage}))
			return errorMessage
		}
	}
	async listFiles(dirPath: string): Promise<string> {
		const absolutePath = path.resolve(dirPath)
		const root = process.platform === "win32" ? path.parse(absolutePath).root : "/"
		const isRoot = absolutePath === root
		if (isRoot) {
			const sayIsRoot = JSON.stringify({
				"text": "listFiles for root is not allowed."
			})
			this.saySocket(sayIsRoot)
			return root
		}
		try {
			const options = {
				cwd: dirPath,
				dot: true,
				absolute: false,
				markDirectories: true,
				onlyFiles: false
			}
			const entries = await globby("*", options)
			const result = entries.join("\n")
			const { askResponse, text } = await this.askSocket(`Share listFileResult for ${dirPath}`, "tool")
			if (askResponse !== "yesButtonClicked") {
				return "The user denied this operation."
			}
			return result
		} catch (e) {
			console.error(e)
			const errorMessage = `Error when listFiles for ${dirPath} : ${JSON.stringify(e)}`
			this.saySocket(JSON.stringify({error: errorMessage}))
			return errorMessage
		}
	}
	async executeCommand(command: string, returnEmptyStringOnSuccess: boolean = false) {
		const askCommandRequest = `LLM wants to command ${command}. Will you allow this command?`
		const { askResponse, text } = await this.askSocket(askCommandRequest, "command")
		if (askResponse !== "yesButtonClicked") {
			const sayNoButtonClicked = JSON.stringify({
				"text": `the user denied command "${command}"`
			})
			this.saySocket(sayNoButtonClicked)
			return "The user denied this operation"
		}
		try {
			let result = ""
			const currentDirCommand = `cd ${this.workingDirectory}; ${command}`
			for await (let line of execa({shell: true})`${currentDirCommand}`) {
				const sayExecResult = JSON.stringify({
					"text": `command_output : "${line}"`
				})
				this.saySocket(sayExecResult)
				result += `${line}\n`
			}
			if (returnEmptyStringOnSuccess) return ""
			return `Command executed successfully. Output: \n:${result}`
		} catch (e) {
			console.error(e)
			const errorMessage = (e as any).message || `Error occured at ${command}`
			const sayErrorMessage = `Error executing command "${command}" : ${errorMessage}`
			this.saySocket(JSON.stringify({error: sayErrorMessage}))
			return errorMessage
		}
	}
	async askFollowupQuestion(question: string): Promise<string> {
		const { text } = await this.askSocket(question, "followup")
		return `User's response:\n "${text}"`
	}
	async attemptCompletion(result: string, command?: string): Promise<string> {
		let resultToSend = result
		if (command) {
			const sayAttemptCompletionResult = `Attempt Completion Result : ${result}`
			await this.saySocket(sayAttemptCompletionResult)
			const commandResult = await this.executeCommand(command, true)
			if (commandResult) return commandResult
			resultToSend = ""
		}
		const { askResponse, text } = await this.askSocket(resultToSend, "completion_result")
		if (askResponse === "yesButtonClicked") return ""
		return `The User is not pleased with the results. Use the feedback they provided to successfully complete the task, and then attempt completion again.\nUser's feedback:\n\"${text}\"`
	}
	private async startTask(task: string): Promise<void> {
		this.saySocket(JSON.stringify({text: `Starting task "${task}"...`}))
		let userPrompt = `Task: \"${task}\"`
		let totalInputTokens = 0
		let totalOutputTokens = 0
		while (this.requestCount < MAX_REQUEST_COUNT_PER_TASK) {
			const {didEndLoop, inputTokenCount, outputTokenCount} = await this.recursivelyMakeClaudeRequests([
				{ type: "text", text: userPrompt }
			])
			totalInputTokens += inputTokenCount
			totalOutputTokens += outputTokenCount
			if (didEndLoop) break
			else userPrompt = `Ask yourself if you have completed the user's task. If you have, use the attempt_completion tool, otherwise proceed to the next step. (This is an automated message, so do not respond to it conversationally. Just proceed with the task.)`
		}
	}
	async recursivelyMakeClaudeRequests(
		userContent: Array<
			Anthropic.TextBlockParam |
			Anthropic.ToolUseBlockParam |
			Anthropic.ToolResultBlockParam
		>
	): Promise<TeachCodeRequestResult> {
		if (this.requestCount > MAX_REQUEST_COUNT_PER_TASK) {
			const response = await this.askSocket(
				"Reached the maximum number of requests for this task. Would you like to reset the count and allow him to proceed?",
				"request_limit_reached"
			)
			if (response.askResponse === "yesButtonClicked") {
				this.requestCount = 0
			} else {
				// return didEndLoop with true
				const newHistory = {
					role: "assistant" as "assistant" | "user",
					content: [{
						type: "text" as "text",
						text: "Failure: I have reached the request limit for this task. Do you have a new task for me?"
					}]
				}
				this.history.push(newHistory)
				return { didEndLoop: true, inputTokenCount: 0, outputTokenCount: 0 }
			}
		}
		const sayReqStartContent = JSON.stringify({
			"text": `Request of Task "${userContent.map((u) => (u as TextBlockParam).text).join(", \n")}" started...`
		})
		this.saySocket(sayReqStartContent)
		try {
			const response = await this.apiHandler.createMessage(this.systemPrompt, this.history)
			this.requestCount += 1
			let inputTokenCount = response.usage.input_tokens
			let outputTokenCount = response.usage.output_tokens
			let assistantResponses: Anthropic.Messages.ContentBlock[] = []
			const sayTokenCount = JSON.stringify({
				"text": `Input Token Count : ${inputTokenCount} / Output Token Count : ${outputTokenCount}`
			})
			this.saySocket(sayTokenCount)
			//
			for (let contentBlock of response.content) {
				if (contentBlock.type !== "text") continue
				assistantResponses.push(contentBlock)
				const sayAssistantResponse = JSON.stringify({
					"text": contentBlock.text
				})
				this.saySocket(sayAssistantResponse)
			}
			//
			let toolResults: Anthropic.ToolResultBlockParam[] = []
			let attemptCompletionBlock: Anthropic.Messages.ToolUseBlock | undefined
			for (let contentBlock of response.content) {
				if (contentBlock.type !== "tool_use") continue
				assistantResponses.push(contentBlock)
				const toolName = contentBlock.name as ToolName
				const toolInput = contentBlock.input
				const toolUseId = contentBlock.id
				if (toolName === "attempt_completion") {
					attemptCompletionBlock = contentBlock
				} else {
					const result = await this.executeTool(toolName, toolInput)
					const sayExecuteTool = JSON.stringify({
						text: `Tool Used ${toolName}, Tool Input: ${JSON.stringify(toolInput)}, Tool Result: ${result}`
					})
					this.saySocket(sayExecuteTool)
					toolResults.push({type: "tool_result", tool_use_id: toolUseId, content: result})
				}
			}
			if (assistantResponses.length) {
				this.history.push({role: "assistant", content: assistantResponses})
			} else {
				this.saySocket("Unexpected Error! No assistant messaged were found in the API response")
				this.history.push({role: "assistant", content: [
					{type: "text", text: "Failure: I did not have a response to provide."}
				]})
			}
			let didEndLoop = false
			if (attemptCompletionBlock) {
				let result = await this.executeTool(
					attemptCompletionBlock.name as ToolName,
					attemptCompletionBlock.input
				)
				if (result === "") {
					didEndLoop = true
					result = "The user is satisfied with the result."
				}
				toolResults.push({type: "tool_result", tool_use_id: attemptCompletionBlock.id, content: result})
			}

			if (toolResults.length > 0) {
				if (didEndLoop) {
					this.history.push({role: "user", content: toolResults})
					this.history.push({role: "assistant", content: [
						{ type: "text", text: "I am pleased you are satisfied with the result. Do you have a new task for me?" }
					]})
				} else {
					const {
						didEndLoop: recDidEndLoop,
						inputTokenCount: recInputTokenCount,
						outputTokenCount: recOutputTokenCount
					} = await this.recursivelyMakeClaudeRequests(toolResults)
					didEndLoop = recDidEndLoop
					inputTokenCount += recInputTokenCount
					outputTokenCount += recOutputTokenCount
				}
			}
			return { didEndLoop, inputTokenCount, outputTokenCount }
		} catch (e) {
			console.error(e)
			return { didEndLoop: true, inputTokenCount: 0, outputTokenCount: 0 }
		}
	}
	handleWebViewAskResponse(askResponse: ClaudeAskResponse, text?: string) {
		this.askResponse = askResponse
		this.askResponseText = text
	}
	clearWebViewAskResponse() {
		this.askResponse = undefined
		this.askResponseText = undefined
	}
}