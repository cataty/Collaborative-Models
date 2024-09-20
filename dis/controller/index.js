const socket = io('http://localhost:5555')
const deviceName = 'controller'
let history = []
let historyList = document.getElementById("history")

function init () {
  socket.emit('connect-device', deviceName)

  socket.on('computing', currentDevice => {
    console.log('Computing on', currentDevice)
  })

  socket.on('message', message => {
      console.log(message)
      history.push(message)
      let li = document.createElement("li")
      li.innerHTML = message.response
      console.log(li)
      historyList.appendChild(li)
  })
}

function startDiscussion () {
  const topic = document.getElementById('topic').value
  socket.emit('discuss', topic)
  history = []
  historyList.innerHTML = ""
}

const startButton = document.getElementById('start-discussion')
startButton.addEventListener('click', startDiscussion)

const abortButton = document.getElementById('abort-discussion')
abortButton.addEventListener('click', () => {
  socket.emit('abort')
})

init()
