const express = require('express')
const path = require('path')
const Socket = require('socket.io')
const fetch = require('node-fetch')
const PORT = 5555

const app = express()
const server = require('http').createServer(app)

const io = Socket(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

let currentTurn = 'computer1'
let computing = false
let currentTopic = "";
const model = "jerry2"
const prompt = ""
let speechEnded = false; // Flag, um den Status des Speech-End-Ereignisses zu verfolgen

app.use('/controller', express.static(path.join(__dirname, './controller')))
app.use('/computer1', express.static(path.join(__dirname, './computer1')))
app.use('/computer2', express.static(path.join(__dirname, './computer2')))
app.use('/assets', express.static(path.join(__dirname, './assets')))
app.use('/', express.static(path.join(__dirname, './')))

io.on('connection', socket => {
  socket.on('connect-device', deviceName => {
    console.log('Device connected:', deviceName)
    socket.device = deviceName
  })

  socket.on('discuss', topic => {
    console.log('New discussion, topic:', topic)
    currentTopic = topic;
    computing = true
    io.sockets.emit('discuss')
    loop(topic)
  })

  socket.on('speech-end', text => {
    console.log('speech ended')
    speechEnded = true; // Setze die Flag auf true, wenn das Ereignis empfangen wird
    io.sockets.emit('speech-end', text)
  })

  socket.on('abort', () => {
    console.log('Discussion aborted')
    computing = false
    io.sockets.emit('abort')
  })

  socket.on('disconnect', () => {
    console.log('Device disconnected:', socket.device)
  })
})

server.listen(PORT, () => {
  console.log('listening on PORT: ', PORT)
})

// async function fakeCompute () {
//   return new Promise(resolve => setTimeout(resolve, 5000))
// }

async function generate (prompt) {
  try {
    const response = await fetch('https://proxy.c-e.group/llm/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: ''
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        system:
          "Du bist eine Person, die mit einer anderen Person diskutiert. Bitte antworte entsprechend. Antworte in maximal 5 Sätzen.",
        prompt,
        temperature: 1,
        stream: false
      })
    })
    const json = await response.json()
    return json
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Failed to fetch response from server' }
  }
}

async function compute (topic) {
  if (!computing)return;
  io.sockets.emit('computing', currentTurn)
  if (currentTurn === 'computer1') {
    console.log('Computing on computer 1...', topic)
    const modelResponse = await generate(topic)
    return modelResponse.response
    // await fakeCompute()
    // return 'I really like cats. Okay.'
  } else {
    console.log('Computing on computer 2...', topic)
    const modelResponse = await generate(topic)
    return modelResponse.response
    // await fakeCompute()
    // return 'I dont like cats. I like dogs more.'
  }
}


function updateScreens (response, initialTopic) {
  if (!computing)return;
  if (currentTopic !== initialTopic) {
    console.log('Old topic detected.');
    return; 
  }
  io.sockets.emit('message', {
    receiver: currentTurn,
    response: response
  })
  if (currentTurn === 'computer1') {
    currentTurn = 'computer2'
  } else if (currentTurn === 'computer2') {
    currentTurn = 'computer1'
  }
}

async function loop(initialTopic) {
  let topic = initialTopic;
  let responseCount = 0; // Zähler für die Anzahl der Antworten
  while (computing && responseCount < 20) { // Begrenze die Schleife auf 20 Durchläufe
    console.log('responsecount: ', responseCount);
    // Prüfe, ob das Thema noch aktuell ist
    if (currentTopic !== initialTopic) {
      console.log('Old topic detected, skipping computation.');
      break;
    }
    
    let response = await compute(topic);
    if (!computing) break;
    
    updateScreens(response, initialTopic);
    
    // auf speech-end warten für nächsten durchlauf der loop
    while (!speechEnded) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    // Füge eine 1,5 Sekunden Pause nach speech-end hinzu
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1,5 Sekunden warten

    speechEnded = false; // Setze die Flag zurück
    topic = response;
    
    responseCount++; // Zähler erhöhen
  }
  
  if (responseCount >= 20) {
    console.log('Max responses reached, aborting discussion.');
    computing = false;
    io.sockets.emit('abort'); // Abbruch der Diskussion nach 20 Antworten
  }
}
