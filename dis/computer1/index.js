const socket = io('http://localhost:5555')
const deviceName = 'computer1'
const response = document.querySelector('#response')

function init () {
  socket.emit('connect-device', deviceName)

  socket.on('computing', currentDevice => {
    if (currentDevice === deviceName) {
      console.log('Computing on this device...')
      document.body.style.backgroundColor = '#1c3a2d'
    }
  })

  socket.on('message', message => {
    if (message.receiver === deviceName) {
      console.log(message.response)
      document.body.style.backgroundColor = '#0b1712'
      response.innerHTML = message.response
    } else {
      console.log('received message for another device, clearing response')
      response.innerHTML = ' '
    }
  })
  socket.on('abort', () => {
    document.body.style.backgroundColor = '#0b1712'
    response.innerHTML = ' '
  })
}

init()
