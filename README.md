# FTC Robot Scoreboard

![picture1](https://i.imgur.com/ZV2RlVk.png)

This will allow you to display a scoreboard on a TV as if you are at a FTC event and control it from your phone. 

The way this works is it starts up a web server on the host computer on port `3000` which will allow you to go to `computerip:3000` for the scoreboard and `computerip:3000/admin.html` for the admin page. 

To get your computer's ip, on windows you can use `ipconfig` command in command prompt. 

To run, make sure you have Node.js installed then download this repo, open the folder in command prompt, then run `npm i` then `node index.js` to start the code.

Everything updates in real time. 

## IMPORTANT 
Most browsers disable audio by default to prevent ads from playing. To enable audio, in the admin dashboard, enable `Developer Mode`, then on the scoreboard website click the `Start Audio` button a few times.

## Equipment:
What I use is just a $15 FireTV stick with the Amazon Silk website connected to the Rasberry PI I have this hosted on, then use my phone to actually score while the drivers are practicing. I don't really reccomend the FireTV because sometimes the connection just drops and the website doesnt recieve sockets anymore until I restart. On top of that the device usually goes to sleep after like 30 minutes. I also just used a spare TV we had and set it up, although if you have a projector instead available to you, that also works!

## Plans:
What I want to do in the near futer is turn this into a .exe file that way you don't have to download Node.js

## Disclaimers

AI was used in this branch to update to Biobuzz. The core logic inside index.js and frontend base was human written back during the Into The Deep season, and just forked across multiple seasons. All AI generated code is tested, and all lines are read and double checked by a human before being put into the project. If you open a PR with AI Generated code, please mention exactly what you used AI on and where in the comments, that way we can review it extra carefully. 

Biobuzz introduced a new chime effect at the 60 second mark. As of now, I can't find any official sound effect, so I just replaced it with a sample one I got off of Pixabay: https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=7143

I refrenced the updated game manual and Biobuzz video for game rules and timings. Although I am confident that everything follows game manual rules, there is always a possbility that I made a mistake or missed something. If some scoring mechanism or timing is innaccurate, please create an issue and I will fix it ASAP. This will apply to Biobuzz until August 2027, where I will no longer update this branch. 

## Pictures
![picture1](https://i.imgur.com/ZV2RlVk.png)
![picture2](https://i.imgur.com/Ivz0wHa.png)
![picture3](https://i.imgur.com/lVfBfVY.png)
![picture4](https://i.imgur.com/THTyelW.png)
![picture5](https://i.imgur.com/PQMwglp.jpeg)
![picture6](https://i.imgur.com/dc7NDy0.jpeg)