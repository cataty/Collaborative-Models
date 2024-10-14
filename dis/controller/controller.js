const socket = io('http://localhost:5555')
const deviceName = 'controller'
let history = []
let historyList = document.getElementById("history")
let discussionActive = false; // Steuert, ob eine Diskussion aktiv ist

function init() {
  socket.emit('connect-device', deviceName)

  socket.on('computing', currentDevice => {
    console.log('Computing on', currentDevice)
  })


  socket.on('speech-end', ({ text, device }) => {
    console.log(text)
    history.push(text)
    let li = document.createElement("li")
    li.innerHTML = `${device}:<br>${text}`

    console.log(li)
    historyList.appendChild(li)

    // Nach dem Hinzufügen des neuen Eintrags automatisch nach unten scrollen
    scrollToBottom();
  });
  socket.on('abort', () => {
    historyList.innerHTML = "";


  // Diskussion beenden und Textfeld entsperren
  discussionActive = false;
  document.getElementById('topic').disabled = false;
  document.getElementById('topic').value = '';
  document.getElementById('topic').focus();
  })
}

document.getElementById("topic").addEventListener("keypress", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    if (!discussionActive) {
      startDiscussion();
    }
  } else if (discussionActive) {
    // Verhindere jegliche Eingabe, wenn die Diskussion aktiv ist
    e.preventDefault();
  }
});

function startDiscussion() {
  const topic = document.getElementById('topic').value;
  if (topic.trim() === "") return; // Verhindere leere Eingaben

  socket.emit('discuss', topic);

  // Diskussion aktivieren
  discussionActive = true;

  // Setze den Verlauf zurück
  history = [];
  historyList.innerHTML = "";

  // Textarea sperren
  //document.getElementById('topic').value = '';
  document.getElementById('topic').disabled = true;


  // Setze den Fokus auf die history Spalte
  historyList.focus();

}

// Abort-Button-Listener
const abortButton = document.getElementById('abort-discussion');
abortButton.addEventListener('click', () => {
  socket.emit('abort');
});


// ABBRECHEN MIT CRTL + C

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'c') {
    // Emit the 'abort' event and reset discussion state
    socket.emit('abort');
  }
});

const startButton = document.getElementById('start-discussion')
startButton.addEventListener('click', startDiscussion)

// Funktion zum automatischen Scrollen nach unten
function scrollToBottom() {
  historyList.scrollTop = historyList.scrollHeight;
}

init()