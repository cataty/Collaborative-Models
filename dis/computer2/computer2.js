const socket = io('http://localhost:5555')
const deviceName = 'computer2'
const response = document.querySelector('#response')
let discussionActive = true;  // Statusvariable für aktive Diskussion

function speakWrite (text) {
  if (!discussionActive) return;  // Keine Ausgabe, wenn Diskussion abgebrochen ist
  document.querySelector('body').classList.add('tts')
  const textContainer = document.querySelector('#response')
  textContainer.innerHTML = ''

  const words = text.split('')
  const utterance = new SpeechSynthesisUtterance(text)
  let prevChar = 0

  utterance.addEventListener('start', () => {
    document.querySelector('.image-container').classList.add("hidden")
  });

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
    document.querySelector('body').classList.remove('tts')
    let device = 'COM2';
    socket.emit('speech-end', { text, device })
    response.innerHTML = ' '
    document.querySelector('.image-container').classList.remove("hidden")
  })

  //utterance.voice = (deviceName === "computer1") ? "Microsoft Hedda - German (Germany)" : "Microsoft Stefan - German (Germany)" 

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
  socket.on('discuss', () => {
    discussionActive = true;  // Diskussion ist active
    //document.body.style.backgroundColor = '#0b1712'
  })
    socket.on('message', message => {
      if (message.receiver === deviceName) {
        console.log(message)
        //document.body.style.backgroundColor = '#0b1712'
        if (discussionActive === true) {
          response.innerHTML = message.response
          speakWrite(message.response)
        }
      } else {
        console.log('received message for another device, clearing response')
        response.innerHTML = ' '
      }
    })
  
  socket.on('abort', () => {
    window.speechSynthesis.cancel();
    discussionActive = false;  // Diskussion ist abgebrochen
    //document.body.style.backgroundColor = '#0b1712'
    response.innerHTML = ' '
    document.querySelector('.image-container').classList.remove("hidden")
  })
}

init()
