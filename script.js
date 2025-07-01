const roomId = window.location.hash.substring(1) || `room-${Math.floor(Math.random()*10000)}`;
const db = firebase.database().ref(`rooms/${roomId}`);
const boardEl = document.getElementById('bingo-board');
const playerCountEl = document.getElementById('player-count');
const roomEl = document.getElementById('room-id');
const callBtn = document.getElementById('call-btn');
const calledListEl = document.getElementById('called-list');

roomEl.textContent = roomId;

let isCaller = false;
let board = [];
let myPlayerRef;

// --- Utilities ---
function generateBoard() {
  const nums = Array.from({length: 75}, (_, i) => i+1);
  nums.sort(() => Math.random() - 0.5);
  board = nums.slice(0, 25);
  boardEl.innerHTML = '';
  board.forEach(num => {
    const c = document.createElement('div');
    c.textContent = num;
    c.className = 'bingo-cell';
    c.onclick = () => c.classList.toggle('marked');
    boardEl.appendChild(c);
  });
}

function checkWin() {
  const cells = Array.from(boardEl.children);
  const marks = cells.map(c => c.classList.contains('marked'));
  // check rows, cols, diagonals
  const winLines = [
    [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
    [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
    [0,6,12,18,24], [4,8,12,16,20]
  ];
  return winLines.some(line => line.every(i => marks[i]));
}

// --- Player join logic ---
db.child('players').once('value').then(snap => {
  const players = snap.val() || {};
  if (Object.keys(players).length >= 5) {
    alert('Room is full 😞');
    throw new Error('Room full');
  }
  const me = db.child('players').push();
  myPlayerRef = me;
  me.set({ joinedAt: firebase.database.ServerValue.TIMESTAMP });
  me.onDisconnect().remove();
});

db.child('players').on('value', snap => {
  playerCountEl.textContent = Object.keys(snap.val()||{}).length;
});

// Caller assignment
db.child('caller').once('value', snap => {
  if (!snap.exists()) {
    db.child('caller').set(myPlayerRef.key);
  }
});

db.child('caller').on('value', snap => {
  const c = snap.val();
  if (c === myPlayerRef.key) {
    isCaller = true;
    callBtn.disabled = false;
    callBtn.textContent = 'Call Number (You)';
  }
});

// --- Game logic ---
generateBoard();

db.child('called').on('child_added', snap => {
  const num = snap.val();
  Array.from(boardEl.children).forEach(c => {
    if (c.textContent == num) c.classList.add('marked');
  });
  calledListEl.textContent += num + ' ';
  if (checkWin()) {
    alert('🎉 BINGO! You won!');
  }
});

callBtn.onclick = () => {
  const num = Math.floor(Math.random() * 75) + 1;
  db.child('called').push(num);
};
