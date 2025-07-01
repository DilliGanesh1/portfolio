// script.js
let roomId, db, myPlayerRef;
let isCaller = false;

document.getElementById('join-btn').onclick = () => {
  const inputVal = document.getElementById('room-input').value.trim();
  roomId = inputVal || `room-${Math.floor(Math.random() * 10000)}`;
  document.getElementById('room-id').innerText = roomId;
  db = firebase.database().ref(`rooms/${roomId}`);
  document.getElementById('room-setup').style.display = 'none';
  document.getElementById('game-ui').style.display = 'block';
  joinRoom();
};

function joinRoom() {
  db.child('players').once('value').then(snap => {
    const players = snap.val() || {};
    if (Object.keys(players).length >= 5) {
      alert('Room full!');
      window.location.reload();
      return;
    }
    myPlayerRef = db.child('players').push();
    myPlayerRef.set({ joinedAt: firebase.database.ServerValue.TIMESTAMP });
    myPlayerRef.onDisconnect().remove();
  });

  db.child('players').on('value', snap => {
    document.getElementById('player-count').innerText = Object.keys(snap.val() || {}).length;
  });

  db.child('caller').once('value', snap => {
    if (!snap.exists()) db.child('caller').set(myPlayerRef.key);
  });

  db.child('caller').on('value', snap => {
    if (snap.val() === myPlayerRef.key) {
      isCaller = true;
      document.getElementById('call-btn').disabled = false;
    }
  });

  db.child('called').on('child_added', snap => {
    const num = snap.val();
    document.getElementById('called-list').textContent += num + ' ';
    document.querySelectorAll('.bingo-cell').forEach(cell => {
      if (cell.textContent == num) cell.classList.add('marked');
    });
    if (checkWin()) alert('🎉 BINGO!');
  });

  document.getElementById('call-btn').onclick = () => {
    const num = Math.floor(Math.random() * 75) + 1;
    db.child('called').push(num);
  };

  generateBoard();
}

function generateBoard() {
  const numbers = Array.from({ length: 75 }, (_, i) => i + 1).sort(() => 0.5 - Math.random());
  const board = numbers.slice(0, 25);
  const boardEl = document.getElementById('bingo-board');
  boardEl.innerHTML = '';
  board.forEach(num => {
    const cell = document.createElement('div');
    cell.textContent = num;
    cell.className = 'bingo-cell';
    cell.onclick = () => cell.classList.toggle('marked');
    boardEl.appendChild(cell);
  });
}

function checkWin() {
  const cells = Array.from(document.getElementsByClassName('bingo-cell'));
  const marks = cells.map(cell => cell.classList.contains('marked'));
  const lines = [
    [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
    [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
    [0,6,12,18,24], [4,8,12,16,20]
  ];
  return lines.some(line => line.every(i => marks[i]));
}
