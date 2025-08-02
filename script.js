const canvas = document.getElementById("smartBoardCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let isDrawingMode = false;
let isTextMode = true;

let fontSize = 24;
let fontColor = "#000000";

let undoStack = [];
let redoStack = [];

let currentText = "";

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);

document.addEventListener("keydown", (e) => {
  if (e.key === "d" || e.key === "D") toggleDrawingMode();
  if (e.key === "t" || e.key === "T") toggleTextMode();
});

function saveState() {
  undoStack.push(canvas.toDataURL());
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(canvas.toDataURL());
  let img = new Image();
  img.src = undoStack.pop();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(canvas.toDataURL());
  let img = new Image();
  img.src = redoStack.pop();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

function startDrawing(e) {
  if (!isDrawingMode) return;
  drawing = true;
  saveState();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

function draw(e) {
  if (!drawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.strokeStyle = fontColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function stopDrawing() {
  drawing = false;
}

function toggleDrawingMode() {
  isDrawingMode = true;
  isTextMode = false;
}

function toggleTextMode() {
  isTextMode = true;
  isDrawingMode = false;
}

function handleKeyInput(event) {
  if (event.key === "Enter") {
    const input = document.getElementById("keyboardInput");
    currentText = input.value;
    input.value = "";
    drawTextToCanvas();
  }
}

function drawTextToCanvas() {
  saveState();

  fontSize = parseInt(document.getElementById("fontSize").value);
  fontColor = document.getElementById("fontColor").value;

  ctx.font = `${fontSize}px 'Patrick Hand', cursive`;
  ctx.fillStyle = fontColor;

  let words = currentText.split(" ");
  let line = "";
  let x = 50;
  let y = 100;
  let lineHeight = fontSize + 10;
  let maxWidth = canvas.width - 100;

  for (let i = 0; i < words.length; i++) {
    let testLine = line + words[i] + " ";
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function clearBoard() {
  saveState();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function processText() {
  alert("🧠 AI Processing (mock): Generated notes based on detected content. Coming Soon...");
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("l", "pt", [canvas.width, canvas.height]);
  const imgData = canvas.toDataURL("image/png");

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save("smart-board-notes.pdf");
}

