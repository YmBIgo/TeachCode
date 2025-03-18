import { Box } from "@mui/material";
import { ClaudeMessage } from "../type/ClaudeMessage";

type Props = {
  message: ClaudeMessage;
};

const ChatRow: React.FC<Props> = ({ message }) => {
  const messageAsk = message.ask ? message.ask : "";
  // const messageSay = message.say ? message.say : ""
  const parsedMessageText = () => {
    try {
      return JSON.parse(message.text || "");
    } catch (e) {
      console.error(e);
      return {};
    }
  };
  switch (message.type) {
    case "ask":
      switch (message.ask) {
        case "command":
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid black",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              Claude want to execute command below
              <br />
              <pre>{parsedMessageText()?.command}</pre>
            </Box>
          );
        case "tool":
          switch (parsedMessageText()?.[`${messageAsk}`]) {
            case "editFile":
              return (
                <Box
                  sx={{
                    padding: "10px",
                    border: "1px solid black",
                    margin: "10px",
                    backgroundColor: "white",
                  }}
                >
                  Claude want to edit file path "
                  <strong>{parsedMessageText()?.filePath}</strong>" ...
                  <br />
                  <pre>{parsedMessageText()?.diff}</pre>
                </Box>
              );
            case "newFile":
              return (
                <Box
                  sx={{
                    padding: "10px",
                    border: "1px solid black",
                    margin: "10px",
                    backgroundColor: "white",
                  }}
                >
                  Claude want to create file path "
                  <strong>{parsedMessageText()?.filePath}</strong>" ...
                  <br />
                  <pre>{parsedMessageText()?.content}</pre>
                </Box>
              );
            case "readFile":
              return (
                <Box
                  sx={{
                    padding: "10px",
                    border: "1px solid black",
                    margin: "10px",
                    backgroundColor: "white",
                  }}
                >
                  Claude want to read file path "
                  <strong>{parsedMessageText()?.filePath}</strong>" ...
                  <br />
                  <pre>{parsedMessageText()?.content}</pre>
                </Box>
              );
            case "listFile":
              return (
                <Box
                  sx={{
                    padding: "10px",
                    border: "1px solid black",
                    margin: "10px",
                    backgroundColor: "white",
                  }}
                >
                  Claude want to see file folder structure of "
                  <strong>{parsedMessageText()?.dirPath}</strong>" ...
                  <br />
                  <pre>{parsedMessageText()?.content}</pre>
                </Box>
              );
            default:
              return (
                <Box
                  sx={{
                    padding: "10px",
                    border: "1px solid black",
                    margin: "10px",
                    backgroundColor: "white",
                  }}
                >
                  received unknown message...
                </Box>
              );
          }
          break;
        case "completion_result":
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid blue",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              Claude want to complete task with following result...
              <br />
              <pre>{parsedMessageText()?.result}</pre>
            </Box>
          );
        case "followup":
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid black",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              Claude want to ask followup question...
              <br />
              <pre>{parsedMessageText()?.question}</pre>
            </Box>
          );
        case "request_limit_reached":
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid red",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              {message.text}
            </Box>
          );
        default:
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid red",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              Unknown message type...
            </Box>
          );
      }
    case "say":
      switch (message.say) {
        case "text":
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid black",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              {parsedMessageText()?.text}
            </Box>
          );
        case "task":
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid black",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              {parsedMessageText()?.task}
            </Box>
          );
        case "error":
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid red",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              {parsedMessageText()?.error}
            </Box>
          );
        case "command_output":
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid black",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              {parsedMessageText()?.command_output}
            </Box>
          );
        case "completion_result":
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid blue",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              {parsedMessageText()?.completion_result}
            </Box>
          );
        case "show_answer":
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid black",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              {parsedMessageText()?.answer}
            </Box>
          );
        default:
          return (
            <Box
              sx={{
                padding: "10px",
                border: "1px solid black",
                margin: "10px",
                backgroundColor: "white",
              }}
            >
              Unknown message type...
            </Box>
          );
      }
  }
};

export default ChatRow;
