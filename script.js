const canvas = document.getElementById("smartBoardCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let isDrawingMode = false;
let isTextMode = true;
let cursorX = 50;
let cursorY = 100;
let fontSize = 24;
let fontColor = "#000000";
let lineHeight = fontSize + 10;

let undoStack = [];
let redoStack = [];
let currentText = "";

// Event Listeners
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
  const input = document.getElementById("keyboardInput");

  // Shift + Enter → AI content
  if (event.key === "Enter" && event.shiftKey) {
    event.preventDefault();
    currentText = input.value.trim();
    if (currentText) {
      input.value = "";
      ctx.fillStyle = "#888";
      ctx.fillText(currentText, cursorX, cursorY); // ✅ FIXED
      cursorY += lineHeight;
      fetchGeminiContent(currentText);
    }
  }
  // Normal Enter → Normal text on board
  else if (event.key === "Enter") {
    event.preventDefault();
    currentText = input.value.trim();
    if (currentText) {
      input.value = "";
      drawTextToCanvas();
    } else {
      cursorY += lineHeight;
    }
  }
}
function drawTextToCanvas() {
  saveState();
  fontSize = parseInt(document.getElementById("fontSize").value);
  fontColor = document.getElementById("fontColor").value;
  ctx.font = `${fontSize}px 'Patrick Hand', cursive`;
  ctx.fillStyle = fontColor;

  // Gemini ke response me multiple lines/paragarph aa sakte hai
  let paragraphs = currentText.split(/\n+/); // \n pe tod do
  let maxWidth = canvas.width - 100;

  paragraphs.forEach(paragraph => {
    let words = paragraph.split(" ");
    let line = "";

    for (let i = 0; i < words.length; i++) {
      let testLine = line + words[i] + " ";
      let testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, cursorX, cursorY);
        line = words[i] + " ";
        cursorY += lineHeight;
        ensureCanvasSpace();
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, cursorX, cursorY);
    cursorY += lineHeight * 1.5; // paragraph ke beech thoda gap
  });
}

function clearBoard() {
  saveState();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cursorY = 100;
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

// Gemini API Integration
async function fetchGeminiContent(promptText) {
  const apiKey = "AIzaSyDRrzQ9l1XRYbPs955bJntG430W4OwiqrE"; // 🔑 Replace with real Gemini API key
  const input = document.getElementById("keyboardInput");
  input.value = "⌛ Please wait while AI processes...";

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      }
    );

    const data = await response.json();
    console.log("Gemini response:", data);

    let generated = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!generated) {
      alert("❌ Gemini did not return text.");
      input.value = "";
      return;
    }

    currentText = generated;
    input.value = "";
    drawTextToCanvas();

  } catch (err) {
    console.error("❌ Gemini error:", err);
    alert("❌ Gemini fetch failed.");
    input.value = "";
  }
}
function scrollCanvas(value) {
  const container = document.getElementById("canvasContainer");
  container.scrollTop = value;
}
function ensureCanvasSpace() {
  if (cursorY + 100 > canvas.height) {
    // save old content
    const oldData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // increase height
    canvas.height += 700;  // ek aur "page" jod diya

    // restore old content
    ctx.putImageData(oldData, 0, 0);
  }
}
