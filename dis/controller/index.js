const socket = io('http://localhost:5555')
const deviceName = 'controller'

function init () {
  socket.emit('connect-device', deviceName)

  socket.on('computing', currentDevice => {
    console.log('Computing on', currentDevice)
  })

  socket.on('message', message => {
    if (message.receiver === deviceName) {
      console.log(message)
    }
  })
}

function startDiscussion () {
  const topic = document.getElementById('topic').value
  socket.emit('discuss', topic)
}

const startButton = document.getElementById('start-discussion')
startButton.addEventListener('click', startDiscussion)

const abortButton = document.getElementById('abort-discussion')
abortButton.addEventListener('click', () => {
  socket.emit('abort')
})

init()
