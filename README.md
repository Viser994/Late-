# Brampton Smart Transit & Traffic

Your all-in-one app designed to make traveling around Brampton **faster, greener, and easier**. It
uses real-time data and smart technology to help you navigate traffic jams and catch public transit
on time.

This repository contains a self-contained, front-end web app (no build step, no backend required).
All "real-time" data is simulated locally and refreshes on an interval so the experience feels live,
while user accounts and community reports persist in your browser via `localStorage`.

## Key features

| Feature | What it does |
| --- | --- |
| **Live Traffic Updates** | Real-time congestion across Brampton corridors with suggested alternate routes. |
| **Smart Traffic Lights Sync** | Intersection signals adapt dynamically to flow and show estimated stop time saved. |
| **Real-Time Transit Info** | Track buses & trains live with arrival times and crowding levels before you board. |
| **Personalized Commute Planning** | Optimized routes combining driving, walking, biking and transit (fastest / greenest / cheapest). |
| **Community Feedback** | Report traffic issues or delays and upvote others' reports. |

## Signing in

Create a free account with your email, or use a demo social sign-in (Google / Facebook / Apple).
During sign-up you can set your **home** and **work** locations for personalized route suggestions and
enable notifications for live alerts. Your data helps provide better routing and traffic insights —
privacy is protected according to local standards.

> Note: This is a demonstration app. Account credentials are stored unencrypted in the browser's
> `localStorage` and are **not** suitable for real production use.

## Running it

No dependencies or build tools are required. Open `index.html` directly, or serve the folder:

```bash
# Python
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project structure

```
index.html        # App markup: auth screen + app shell with all views
assets/styles.css # Theme and layout
assets/app.js     # State, simulated live data, rendering, auth, persistence
```

## Hosting & support

This app is developed and hosted locally, focusing on Brampton's specific needs and growth. For
questions or technical support, contact `support@bramptonsmarttransit.ca`.
