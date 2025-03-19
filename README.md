Cline like coding assistant ***Web app*** which not only coding but also teaching you how to code.  

![TeachCode-image](https://vulnhuntr.s3.us-west-1.amazonaws.com/TeahCode_logo.png)  

## Description
Coding assistant tools are recently growing fast and many people are attracted with these tools.
However there are also concerns that these tools would prevent junior engineers grow there abilities to code.  
  
Since I created the tool named TeachCode which not only use Claude to code but also teach user how to code by hiding recommended code offered by Claude.  
[![TeachCode Demo](https://vulnhuntr.s3.us-west-1.amazonaws.com/TeachCode_Demo_image)](https://www.youtube.com/watch?v=WYd3rszVSZk)
  
Usage is simple.  

1. Start Server and open localhost:5173
2. Input task you want to and start task
3. Claude would write code which hide some lines, under folder path you specified when start server.
4. Fill hidden codes.
5. Check Accuracy in localhost:5173
6. Continue 3~5 until end.

## Features

I will write it later

## How to start

1. Please install node
2. Get Claude API key and set CLAUDE_API_KEY  
```
export CLAUDE_API_KEY=your-api-key
```
3. Clone this project  
   https://github.com/YmBIgo/TeachCode
4. Open two terminal
5. Use first terminal and start server  
```
cd backend
npm run start
<input file path you want to start>
```
6. Use second terminal and start web view  
```
cd frontend/teachCodeFront
npm run start
```
7. Go to localhost:5173 and start task.
8. When Claude write file, they will hide at most 10 lines of code.  
   So, you have to write these hidden code by your self.  
   When you finish writing code, Click "Check Accuracy" and see your code is right or not.
9. Continue writing snippet of codes until task ends.