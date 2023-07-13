// Ajuster le mouvement des platformes au 'resize'
//Ajuster le GameOverCanvas au 'resize'
//Ajuster le debut du timer
//Ajuster HighScore si nouvelle partie => afficher le meilleur score actuel et pas l'ancien.

Array.prototype.last = function () {
  return this[this.length - 1];
};
Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling  let lastTimestamp; 
let heroX;
let heroY; // Only changes when falling
let sceneOffset;
let platforms = [];
let sticks = [];
let trees = [];
let score = 0;
let consecutivePerfectHits = 0;
let scoreMultiplier = 1;
let timer = 0;
  
const canvasWidth = innerWidth;
const canvasHeight = innerHeight;
const platformHeight = 250;
const heroDistanceFromEdge = 10; // While waiting
const paddingX = 100; // The waiting position of the hero in from the original canvas size
const perfectAreaSize = 10;
const backgroundSpeedMultiplier = 0.2;
  
const hill1BaseHeight = 180;
const hill1Amplitude = 45;
const hill1Stretch = 1;
const hill2BaseHeight = 140;
const hill2Amplitude = 15;
const hill2Stretch = -0.5;
const hill3BaseHeight = 70;
const hill3Amplitude = 20;
const hill3Stretch = 0.18;
  
const stretchingSpeed = 4; 
const turningSpeed = 4; 
const walkingSpeed = 5;
const transitioningSpeed = 3;
const fallingSpeed = 2;
const heroWidth = 18; 
const heroHeight = 30; 
  
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
  
const introElement = document.querySelector('.intro');
const revealText = document.querySelector(".reveal");
const mainContainer = document.querySelector('.main_container');
const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");
const timeElement = document.getElementById('time');
const highScoreElement = document.getElementById("high_score");

let currentHighScore = parseInt(localStorage.getItem("highScore")) || "0";
let currentHighScoreTime = localStorage.getItem("highScoreTime") || "0"; 

function gameIntro() {
  const delay = 0.3;
  const revealText = document.querySelector(".reveal");
  const introElement = document.querySelector('.intro');
  const letters = revealText.textContent.split("");
  revealText.textContent = "";
  revealText.style.color = 'white';
  revealText.style.textShadow = '0 2px 15px white';
  const middle = letters.filter(e => e !== " ").length / 2;
  letters.forEach((letter, i) => {
    const span = document.createElement("span");
    span.textContent = letter;
    span.style.animationDelay = `${delay + Math.abs(i - middle + 5) * 0.1}s`;
    revealText.append(span);
    scoreElement.style.display = 'none';
    timeElement.style.display = 'none';
    highScoreElement.style.display = 'none';
    introductionElement.style.display = 'none';
  });
  introElement.addEventListener('click', function() {
    introElement.style.display = 'none';
    scoreElement.style.display = 'flex';
    timeElement.style.display = 'flex';
    highScoreElement.style.display = 'flex';
    introductionElement.style.display = 'flex';
    resetGame();
  });
}
  
function startTimer() {
  startTime = new Date();
  timeIntervalId = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const elapsedTime = new Date() - startTime;
  const seconds = Math.floor(elapsedTime / 1000);
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timeElement.innerText = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')} minutes`;
  } else {
    timeElement.innerText = `${seconds} seconds`;
  }
}

function endGame() {
  clearInterval(timeIntervalId);
}

resetGame();
  
function resetGame() {
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;
  timer = 0;

  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  scoreElement.innerText = score;
  highScoreElement.innerHTML = currentHighScore + ' points en ' + currentHighScoreTime;

  // The first platform is always the same | x + w has to match paddingX
  platforms = [{ x: 30, w: 70 }];
  for (p = 0; p < 7; p++) {
    generatePlatform();
  }
  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];
  trees = [];
  for (let t = 0; t < 24; t++) {
    generateTree();
  }
  burnedTrees = [];
  for (let b = 0; b < 24; b++) {
    generateBurnedTree();
  }
  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;
  
  draw();
}
  
function generateTree() {
  const minimumGap = 20;
  const maximumGap = 160;
  const lastTree = trees[trees.length - 1];
  let furthestX = lastTree ? lastTree.x : 0;
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
  const treeColors = ["#5B8A20", "#276E08", "#90C021"];
  const color = treeColors[Math.floor(Math.random() * 3)];
  
  trees.push({ x, color });
}
  
function generatePlatform() {
  const minimumGap = 30;
  const maximumGap = 200;
  const minimumWidth = 20;
  const maximumWidth = 100;
  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;
  const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
  const w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));
  
  platforms.push({ x, w });
}

gameIntro();
resetGame();
setTimeout(function(){
  startTimer();
}, 6000);
  
window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    resetGame();
    timeElement.innerText = '';
    startTimer();
    if (gameOverCanvas) {
      document.body.removeChild(gameOverCanvas);
      scoreElement.style.fontSize = '50px';
      scoreElement.style.color = 'white';
      scoreElement.style.boxShadow = 'none';
      scoreElement.style.textShadow = '0 4px 22px black';
    }
    return;
  }
});

canvas.addEventListener("mousedown", function (event) {
  if (phase == "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    window.requestAnimationFrame(animate);
  }
});
  
window.addEventListener("mouseup", function (event) {
  if (phase == "stretching") {
    phase = "turning";
  }
});
  
 window.addEventListener("resize", function (event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
  if (gameOverCanvas) {
    drawGameOverBackground();
  } else {
    draw();
  }
});
  
window.requestAnimationFrame(animate);
  
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }
  
  switch (phase) {
    case "waiting":
      return; 
    case "stretching": {
      sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
      break;
    }
    case "turning": {
      sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;
        const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {  
          if (perfectHit) {
            consecutivePerfectHits++;
            if (consecutivePerfectHits >= 5) {
              scoreMultiplier = 10;
            } else if (consecutivePerfectHits === 4) {
              scoreMultiplier = 8;
            } else if (consecutivePerfectHits === 3) {
              scoreMultiplier = 5;
            } else if (consecutivePerfectHits === 2) {
              scoreMultiplier = 3;
            } else {
              scoreMultiplier = 2;
            }
          } else {
            consecutivePerfectHits = 0;
            scoreMultiplier = 1;
          }

          score += scoreMultiplier;
          scoreElement.innerText = score;
          if (perfectHit) {
            perfectElement.style.opacity = 1;
            setTimeout(() => (
              perfectElement.style.opacity = 0), 1000);
            if (canvas.width < 768) {
              perfectElement.style.fontSize = '50px'
            }
          }
          
          generatePlatform();
          generateTree();
          generateTree();
        }
  
        phase = "walking";
      }
      break;
    }
    case "walking": {
      heroX += (timestamp - lastTimestamp) / walkingSpeed;
  
      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        // If hero will reach another platform then limit it's position at it's edge
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "transitioning";
        }
      } else {
        // If hero won't reach another platform then limit it's position at the end of the pole
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "falling";
        }
      }
      break;
    }
    case "transitioning": {
      sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;
  
      const [nextPlatform] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
        // Add the next step
        sticks.push({
          x: nextPlatform.x + nextPlatform.w, length: 0,rotation: 0
        });
        phase = "waiting";
      }
      break;
    }
    case "falling": {
      if (sticks.last().rotation < 180)
        sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
        heroY += (timestamp - lastTimestamp) / fallingSpeed;
        const maxHeroY = platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      if (heroY > maxHeroY) {
        restartButton.style.display = "block";
        endGame();
        score = scoreElement.innerHTML;
        timer = timeElement.innerHTML;
        if (score > currentHighScore || (score === currentHighScore && timer < currentHighScoreTime)) {
          highScoreElement.innerHTML = score + " en " + timer;
          localStorage.setItem("highScore", score); // stocker le nouveau score dans le localStorage
          localStorage.setItem("highScoreTime", timer); // stocker le nouveau time dans le localStorage
        } else {
          highScoreElement.innerHTML = currentHighScore + ' points en ' + currentHighScoreTime; // afficher la valeur stockée dans le localStorage
        }
        drawGameOverBackground();
        drawGameOverCanvas();
        scoreElement.style.color = 'black';
        scoreElement.style.fontSize = '70px';
        scoreElement.style.textShadow = '0 4px 22px white';
        scoreElement.style.boxShadow = '0 4px 22px white';
        timeElement.style.color = 'black';
        timeElement.style.fontSize = '25px';
        timeElement.style.textShadow = '0 4px 22px white';
        timeElement.style.boxShadow = '0 4px 22px white';
        highScoreElement.style.color = 'black';
        highScoreElement.style.fontSize = '25px';
        highScoreElement.style.textShadow = '0 4px 22px white';
        highScoreElement.style.boxShadow = '0 4px 22px white';
        if (canvas.width < 768) {
          scoreElement.style.fontSize = '40px';
          timeElement.style.fontSize = '20px';
          highScoreElement.style.fontSize = '20px';
        }
        return;
      }
      break;
    }
    default:
      throw Error("Wrong phase");
  }
  
  draw();
  window.requestAnimationFrame(animate);
  lastTimestamp = timestamp;
}

// Returns the platform the stick hit (if it didn't hit any stick then return undefined)
function thePlatformTheStickHits() {
  if (sticks.last().rotation != 90)
    throw Error(`Stick is ${sticks.last().rotation}°`);
  const stickFarX = sticks.last().x + sticks.last().length;
  
  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );
  
  // If the stick hits the perfect area
  if (
    platformTheStickHits && platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
    stickFarX && stickFarX < platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
  )
    return [platformTheStickHits, true];
  
  return [platformTheStickHits, false];
}
  
function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  
  drawBackground();
  drawMoon();
  
  ctx.translate((window.innerWidth - canvasWidth) / 2 - sceneOffset, (window.innerHeight - canvasHeight) / 2);
  
  drawPlatforms();
  drawHero();
  drawSticks();
  
  ctx.restore();
}
  
restartButton.addEventListener("click", function (event) {
  event.preventDefault();
  resetGame();
  timeElement.innerText = '0 second';
  startTimer();
  if (gameOverCanvas) {
    document.body.removeChild(gameOverCanvas);
  }
  restartButton.style.display = "none";
  scoreElement.style.fontSize = '50px';
  scoreElement.style.color = 'white';
  scoreElement.style.boxShadow = 'none';
  scoreElement.style.textShadow = '0 4px 22px black';
  timeElement.style.fontSize = '20px';
  timeElement.style.color = 'white';
  timeElement.style.boxShadow = 'none';
  timeElement.style.textShadow = '0 4px 22px black';
  highScoreElement.style.fontSize = '20px';
  highScoreElement.style.color = 'white';
  highScoreElement.style.boxShadow = 'none';
  highScoreElement.style.textShadow = '0 4px 22px black';
});
  
function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    ctx.fillStyle = "black";
    ctx.fillRect(
      x,
      canvasHeight - platformHeight,
      w,
      platformHeight + (window.innerHeight - canvasHeight) / 2
    );
    if (sticks.last().x < x) {
      ctx.fillStyle = "red";
      ctx.fillRect(
        x + w / 2 - perfectAreaSize / 2,
        canvasHeight - platformHeight,
        perfectAreaSize,
        perfectAreaSize
      );
    }
  });
}
  
function drawHero() {
  ctx.save();
  ctx.fillStyle = "black";
  ctx.translate(
    heroX - heroWidth / 2,
    heroY + canvasHeight - platformHeight - heroHeight / 2
  );
  drawRoundedRect(
    -heroWidth / 2,
    -heroHeight / 2,
    heroWidth,
    heroHeight - 4,
    5
  );
  const legDistance = 4;
  ctx.beginPath();
  ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();
  
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
  ctx.fill();
  
  ctx.fillStyle = "red";
  ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
  ctx.beginPath();
  ctx.moveTo(-9, -14.5);
  ctx.lineTo(-17, -18.5);
  ctx.lineTo(-14, -8.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, -10.5);
  ctx.lineTo(-15, -3.5);
  ctx.lineTo(-5, -7);
  ctx.fill();

  ctx.restore();
}
  
function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.lineTo(x + width - radius, y + height);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.lineTo(x + width, y + radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.lineTo(x + radius, y);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.fill();
}
  
function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();

    ctx.restore();
  });
}
  
function drawBackground() {
  var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "rgba(7, 51, 144, 0.8)");
  gradient.addColorStop(0.5, "rgba(32, 85, 193, 0.7)");
  gradient.addColorStop(0.75, "rgba(46, 110, 220, 0.6)");
  gradient.addColorStop(1, "rgba(227, 119, 94, 0.9)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  
  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");
  drawHill(hill3BaseHeight, hill3Amplitude, hill3Stretch, "#487311");

  trees.forEach((tree) => drawTree(tree.x, tree.color));
}
  
function drawHill(baseHeight, amplitude, stretch, color) {
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
  for (let i = 0; i < window.innerWidth; i++) {
    ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
  }
  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.fillStyle = color;
  ctx.fill();
}
  
function drawTree(x, color) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
    getTreeY(x, hill1BaseHeight, hill1Amplitude)
  );
  
  const treeTrunkHeight = 6;
  const treeTrunkWidth = 2.5;
  const treeCrownHeight = 25;
  const treeCrownWidth = 12;
  
  ctx.fillStyle = "#573926";
  ctx.fillRect(
    -treeTrunkWidth / 2,
    -treeTrunkHeight,
    treeTrunkWidth,
    treeTrunkHeight
  );
  
  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth /2, -treeTrunkHeight);
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.restore();
}

function drawMoon() {
  let radius = 200;
  if (canvas.width < 768) {
    radius = 150;
  }
  ctx.save();
  ctx.beginPath();
  let moonColor = '230, 230, 230';
  let moonGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, radius, canvas.width / 2, canvas.height / 2, 0);
  moonGradient.addColorStop(0, "rgba(" + moonColor + ", " + (1 * 0.6) + ")");
  moonGradient.addColorStop(0.36, "rgba(" + moonColor + ", " + (1 * 0.2) + ")");
  moonGradient.addColorStop(1, "rgba(" + moonColor + ", " + (1 * 0) + ")");
  ctx.fillStyle = moonGradient;
  ctx.arc(canvas.width / 2, canvas.height / 4, radius, Math.PI * 2, false);
  ctx.fill();
  ctx.restore();
}
  
function getHillY(windowX, baseHeight, amplitude, stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  return (
    Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
      amplitude +
    sineBaseY
  );
}
  
function getTreeY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
}

function generateBurnedTree() {
  const minimumGap = 20;
  const maximumGap = 160;
  
  const lastBurnedTree = burnedTrees[burnedTrees.length - 1];
  let furthestX = lastBurnedTree ? lastBurnedTree.x : 0;
  
  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  
  const BurnedTreeColors = ["#F37F0B", "#D87511", "#44201D", "#000"];
  const burnedColor = BurnedTreeColors[Math.floor(Math.random() * 3)];
  
  burnedTrees.push({ x, burnedColor });
}

function drawBurnedTree(x, burnedColor) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
    getTreeY(x, hill1BaseHeight, hill1Amplitude)
  );
  
  const treeTrunkHeight = 6;
  const treeTrunkWidth = 3.5;
  const treeCrownHeight = 25;
  const treeCrownWidth = 15;
  
  ctx.fillStyle = "black";
  ctx.fillRect(
    -treeTrunkWidth / 2,
    -treeTrunkHeight,
    treeTrunkWidth,
    treeTrunkHeight
  );

  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
  ctx.fillStyle = burnedColor;
  ctx.fill();
  
  ctx.restore();
}

function drawGameOverBackground() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "rgba(235, 88, 35, 0.8)");
  gradient.addColorStop(0.5, "rgba(251, 171, 126, 0.7)");
  gradient.addColorStop(1, "rgba(235, 88, 35, 0.9)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  drawMoonset();
  
  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#754B0E");
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#A3730D");
  drawHill(hill3BaseHeight, hill3Amplitude, hill3Stretch, "#DBB258");

  burnedTrees.forEach((tree) => drawBurnedTree(tree.x, tree.burnedColor));
}

function drawGameOverCanvas() {
  const gameOverCanvas = document.createElement('canvas');
  gameOverCanvas.id = 'gameOverCanvas';
  const ctx = gameOverCanvas.getContext('2d');
  gameOverCanvas.width = innerWidth ;
  gameOverCanvas.height = innerHeight;
  document.body.appendChild(gameOverCanvas);

  let particleArray = [];
  let adjustX = 62;
  let adjustY = 77;

  const mouse = {
      x: null,
      y: null,
      radius: 150
  }
  window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
  });
  ctx.font = '28px Titan One';
  ctx.fillText('GAME OVER', 0, 25);
  const textCoordinates = ctx.getImageData(0, 0, 200, 200);
  if (gameOverCanvas.width < 768) {
    adjustX = 0;
    adjustY = 77;
    ctx.font = '8px Titan One';
  }
    
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = 4;
      this.baseX = this.x;
      this.baseY = this.y;
      this.density = (Math.random() * 80) + 1; // augmenter la densité pour que les particules ailles plus vite
    }
    drawGameOver() {
      let gradientText = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
      gradientText.addColorStop(0, "rgba(255, 3, 3, 1)");
      gradientText.addColorStop(0.4, "rgba(255, 97, 0, 0.5)");
      gradientText.addColorStop(0.6, "rgba(255, 3, 3, 1)");
      gradientText.addColorStop(1, "rgba(255, 3, 3, 1)");
      ctx.fillStyle = gradientText;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2 );
      ctx.closePath();
      ctx.fill();
    }
    update() {
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      let forceDirectionX = dx / distance;
      let forceDirectionY = dy / distance;
      let maxDistance = mouse.radius;
      let force = (maxDistance - distance) / maxDistance;
      let directionX = forceDirectionX * force * this.density;
      let directionY = forceDirectionY * force * this.density;
      if (distance < mouse.radius) {
        this.x -= directionX; // * 3 pour aller que la 'gravité' sois plus forte => pls vite
        this.y -= directionY;
      } else {
        if (this.x !== this.baseX) {
          let dx = this.x - this.baseX;
          this.x -= dx / 10;
        }
        if (this.y !== this.baseY) {
          let dy = this.y - this.baseY;
          this.y -= dy / 10;
        }
      }
    }
  }
  function init() {
    particleArray = [];
    for(let y = 0, y2 = textCoordinates.height; y < y2; y++) {
      for (let x = 0, x2 = textCoordinates.width; x < x2; x++) {
        if (textCoordinates.data[(y * 4 * textCoordinates.width) + (x * 4) + 3] > 128) {
            let positionX = x + adjustX;
            let positionY = y + adjustY;
            particleArray.push(new Particle(positionX * 5, positionY * 5));
        }
      }
    }
  }
  init();
    
  function animation() {
    ctx.clearRect(0, 0, gameOverCanvas.width, gameOverCanvas.height);
    for (let i = 0; i < particleArray.length; i++) {
      particleArray[i].drawGameOver();
      particleArray[i].update();
    }
    requestAnimationFrame(animation);
  }
  animation();
}

function drawMoonset() {
  let radius = 200;
  if (canvas.width < 768) {
    radius = 150;
  }
  ctx.save();
  ctx.beginPath();
  let moonColor = '255, 255, 255'; // '230, 10, 10'
  let moonGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, radius, canvas.width / 2, canvas.height / 2, 0);
  moonGradient.addColorStop(0, "rgba(" + moonColor + ", " + (1 * 0.6) + ")");
  moonGradient.addColorStop(0.5, "rgba(" + moonColor + ", " + (1 * 0.2) + ")");
  moonGradient.addColorStop(1, "rgba(" + moonColor + ", " + (1 * 0) + ")");
  ctx.fillStyle = moonGradient;
  ctx.arc(canvas.width / 2, canvas.height / 1.3, radius, Math.PI * 2, false);
  ctx.fill();
  ctx.restore();
}