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

const currentTurn = 'computer1'
const computing = false
const model = "llama3.1"

app.use('/controller', express.static(path.join(__dirname, './controller')))
app.use('/computer1', express.static(path.join(__dirname, './computer1')))
app.use('/computer2', express.static(path.join(__dirname, './computer2')))

io.on('connection', socket => {
  socket.on('connect-device', deviceName => {
    console.log('Device connected:', deviceName)
    socket.device = deviceName
  })

  socket.on('discuss', topic => {
    console.log('New discussion, topic:', topic)
    computing = true
    loop(topic)
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

async function generate (model, prompt) {
  try {
    const response = await fetch(`http://localhost:11434/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
        model: model,
        prompt,
        stream: false
      })
    })
    const json = await response.json()

    if (json.error) {
      throw Error('no model')
    } else {
      return json
    }
  } catch (error) {
    console.log(error)
    console.log('error while fetching', model)
  }
}

async function compute (topic) {
  computing = true
  io.sockets.emit('computing', currentTurn)
  if (currentTurn === 'computer1') {
    console.log('Computing on computer 1...', topic)
    const modelResponse = await generate(model, topic)
    return modelResponse.response
    // await fakeCompute()
    // return 'I really like cats. Okay.'
  } else {
    console.log('Computing on computer 2...', topic)
    const modelResponse = await generate(model, topic)
    return modelResponse.response
    // await fakeCompute()
    // return 'I dont like cats. I like dogs more.'
  }
}

function updateScreens (response) {
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

async function loop (initialTopic) {
  let topic = initialTopic
  while (computing) {
    response = await compute(topic)
    updateScreens(response)
    topic = response
  }
}
