I have a VPS which you can access via ssh root@kairosolutions.eu
The app is hosted on kairosolutions.eu/vidchat/
I have nginx set up to handle several apps.
There is a livekit-agent running.
The rooms are via wss.
To deploy, there is scripts/deploy.sh but that doesn't update the agent. Also, you left the agent running with nohup I think. When I run it myself I use screen. Maybe we should come up with something better.
