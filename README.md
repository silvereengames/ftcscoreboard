# FTC Robot Scoreboard
This will allow you to display a scoreboard on a TV as if you are at a FTC event and control it from your phone. 

The way this works is it starts up a web server on the host computer on port `3000` which will allow you to go to `computerip:3000` for the scoreboard and `computerip:3000/admin.html` for the admin page. 

To get your computer's ip, on windows you can use `ipconfig` command in command prompt. 

To run, make sure you have Node.js installed then download this repo, open the folder in command prompt, then run `npm i` then `node index.js` to start the code.

Everything updates in real time. 

<h1 style="color: red">We are working on updating this repo to Decode (2026). We will remove this message when we have fully added support for Decode!</h1>

## IMPORTANT 
Most browsers disable audio by default to prevent ads from playing. To enable audio, in the admin dashboard, enable `Developer Mode`, then on the scoreboard website click the `Start Audio` button a few times.

## Equipment:
What I use is just a $15 FireTV stick with the Amazon Silk website connected to the Rasberry PI I have this hosted on. I don't really reccomend the FireTV because sometimes the connection just drops and the website doesnt recieve sockets anymore until I restart. On top of that the device usually goes to sleep after like 30 minutes. I also just used a spare TV we had and set it up.

## Plans:
What I want to do in the near futer is turn this into a .exe file that way you don't have to download Node.js

## Pictures
![picture1](https://i.imgur.com/k8LE5hj.png)
![picture2](https://i.imgur.com/Am9Ymld.png)
![picture3](https://i.imgur.com/LjuxEjd.png)
![picture4](https://i.imgur.com/1ICWnFA.png)

![picture5](https://i.imgur.com/wgz5Zku.png)
