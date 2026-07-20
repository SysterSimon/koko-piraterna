(() => {
  "use strict";

  const STORAGE_KEY = "koko-piraterna-adventure-v1";
  const app = document.querySelector("#app");
  let sessionAdventure = null;
  let audioContext = null;

  const defaults = {
    introMessage: "Ahoy, modiga pirater! Apan Koko har försvunnit. Följ kartan och klara uppdragen för att hitta honom och skatten!",
    mapDataUrl: "",
    stations: [
      { instruction: "Bygg en stadig bro över floden av pinnar och grenar.", letter: "K" },
      { instruction: "Fäll piratstockarna genom att kasta mjuka bollar eller kottar.", letter: "O" },
      { instruction: "Jaga bort krokodilen genom att träffa stocken med kottar.", letter: "K" },
      { instruction: "Leta efter Kokos gömda bana och lös sista uppdraget.", letter: "O" }
    ],
    password: "KOKO",
    finalClue: "Ni klarade det! Skatten finns gömd: ________________________________"
  };

  const escapeHtml = (text = "") => String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const normalize = (text = "") => String(text).toLocaleUpperCase("sv-SE").replace(/[^A-ZÅÄÖ]/g, "");

  function loadAdventure() {
    if (sessionAdventure) return sessionAdventure;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !Array.isArray(saved.stations)) return null;
      return saved;
    } catch {
      return null;
    }
  }

  function persistAdventure(adventure) {
    sessionAdventure = adventure;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adventure));
      return true;
    } catch {
      return false;
    }
  }

  function setSetupUrl() {
    history.replaceState({}, "", `${location.pathname}?setup=1`);
  }

  function renderSetup(adventure = loadAdventure() || defaults) {
    setSetupUrl();
    app.innerHTML = `
      <section class="setup-shell">
        <header class="brand"><span class="brand__flag">☠</span><h1>Kokos piratäventyr</h1><p>Ställ in jakten. Sedan får barnen en helt blank startskärm.</p></header>
        <form id="setup-form">
          <section class="setup-card">
            <h2>Kaptenens första meddelande</h2>
            <label for="intro">Meddelande från Koko</label>
            <textarea id="intro" required>${escapeHtml(adventure.introMessage)}</textarea>
            <label for="map">Äventyrskarta (PNG eller JPEG)</label>
            <input id="map" type="file" accept="image/png,image/jpeg" />
            <p class="hint" id="map-status">${adventure.mapDataUrl ? "Karta inlagd. Välj en ny fil om du vill byta den." : "Kartbilden visas med första meddelandet och efter varje avklarad station."}</p>
          </section>
          <section class="setup-card">
            <h2>Stationer</h2>
            <p class="hint">Varje station ger en bokstav. Instruktionen kommer först efter fyra tryck på höger sida av spelskärmen. Sedan kommer belöningen efter nästa fyra tryck.</p>
            <div class="station-list" id="station-list"></div>
            <div class="button-row"><button class="button button--secondary" type="button" id="add-station">+ Lägg till station</button></div>
          </section>
          <section class="setup-card">
            <h2>Skattens lösenord</h2>
            <label for="password">Rätt ordning på bokstäverna</label>
            <input id="password" maxlength="24" required value="${escapeHtml(adventure.password)}" placeholder="Till exempel KOKO" />
            <p class="hint">Barnen får bokstäverna i stationsordning, blandar dem på skärmen och måste trycka två bokstäver för att byta plats tills ordet är rätt.</p>
            <label for="final-clue">Sista ledtråden när lösenordet är rätt</label>
            <textarea id="final-clue" required>${escapeHtml(adventure.finalClue)}</textarea>
          </section>
          <section class="setup-card">
            <h2>Spara äventyret som fil</h2>
            <p>JSON-filen innehåller hela äventyret, även kartan. Spara den i telefonen så kan du ladda in exakt samma skattjakt senare.</p>
            <div class="button-row"><button class="button button--secondary" type="button" id="export-adventure">Hämta sparad JSON</button><button class="button button--secondary" type="button" id="import-adventure">Ladda JSON</button></div>
            <input id="import-file" type="file" accept="application/json,.json" hidden />
            <p class="hint" id="import-status">Spara först setupen, hämta sedan JSON-filen som backup.</p>
          </section>
          <div class="button-row"><button class="button" type="submit">Spara och öppna äventyret</button><button class="button button--danger" type="button" id="reset-defaults">Återställ exempel</button></div>
        </form>
      </section>`;

    renderStationFields(adventure.stations);
    document.querySelector("#add-station").addEventListener("click", () => addStationField());
    document.querySelector("#reset-defaults").addEventListener("click", () => renderSetup(structuredClone(defaults)));
    document.querySelector("#export-adventure").addEventListener("click", exportAdventure);
    document.querySelector("#import-adventure").addEventListener("click", () => document.querySelector("#import-file").click());
    document.querySelector("#import-file").addEventListener("change", importAdventure);
    document.querySelector("#setup-form").addEventListener("submit", saveSetup);
  }

  function renderStationFields(stations) {
    const list = document.querySelector("#station-list");
    list.innerHTML = "";
    stations.forEach((station, index) => addStationField(station, index));
  }

  function addStationField(station = { instruction: "", letter: "" }, explicitIndex) {
    const list = document.querySelector("#station-list");
    const index = explicitIndex ?? list.children.length;
    const el = document.createElement("article");
    el.className = "station-card";
    el.innerHTML = `
      <div class="row"><h3>Station <span class="station-number">${index + 1}</span></h3><button class="small-button remove-station" type="button" aria-label="Ta bort station">Ta bort</button></div>
      <label>Instruktion<textarea class="station-instruction" required placeholder="Vad ska piraterna göra?">${escapeHtml(station.instruction)}</textarea></label>
      <label>Bokstav till lösenordet<input class="station-letter" required maxlength="1" value="${escapeHtml(station.letter)}" placeholder="K" /></label>`;
    el.querySelector(".remove-station").addEventListener("click", () => {
      if (list.children.length === 1) return;
      el.remove();
      [...list.children].forEach((card, i) => { card.querySelector(".station-number").textContent = i + 1; });
    });
    el.querySelector(".station-letter").addEventListener("input", (event) => {
      event.target.value = normalize(event.target.value).slice(0, 1);
    });
    list.append(el);
  }

  function saveSetup(event) {
    event.preventDefault();
    const mapInput = document.querySelector("#map");
    const build = (mapDataUrl) => {
      const stations = [...document.querySelectorAll(".station-card")].map((card) => ({
        instruction: card.querySelector(".station-instruction").value.trim(),
        letter: normalize(card.querySelector(".station-letter").value).slice(0, 1)
      }));
      const password = normalize(document.querySelector("#password").value);
      if (!stations.every((station) => station.instruction && station.letter)) return alert("Fyll i instruktion och en bokstav för varje station.");
      if (!password) return alert("Skriv lösenordet som barnen ska få fram.");
      if (normalize(stations.map((station) => station.letter).join("")) .split("").sort().join("") !== password.split("").sort().join("")) {
        return alert("Lösenordet måste innehålla exakt samma bokstäver som stationerna.");
      }
      const resolvedMap = mapDataUrl || adventureFromStorage().mapDataUrl;
      if (!resolvedMap) return alert("Lägg in en karta innan äventyret startar.");
      const adventure = {
        introMessage: document.querySelector("#intro").value.trim(),
        mapDataUrl: resolvedMap,
        stations,
        password,
        finalClue: document.querySelector("#final-clue").value.trim()
      };
      const persisted = persistAdventure(adventure);
      if (!persisted) alert("Äventyret fungerar nu, men kartan är för stor för webbläsarens lokala lagring. Hämta JSON-filen från setupen för att kunna ladda den igen senare.");
      history.replaceState({}, "", location.pathname);
      renderPlay(adventure);
    };

    const file = mapInput.files[0];
    if (!file) return build("");
    if (!/image\/(png|jpeg)/.test(file.type)) return alert("Välj en PNG- eller JPEG-bild.");
    const reader = new FileReader();
    reader.onload = () => build(reader.result);
    reader.readAsDataURL(file);
  }

  function adventureFromStorage() { return loadAdventure() || defaults; }

  function exportAdventure() {
    const adventure = loadAdventure();
    if (!adventure) return alert("Spara setupen först, sedan kan du hämta en JSON-fil.");
    const blob = new Blob([JSON.stringify({ format: "koko-piraterna", version: 1, adventure }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "koko-pirataventyr.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importAdventure(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const adventure = validateAdventure(parsed.adventure || parsed);
        persistAdventure(adventure);
        renderSetup(adventure);
        document.querySelector("#import-status").textContent = "JSON-filen är inläst. Kontrollera uppgifterna och öppna sedan äventyret.";
      } catch {
        alert("Det gick inte att läsa den JSON-filen som ett Koko-äventyr.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function validateAdventure(value) {
    if (!value || typeof value !== "object" || !Array.isArray(value.stations)) throw new Error("Invalid adventure");
    const stations = value.stations.map((station) => ({
      instruction: String(station.instruction || "").trim(),
      letter: normalize(station.letter).slice(0, 1)
    }));
    const password = normalize(value.password);
    const letters = stations.map((station) => station.letter).sort().join("");
    if (!stations.length || !stations.every((station) => station.instruction && station.letter) || !value.mapDataUrl || letters !== password.split("").sort().join("")) throw new Error("Invalid adventure");
    return {
      introMessage: String(value.introMessage || "").trim(),
      mapDataUrl: String(value.mapDataUrl),
      stations,
      password,
      finalClue: String(value.finalClue || "").trim()
    };
  }

  function createEvents(adventure) {
    const events = [{ type: "intro", title: "Meddelande från Koko", message: adventure.introMessage, map: true }];
    adventure.stations.forEach((station, index) => {
      events.push({ type: "instruction", title: `Station ${index + 1}`, message: station.instruction });
      events.push({ type: "success", title: "Ni klarade det, pirater!", message: `Bokstaven till lösenordet är:`, letter: station.letter, map: index < adventure.stations.length - 1 });
    });
    events.push({ type: "password", title: "Skattens lösenord", message: "Ni har hittat alla bokstäver! Placera dem i rätt ordning för att få den sista ledtråden." });
    return events;
  }

  function getAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audioContext ||= new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function playTone(context, frequency, start, duration, volume, type = "sine") {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function playMagicSound() {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime + 0.02;
    [523.25, 659.25, 783.99].forEach((frequency, index) => playTone(context, frequency, now + index * 0.085, 0.25, 0.045));
  }

  function playFanfare() {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime + 0.02;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => playTone(context, frequency, now + index * 0.12, index === 3 ? 0.56 : 0.2, 0.07, "triangle"));
  }

  function renderPlay(adventure) {
    const events = createEvents(adventure);
    let eventIndex = -1;
    let taps = 0;
    app.innerHTML = `<section class="play-screen" id="play-screen"><div class="tap-zone" aria-label="Tryck här för nästa del"></div></section>`;
    const screen = document.querySelector("#play-screen");
    const zone = screen.querySelector(".tap-zone");
    zone.addEventListener("click", () => {
      if (eventIndex >= events.length - 1) return;
      taps += 1;
      if (taps === 4) { taps = 0; eventIndex += 1; showEvent(screen, events[eventIndex], adventure); }
      else updateProgress(screen, taps);
    });
  }

  function updateProgress(screen, taps) {
    let marker = screen.querySelector(".tap-marker");
    if (!marker) {
      marker = document.createElement("span");
      marker.className = "tap-marker empty-help";
      screen.append(marker);
    }
    marker.textContent = ".".repeat(taps);
  }

  function showEvent(screen, event, adventure) {
    screen.querySelector(".event")?.remove();
    screen.querySelector(".tap-marker")?.remove();
    playMagicSound();
    const card = document.createElement("article");
    card.className = "event";
    const map = event.map && adventure.mapDataUrl ? `<img class="event__map" src="${adventure.mapDataUrl}" alt="Äventyrskarta" />` : "";
    const letter = event.letter ? `<span class="event__letter">${escapeHtml(event.letter)}</span>` : "";
    card.innerHTML = `<div class="event__koko"><img src="assets/koko-cartoon.png" alt="Den tecknade piratapan Koko med ögonlapp" /></div><h1>${escapeHtml(event.title)}</h1><p>${escapeHtml(event.message)}</p>${letter}${map}`;
    if (event.type === "password") {
      screen.querySelector(".tap-zone").style.pointerEvents = "none";
      createPasswordGame(card, adventure);
    }
    screen.append(card);
  }

  function createPasswordGame(card, adventure) {
    const letters = adventure.stations.map((station) => station.letter);
    let shuffled = shuffle(letters);
    for (let attempt = 0; attempt < 12 && normalize(shuffled.join("")) === adventure.password; attempt += 1) shuffled = shuffle(letters);
    let selected = null;
    let solved = false;
    const game = document.createElement("section");
    game.className = "password";
    game.innerHTML = `<div class="password__tiles"></div><p class="password__status">Tryck på två bokstäver för att byta plats.</p>`;
    const tiles = game.querySelector(".password__tiles");
    const status = game.querySelector(".password__status");
    const draw = () => {
      tiles.innerHTML = "";
      shuffled.forEach((letter, index) => {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = `tile${selected === index ? " is-selected" : ""}`;
        tile.textContent = letter;
        tile.addEventListener("click", () => {
          if (selected === null) { selected = index; draw(); return; }
          if (selected === index) { selected = null; draw(); return; }
          [shuffled[selected], shuffled[index]] = [shuffled[index], shuffled[selected]];
          selected = null;
          draw();
          if (normalize(shuffled.join("")) === adventure.password) {
            if (!solved) playFanfare();
            solved = true;
            status.innerHTML = `<span class="treasure">Rätt lösenord!</span><br>${escapeHtml(adventure.finalClue)}`;
          }
        });
        tiles.append(tile);
      });
    };
    draw();
    if (normalize(shuffled.join("")) === adventure.password) {
      if (!solved) playFanfare();
      solved = true;
      status.innerHTML = `<span class="treasure">Rätt lösenord!</span><br>${escapeHtml(adventure.finalClue)}`;
    }
    card.append(game);
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    if (result.join("") === items.join("") && result.length > 1) [result[0], result[1]] = [result[1], result[0]];
    return result;
  }

  if (new URLSearchParams(location.search).has("setup") || !loadAdventure()) renderSetup();
  else renderPlay(loadAdventure());

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
