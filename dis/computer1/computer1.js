const socket = io('http://localhost:5555')
const deviceName = 'computer1'
const response = document.querySelector('#response')

function speakWrite (text) {
  document.querySelector('.image-container').classList.add("hidden")
  document.querySelector('body').classList.add('tts')
  const textContainer = document.querySelector('#response')
  textContainer.innerHTML = ''

  const words = text.split('')
  const utterance = new SpeechSynthesisUtterance(text)
  let prevChar = 0

  utterance.addEventListener('boundary', event => {
    const char = event.charIndex + event.charLength
    const word = words.slice(prevChar, char).join('')
    prevChar = char


    const span = document.createElement('span')
    span.textContent = word
    span.id = `word-${event.charIndex}`
    textContainer.appendChild(span)
    console.log(span)

    textContainer.scrollTop = textContainer.scrollHeight
  })

  utterance.addEventListener('end', event => {
    socket.emit('speech-end', deviceName)
    setTimeout(
      document.querySelector('.image-container').classList.remove("hidden")
    ,3000)

  })

  window.speechSynthesis.speak(utterance)
}

function init () {
  socket.emit('connect-device', deviceName)

  socket.on('computing', currentDevice => {
    if (currentDevice === deviceName) {
      console.log('Computing on this device...')
      //document.body.style.backgroundColor = '#1c3a2d'
    }
  })
    socket.on('message', message => {
      if (message.receiver === deviceName) {
        console.log(message)
        //document.body.style.backgroundColor = '#0b1712'
        response.innerHTML = message.response
        speakWrite(message.response)
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
