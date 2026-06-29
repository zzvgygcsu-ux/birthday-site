"use strict";

const CONFIG = {
  // 30 июня, 00:00 по Москве.
  birthdayAt: "2026-06-30T00:00:00+03:00",
  winningScore: 10,
  autoUnlockForPreview: false
};

const state = {
  score: 0,
  gameRunning: false,
  soundEnabled: false,
  itemId: 0,
  activeItems: new Map(),
  gameLoopId: null,
  spawnTimer: null,
  audio: null,
  confettiRunning: false,
  musicPlaying: false,
  musicGain: null,
  musicTimer: null,
  catcherX: 0,
  easterClicks: 0,
  questStage: 1,
  nameIndex: 0,
  countdownTargetAt: null,
  lastParallaxAt: 0,
  lastTrailAt: 0,
  openedWishes: new Set()
};

const dom = {
  hero: document.getElementById("hero"),
  game: document.getElementById("game"),
  finale: document.getElementById("finale"),
  surprise: document.getElementById("surprise"),
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  previewGameButton: document.getElementById("previewGameButton"),
  stage: document.getElementById("gameStage"),
  catcher: document.getElementById("catcher"),
  score: document.getElementById("score"),
  startButton: document.getElementById("startGameButton"),
  resetButton: document.getElementById("resetGameButton"),
  soundButton: document.getElementById("soundButton"),
  surpriseButton: document.getElementById("surpriseButton"),
  spaceCanvas: document.getElementById("spaceCanvas"),
  confettiCanvas: document.getElementById("confettiCanvas"),
  preloader: document.getElementById("preloader"),
  magicTransition: document.getElementById("magicTransition"),
  musicToggle: document.getElementById("musicToggle"),
  finalGift: document.getElementById("finalGift"),
  secretMessage: document.getElementById("secretMessage"),
  finalCard: document.querySelector(".final-card"),
  questProgress: document.getElementById("questProgress"),
  stageOneCopy: document.querySelector("#game .section-copy"),
  stageOneGame: document.querySelector("#game .game-wrap"),
  nameQuest: document.getElementById("nameQuest"),
  nameBuild: document.getElementById("nameBuild"),
  letterGrid: document.getElementById("letterGrid"),
  wordHint: document.getElementById("wordHint"),
  wordComplete: document.getElementById("wordComplete"),
  wishesQuest: document.getElementById("wishesQuest"),
  wishesGrid: document.getElementById("wishesGrid"),
  wishesComplete: document.getElementById("wishesComplete"),
  wishCounter: document.getElementById("wishCounter")
};

const NAME_TARGET = ["Л", "О", "Х"];
const WORD_HINTS = [
  "Не-а, подумай как Катя 😎",
  "Почти, но нет",
  "Любимое слово где-то рядом..."
];
const WISHES = [
  "Желаю, чтобы каждый день приносил тебе повод улыбнуться.",
  "Пусть впереди будет как можно больше приятных неожиданностей и счастливых моментов.",
  "Пусть рядом всегда будут люди, рядом с которыми легко быть собой.",
  "Желаю смело идти к своим мечтам и никогда не переставать верить в себя.",
  "Пусть этот год подарит тебе множество моментов, которые захочется вспоминать снова и снова.",
  "Пусть даже обычные дни находят способ становиться красивыми и особенными.",
  "Желаю тебе спокойствия внутри и уверенности в каждом важном решении.",
  "Пусть у тебя всегда будет энергия на то, что правда зажигает сердце.",
  "Пусть маленькие чудеса случаются чаще, чем ты успеваешь их ждать.",
  "Желаю встречать людей, которые берегут твоё настроение и ценят твою доброту.",
  "Пусть в жизни будет больше тёплых разговоров, смешных историй и честных улыбок.",
  "Желаю тебе красивых побед, лёгких шагов и ощущения, что всё получается.",
  "Пусть каждый новый день приносит что-то, за что хочется сказать: вот это было классно.",
  "Желаю, чтобы мечты становились планами, а планы постепенно превращались в реальность.",
  "Пусть рядом будет много любви, поддержки и людей, с которыми спокойно на душе.",
  "Желаю тебе сиять по-своему и никогда не сомневаться, что ты очень классная.",
  "Пусть твои 17 будут яркими, добрыми, смешными и по-настоящему счастливыми."
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function setTimeValue(element, value) {
  const next = pad(value);
  if (element.textContent === next) return;

  element.textContent = next;
  const unit = element.closest(".time-unit");
  if (!unit) return;

  unit.classList.remove("tick");
  void unit.offsetWidth;
  unit.classList.add("tick");
  window.setTimeout(() => unit.classList.remove("tick"), 360);
}

function updateCountdown() {
  const now = Date.now();
  const target = new Date(CONFIG.birthdayAt).getTime();
  const distance = target - now;

  if (distance <= 0 || CONFIG.autoUnlockForPreview) {
    setTimeValue(dom.days, 0);
    setTimeValue(dom.hours, 0);
    setTimeValue(dom.minutes, 0);
    setTimeValue(dom.seconds, 0);
    showStartQuestButton();
    return true;
  }

  const totalSeconds = Math.floor(distance / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  setTimeValue(dom.days, days);
  setTimeValue(dom.hours, hours);
  setTimeValue(dom.minutes, minutes);
  setTimeValue(dom.seconds, seconds);
  return false;
}

function showStartQuestButton() {
  if (!dom.previewGameButton) return;
  dom.previewGameButton.hidden = false;
  dom.previewGameButton.classList.add("visible");
}

function unlockGame() {
  if (dom.game.classList.contains("active-section")) return;

  dom.magicTransition.classList.add("active");
  window.setTimeout(() => dom.hero.classList.add("fade-away"), 280);
  window.setTimeout(() => {
    dom.hero.style.display = "none";
    dom.game.classList.add("active-section");
    dom.game.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 1120);
  window.setTimeout(() => dom.magicTransition.classList.remove("active"), 1720);
}

function showFinale() {
  stopGame();
  updateQuestProgress("final");
  dom.finale.classList.add("unlocked");
  dom.finalCard.classList.remove("opening");
  void dom.finalCard.offsetWidth;
  dom.finalCard.classList.add("opening");
  window.setTimeout(() => {
    dom.finale.scrollIntoView({ behavior: "smooth", block: "start" });
    launchConfetti();
  }, 80);
}

function updateQuestProgress(step) {
  dom.questProgress?.querySelectorAll("span").forEach((item) => {
    item.classList.toggle("active", item.dataset.step === String(step));
  });
}

function showQuestStage(stage) {
  state.questStage = stage;
  updateQuestProgress(stage);

  dom.stageOneCopy.classList.toggle("hidden", stage !== 1);
  dom.stageOneGame.classList.toggle("hidden", stage !== 1);
  dom.nameQuest.classList.toggle("active", stage === 2);
  dom.wishesQuest.classList.toggle("active", stage === 3);
}

function transitionToQuestStage(stage) {
  dom.magicTransition.classList.add("active");
  window.setTimeout(() => {
    showQuestStage(stage);
    dom.game.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 560);
  window.setTimeout(() => dom.magicTransition.classList.remove("active"), 1350);
}

function completeStageOne() {
  stopGame();
  launchConfetti(true);
  window.setTimeout(() => transitionToQuestStage(2), 520);
}

function completeNameQuest() {
  dom.nameQuest.classList.add("complete");
  launchConfetti(true);
  window.setTimeout(() => transitionToQuestStage(3), 2000);
}

function showSurprise() {
  dom.magicTransition.classList.add("active");
  window.setTimeout(() => launchConfetti(true), 180);
  window.setTimeout(() => {
    dom.surprise.classList.add("unlocked");
    dom.surprise.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 860);
  window.setTimeout(() => dom.magicTransition.classList.remove("active"), 1500);
}

function setupReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.18 });

  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
}

function setupParallax() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  window.addEventListener("pointermove", (event) => {
    const now = performance.now();
    if (state.gameRunning || now - state.lastParallaxAt < 32) return;
    state.lastParallaxAt = now;

    const x = (event.clientX / window.innerWidth - 0.5) * 38;
    const y = (event.clientY / window.innerHeight - 0.5) * 38;
    document.documentElement.style.setProperty("--mx", `${x}px`);
    document.documentElement.style.setProperty("--my", `${y}px`);
  }, { passive: true });
}

function setupCursorTrail() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const symbols = ["♡", "♥", "✦", "✨"];

  window.addEventListener("pointermove", (event) => {
    const waitingForCountdown = dom.hero.classList.contains("active-section")
      && !dom.game.classList.contains("active-section");
    const now = performance.now();

    if (!waitingForCountdown || now - state.lastTrailAt < 48) return;
    state.lastTrailAt = now;

    const heart = document.createElement("span");
    heart.className = "cursor-heart";
    heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    heart.style.left = `${event.clientX}px`;
    heart.style.top = `${event.clientY}px`;
    heart.style.setProperty("--trail-x", `${(Math.random() - 0.5) * 42}px`);
    heart.style.setProperty("--trail-y", `${-34 - Math.random() * 34}px`);
    heart.style.setProperty("--trail-rotate", `${(Math.random() - 0.5) * 48}deg`);

    document.body.appendChild(heart);
    window.setTimeout(() => heart.remove(), 900);
  }, { passive: true });
}

function setupSpaceCanvas() {
  const canvas = dom.spaceCanvas;
  const ctx = canvas.getContext("2d");
  const particles = [];
  const comets = [];
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isSmallScreen = window.matchMedia("(max-width: 820px)").matches;
    dpr = isSmallScreen ? 1 : dpr;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles.length = 0;
    comets.length = 0;
    const count = isSmallScreen
      ? Math.min(55, Math.floor(width * height / 18000))
      : Math.min(120, Math.floor(width * height / 12000));
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() ** 2 * 3.2 + 0.45,
        speed: Math.random() * 0.34 + 0.04,
        drift: Math.random() * 0.32 + 0.06,
        alpha: Math.random() * 0.58 + 0.18,
        hue: Math.random() > 0.7 ? "255,209,102" : Math.random() > 0.45 ? "249,197,255" : "255,255,255"
      });
    }

    const cometCount = isSmallScreen ? 1 : 3;
    for (let i = 0; i < cometCount; i += 1) {
      comets.push(resetComet({ delay: 260 + Math.random() * 900 }));
    }
  }

  function resetComet(comet = {}) {
    return {
      x: width + Math.random() * width * 0.7,
      y: Math.random() * height * 0.44,
      length: Math.random() * 90 + 70,
      speed: Math.random() * 2.2 + 2.2,
      alpha: Math.random() * 0.45 + 0.35,
      delay: comet.delay || 1200 + Math.random() * 900
    };
  }

  function draw() {
    if (state.gameRunning) {
      requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, width, height);
    for (const particle of particles) {
      particle.y -= particle.speed;
      particle.x += Math.sin((particle.y + particle.size) * 0.01) * particle.drift;
      if (particle.y < -8) {
        particle.y = height + 8;
        particle.x = Math.random() * width;
      }

      ctx.fillStyle = `rgba(${particle.hue},${particle.alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < comets.length; i += 1) {
      const comet = comets[i];
      if (comet.delay > 0) {
        comet.delay -= 1;
        continue;
      }

      comet.x -= comet.speed * 2.4;
      comet.y += comet.speed * 0.82;
      const tail = ctx.createLinearGradient(comet.x, comet.y, comet.x + comet.length, comet.y - comet.length * 0.28);
      tail.addColorStop(0, `rgba(255,255,255,${comet.alpha})`);
      tail.addColorStop(0.28, `rgba(255,217,236,${comet.alpha * 0.5})`);
      tail.addColorStop(1, "rgba(249,197,255,0)");
      ctx.strokeStyle = tail;
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.lineTo(comet.x + comet.length, comet.y - comet.length * 0.28);
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (comet.x < -comet.length || comet.y > height * 0.78) {
        comets[i] = resetComet();
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
}

function setupPreloader() {
  window.setTimeout(() => {
    dom.preloader.classList.add("hidden");
    document.body.classList.remove("loading");
  }, 950);
}

function stageRect() {
  return dom.stage.getBoundingClientRect();
}

function moveCatcher(clientX) {
  const rect = stageRect();
  const half = dom.catcher.offsetWidth / 2;
  const localX = Math.max(half, Math.min(rect.width - half, clientX - rect.left));
  state.catcherX = localX;
  dom.catcher.style.left = `${localX}px`;
}

function setupGameControls() {
  dom.stage.addEventListener("pointermove", (event) => moveCatcher(event.clientX), { passive: true });
  dom.stage.addEventListener("pointerdown", (event) => {
    moveCatcher(event.clientX);
    if (!state.gameRunning) startGame();
  }, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (!state.gameRunning) return;
    const rect = stageRect();
    const current = parseFloat(dom.catcher.style.left || rect.width / 2);
    const step = event.key === "ArrowLeft" ? -34 : event.key === "ArrowRight" ? 34 : 0;
    if (step) {
      dom.catcher.style.left = `${Math.max(38, Math.min(rect.width - 38, current + step))}px`;
    }
  });

  dom.startButton.addEventListener("click", startGame);
  dom.resetButton.addEventListener("click", resetGame);
  dom.soundButton.addEventListener("click", toggleSound);
  dom.previewGameButton?.addEventListener("click", unlockGame);
  dom.surpriseButton.addEventListener("click", showFinale);
  dom.musicToggle.addEventListener("click", toggleMusic);
  dom.finalGift.addEventListener("click", () => openGift(true));
  dom.letterGrid.addEventListener("click", handleLetterClick);
  dom.wishesGrid.addEventListener("click", handleWishClick);
}

function startGame() {
  if (state.gameRunning) return;
  initAudio();
  state.gameRunning = true;
  document.body.classList.add("game-running");
  dom.startButton.textContent = "Игра идет";
  dom.startButton.disabled = true;
  state.spawnTimer = window.setInterval(spawnItem, 620);
  state.gameLoopId = requestAnimationFrame(updateGame);
}

function stopGame() {
  state.gameRunning = false;
  document.body.classList.remove("game-running");
  window.clearInterval(state.spawnTimer);
  cancelAnimationFrame(state.gameLoopId);
  state.spawnTimer = null;
  state.gameLoopId = null;
  dom.startButton.textContent = "Начать игру";
  dom.startButton.disabled = false;
}

function resetGame() {
  stopGame();
  state.score = 0;
  updateScore();
  state.activeItems.forEach((item) => item.element.remove());
  state.activeItems.clear();
}

function updateScore() {
  dom.score.textContent = state.score;
}

function spawnItem() {
  const stageWidth = dom.stage.clientWidth;
  const roll = Math.random();
  const type = roll < 0.46 ? "gift" : roll < 0.86 ? "star" : "empty";
  const element = document.createElement("div");
  element.className = "falling-item";
  element.textContent = type === "gift" ? "🎁" : type === "star" ? "⭐" : "⬛";
  element.dataset.type = type;

  const id = state.itemId += 1;
  const item = {
    id,
    element,
    x: Math.random() * Math.max(10, stageWidth - 54),
    y: -60,
    speed: type === "empty" ? 2.5 + Math.random() * 1.4 : 2.2 + Math.random() * 1.6,
    spin: Math.random() * 360,
    type
  };

  element.style.left = `${item.x}px`;
  element.style.transform = `translate3d(0, ${item.y}px, 0) rotate(${item.spin}deg)`;
  dom.stage.appendChild(element);
  state.activeItems.set(id, item);
}

function updateGame() {
  const stageHeight = dom.stage.clientHeight;
  const catcherWidth = dom.catcher.offsetWidth;
  const catcherHeight = dom.catcher.offsetHeight;
  const catcherX = state.catcherX || dom.stage.clientWidth / 2;
  const catcherLeft = catcherX - catcherWidth / 2;
  const catcherRight = catcherX + catcherWidth / 2;
  const catcherTop = stageHeight - 18 - catcherHeight;
  const catcherBottom = stageHeight - 18;

  state.activeItems.forEach((item) => {
    item.y += item.speed;
    item.spin += item.type === "empty" ? 2.2 : 3.6;
    item.element.style.transform = `translate3d(0, ${item.y}px, 0) rotate(${item.spin}deg)`;

    const itemLeft = item.x;
    const itemRight = item.x + 46;
    const itemTop = item.y;
    const itemBottom = item.y + 46;
    const caught = itemBottom > catcherTop
      && itemTop < catcherBottom
      && itemRight > catcherLeft
      && itemLeft < catcherRight;

    if (caught) collectItem(item);
    if (item.y > stageHeight + 80) removeItem(item);
  });

  if (state.gameRunning) state.gameLoopId = requestAnimationFrame(updateGame);
}

function collectItem(item) {
  const isGood = item.type !== "empty";
  state.score = Math.max(0, state.score + (isGood ? 1 : -2));
  updateScore();
  burst(item.element.offsetLeft + 23, item.y + 23, isGood ? "#FFD9EC" : "#DDBBFF");
  playCollectSound(isGood);
  removeItem(item);

  if (state.score >= CONFIG.winningScore) {
    state.score = CONFIG.winningScore;
    updateScore();
    completeStageOne();
  }
}

function removeItem(item) {
  item.element.remove();
  state.activeItems.delete(item.id);
}

function burst(x, y, color, container = dom.stage) {
  for (let i = 0; i < 12; i += 1) {
    const dot = document.createElement("span");
    dot.className = "pop";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.background = color;
    dot.style.setProperty("--dx", `${(Math.random() - 0.5) * 100}px`);
    dot.style.setProperty("--dy", `${(Math.random() - 0.5) * 100}px`);
    container.appendChild(dot);
    window.setTimeout(() => dot.remove(), 700);
  }
}

function updateNameBuild() {
  const slots = dom.nameBuild.querySelectorAll("span");
  slots.forEach((slot, index) => {
    const wasFilled = slot.classList.contains("filled");
    const isFilled = index < state.nameIndex;
    slot.textContent = index < state.nameIndex ? NAME_TARGET[index] : "_";
    slot.classList.toggle("filled", isFilled);
    if (isFilled && !wasFilled) {
      slot.classList.remove("flash");
      void slot.offsetWidth;
      slot.classList.add("flash");
      window.setTimeout(() => slot.classList.remove("flash"), 620);
    }
  });
}

function handleLetterClick(event) {
  const button = event.target.closest(".letter-tile");
  if (!button || state.questStage !== 2 || dom.nameQuest.classList.contains("complete")) return;

  const expected = NAME_TARGET[state.nameIndex];
  const selected = button.dataset.letter;

  if (selected !== expected) {
    const hint = WORD_HINTS[Math.floor(Math.random() * WORD_HINTS.length)];
    dom.wordHint.textContent = hint;
    dom.wordHint.classList.remove("show");
    void dom.wordHint.offsetWidth;
    dom.wordHint.classList.add("show");
    button.classList.remove("wrong");
    void button.offsetWidth;
    button.classList.add("wrong");
    window.setTimeout(() => button.classList.remove("wrong"), 430);
    return;
  }

  button.classList.add("collected", "correct");
  state.nameIndex += 1;
  updateNameBuild();
  dom.wordHint.textContent = state.nameIndex < NAME_TARGET.length ? "Да-да, вот оно ✨" : "";
  dom.wordHint.classList.toggle("show", state.nameIndex < NAME_TARGET.length);
  burst(button.offsetLeft + button.offsetWidth / 2, button.offsetTop + button.offsetHeight / 2, "#FFD9EC", dom.nameQuest);
  playCollectSound(true);

  if (state.nameIndex >= NAME_TARGET.length) {
    completeNameQuest();
  }
}

function setupWishes() {
  dom.wishesGrid.innerHTML = "";
  dom.wishesQuest.classList.remove("all-opened");
  dom.wishesComplete?.classList.remove("show");
  WISHES.forEach((wish, index) => {
    const button = document.createElement("button");
    button.className = `wish-box wish-box-${(index % 6) + 1}`;
    button.type = "button";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", `Открыть пожелание ${index + 1}`);

    const lid = document.createElement("span");
    lid.className = "wish-lid";

    const ribbon = document.createElement("span");
    ribbon.className = "wish-ribbon";

    const bow = document.createElement("span");
    bow.className = "wish-bow";

    const glow = document.createElement("span");
    glow.className = "wish-glow";

    const sparkle = document.createElement("span");
    sparkle.className = "wish-sparkles";

    const label = document.createElement("span");
    label.className = "wish-text";
    label.textContent = wish;

    button.append(lid, ribbon, bow, glow, sparkle);
    button.appendChild(label);
    dom.wishesGrid.appendChild(button);
  });
  updateWishCounter();
}

function updateWishCounter() {
  dom.wishCounter.innerHTML = `<span>Открыто подарков</span><strong>${state.openedWishes.size} / ${WISHES.length}</strong>`;
}

function handleWishClick(event) {
  const button = event.target.closest(".wish-box");
  if (!button || state.questStage !== 3 || button.classList.contains("opened")) return;

  const index = Number(button.dataset.index);
  state.openedWishes.add(index);
  button.classList.add("opened");
  button.setAttribute("aria-label", `Пожелание открыто: ${WISHES[index]}`);
  updateWishCounter();
  burst(button.offsetLeft + button.offsetWidth / 2, button.offsetTop + button.offsetHeight / 2, "#FFD166", dom.wishesQuest);
  playCollectSound(true);

  if (state.openedWishes.size >= WISHES.length) {
    dom.wishesQuest.classList.add("all-opened");
    dom.wishesComplete?.classList.add("show");
    launchConfetti(true);
    window.setTimeout(() => launchConfetti(true), 720);
    window.setTimeout(showFinale, 2500);
  }
}

function initAudio() {
  if (!state.audio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) state.audio = new AudioContext();
  }
  if (state.audio?.state === "suspended") state.audio.resume();
}

function toggleMusic() {
  initAudio();
  if (!state.audio) return;

  state.musicPlaying = !state.musicPlaying;
  dom.musicToggle.classList.toggle("playing", state.musicPlaying);
  dom.musicToggle.textContent = state.musicPlaying ? "🔊 Музыка играет" : "🔈 Включить музыку";
  dom.musicToggle.setAttribute("aria-label", state.musicPlaying ? "Выключить музыку" : "Включить музыку");

  if (state.musicPlaying) {
    startAmbientMusic();
  } else {
    stopAmbientMusic();
  }
}

function startAmbientMusic() {
  const ctx = state.audio;
  if (!state.musicGain) {
    state.musicGain = ctx.createGain();
    state.musicGain.gain.value = 0;
    state.musicGain.connect(ctx.destination);
  }

  state.musicGain.gain.cancelScheduledValues(ctx.currentTime);
  state.musicGain.gain.setValueAtTime(state.musicGain.gain.value, ctx.currentTime);
  state.musicGain.gain.linearRampToValueAtTime(0.095, ctx.currentTime + 2.6);
  playAmbientChord();
  window.clearInterval(state.musicTimer);
  state.musicTimer = window.setInterval(playAmbientChord, 3100);
}

function stopAmbientMusic() {
  if (!state.audio || !state.musicGain) return;
  const ctx = state.audio;
  state.musicGain.gain.cancelScheduledValues(ctx.currentTime);
  state.musicGain.gain.setValueAtTime(state.musicGain.gain.value, ctx.currentTime);
  state.musicGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
  window.setTimeout(() => window.clearInterval(state.musicTimer), 1850);
}

function playAmbientChord() {
  if (!state.musicPlaying || !state.audio || !state.musicGain) return;

  const ctx = state.audio;
  const chords = [
    [261.63, 329.63, 392.00],
    [220.00, 277.18, 329.63],
    [246.94, 311.13, 369.99],
    [196.00, 261.63, 329.63]
  ];
  const chord = chords[Math.floor(Math.random() * chords.length)];
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 850;
  filter.Q.value = 0.42;
  filter.connect(state.musicGain);

  chord.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.detune.setValueAtTime((Math.random() - 0.5) * 5, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(index === 0 ? 0.052 : 0.028, ctx.currentTime + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.4);
    oscillator.connect(gain);
    gain.connect(filter);
    oscillator.start(ctx.currentTime + index * 0.035);
    oscillator.stop(ctx.currentTime + 4.55);
  });
}

function toggleSound() {
  initAudio();
  state.soundEnabled = !state.soundEnabled;
  dom.soundButton.textContent = state.soundEnabled ? "♫" : "♪";
  dom.soundButton.setAttribute("aria-label", state.soundEnabled ? "Выключить звук" : "Включить звук");
}

function playCollectSound(isGood) {
  if (!state.soundEnabled || !state.audio) return;

  const ctx = state.audio;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(isGood ? 620 : 180, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(isGood ? 980 : 120, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.16);
}

function openGift(countClick) {
  dom.finalGift.classList.add("opened");

  if (!countClick || dom.secretMessage.classList.contains("visible")) return;
  state.easterClicks += 1;
  if (state.easterClicks >= 5) {
    dom.secretMessage.classList.add("visible");
    launchConfetti(true);
  }
}

function launchConfetti(force = false) {
  if (state.confettiRunning && !force) return;
  state.confettiRunning = true;

  const canvas = dom.confettiCanvas;
  const ctx = canvas.getContext("2d");
  const pieces = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let start = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    pieces.length = 0;
    const colors = ["#FFD9EC", "#F9C5FF", "#EFD7FF", "#DDBBFF", "#A56CFF", "#FFD166", "#FFFFFF"];
    for (let i = 0; i < 180; i += 1) {
      pieces.push({
        x: Math.random() * width,
        y: -Math.random() * height,
        w: Math.random() * 9 + 5,
        h: Math.random() * 14 + 6,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.18
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    pieces.forEach((piece) => {
      piece.x += piece.vx + Math.sin(time * 0.002 + piece.y * 0.01) * 0.35;
      piece.y += piece.vy;
      piece.rot += piece.spin;
      if (piece.y > height + 40) {
        piece.y = -40;
        piece.x = Math.random() * width;
      }

      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rot);
      ctx.fillStyle = piece.color;
      ctx.shadowColor = piece.color;
      ctx.shadowBlur = 12;
      ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      ctx.restore();
    });

    if (time - start < 9000) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, width, height);
      state.confettiRunning = false;
    }
  }

  resize();
  seed();
  start = performance.now();
  requestAnimationFrame(draw);
  window.addEventListener("resize", resize, { once: true });
}

function init() {
  setupPreloader();
  setupReveal();
  setupParallax();
  setupCursorTrail();
  setupSpaceCanvas();
  setupWishes();
  updateNameBuild();
  showQuestStage(1);
  setupGameControls();
  updateCountdown();

  const timer = window.setInterval(() => {
    if (updateCountdown()) window.clearInterval(timer);
  }, 1000);
}

init();
