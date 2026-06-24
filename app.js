// 부문 정의: key, 탭/칩 라벨, 그리드에 포함할 게임 판별, 안내 문구.
const DIVISIONS = {
  corporate: {
    label: "기업 부문",
    hint: "기업 부문 출품작 중 최고의 게임을 선택하세요.",
    filter: (g) => g.division === "corporate",
  },
  student: {
    label: "학생 부문",
    hint: "학생 부문 출품작 중 최고의 게임을 선택하세요.",
    filter: (g) => g.division === "student",
  },
};
const DIVISION_KEYS = ["student", "corporate"];
const STORAGE_KEY = "build051_selections";

let allGames = [];
let activeDivision = "student";
// 부문별 선택된 게임 이름 (없으면 null)
let selections = { corporate: null, student: null };

// ---- 선택 상태 저장/복원 ----
function loadSelections() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") {
      for (const k of DIVISION_KEYS) {
        if (typeof saved[k] === "string") selections[k] = saved[k];
      }
    }
  } catch (e) {
    /* 저장값이 없거나 손상 — 무시 */
  }
}
function saveSelections() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  } catch (e) {
    /* localStorage 불가 환경 — 무시 */
  }
}

// 폼에 보낼 값: 폼 선택지 형식("게임명 - 팀명")과 정확히 일치시킨다.
function formValueFor(division) {
  const name = selections[division];
  if (!name) return null;
  const g = allGames.find((x) => x.name === name && x.division === division);
  const team = g && g.team ? g.team.trim() : "";
  return team ? name + " - " + team : name;
}

// ---- 제출 URL: 선택된 부문들을 모두 prefill ----
function buildSubmitUrl() {
  if (!CONFIG.formBaseUrl) return "";
  let url = CONFIG.formBaseUrl;
  for (const k of DIVISION_KEYS) {
    const entryId = CONFIG.entryIds && CONFIG.entryIds[k];
    const value = formValueFor(k);
    if (entryId && value) {
      const sep = url.includes("?") ? "&" : "?";
      url += sep + entryId + "=" + encodeURIComponent(value);
    }
  }
  return url;
}

function selectedCount() {
  return DIVISION_KEYS.filter((k) => selections[k]).length;
}
function missingDivisions() {
  return DIVISION_KEYS.filter((k) => !selections[k]).map((k) => DIVISIONS[k].label);
}

// ---- 카드 ----
function createCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";

  const imgWrap = document.createElement("div");
  imgWrap.className = "game-image";
  if (game.image) {
    const img = document.createElement("img");
    img.src = game.image;
    img.alt = game.name;
    img.loading = "lazy";
    img.onerror = () => {
      imgWrap.classList.add("placeholder");
      img.remove();
    };
    imgWrap.appendChild(img);
  } else {
    imgWrap.classList.add("placeholder");
  }
  card.appendChild(imgWrap);

  const name = document.createElement("h2");
  name.className = "game-name";
  name.textContent = game.name;
  card.appendChild(name);

  // 팀명 — 값이 있을 때만 생성
  if (game.team && game.team.trim() !== "") {
    const team = document.createElement("p");
    team.className = "game-team";
    team.textContent = game.team;
    card.appendChild(team);
  }

  if (game.description && game.description.trim() !== "") {
    const desc = document.createElement("p");
    desc.className = "game-desc";
    desc.textContent = game.description;
    card.appendChild(desc);
  }

  // 현재 부문에서 이 게임이 선택되었는지
  const isSelected = selections[activeDivision] === game.name;
  if (isSelected) card.classList.add("selected");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pick-btn" + (isSelected ? " selected" : "");
  btn.textContent = isSelected ? "✓ 선택됨" : "이 게임 선택";
  btn.addEventListener("click", () => toggleSelection(game.name));
  card.appendChild(btn);

  return card;
}

// 현재 부문 선택을 토글 (같은 게임 다시 누르면 해제, 다른 게임 누르면 교체)
function toggleSelection(gameName) {
  if (selections[activeDivision] === gameName) {
    selections[activeDivision] = null;
  } else {
    selections[activeDivision] = gameName;
  }
  saveSelections();
  render();
}

function showStatus(message) {
  const status = document.getElementById("status");
  if (message) {
    status.textContent = message;
    status.hidden = false;
  } else {
    status.hidden = true;
  }
}

// ---- 하단 제출 바 ----
function renderSubmitBar() {
  for (const k of DIVISION_KEYS) {
    const valueEl = document.querySelector('[data-pick="' + k + '"]');
    const pickBtn = valueEl.closest(".pick");
    if (selections[k]) {
      valueEl.textContent = selections[k];
      pickBtn.classList.add("done");
    } else {
      valueEl.textContent = "미선택";
      pickBtn.classList.remove("done");
    }
  }

  const count = selectedCount();
  const submitBtn = document.getElementById("submit-btn");
  const total = DIVISION_KEYS.length;
  submitBtn.textContent = "투표 제출하기 (" + count + "/" + total + ")";
  submitBtn.classList.toggle("ready", count === total);

  // 제출 안내 메시지는 제출 시도 시에만 채워지므로 평소엔 비움
  if (count === total) document.getElementById("submit-msg").textContent = "";
}

function onSubmit() {
  const msg = document.getElementById("submit-msg");
  const missing = missingDivisions();
  if (missing.length > 0) {
    msg.textContent = "아직 선택하지 않은 부문: " + missing.join(", ");
    return;
  }
  const url = buildSubmitUrl();
  if (!url) {
    alert("투표 폼이 아직 준비되지 않았습니다. (config.js 설정 필요)");
    return;
  }
  msg.textContent = "";
  window.open(url, "_blank", "noopener");
}

// ---- 탭/그리드 렌더 ----
function render() {
  const division = DIVISIONS[activeDivision];
  document.getElementById("tab-hint").textContent = division.hint;

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.division === activeDivision);
  });

  const grid = document.getElementById("game-grid");
  grid.innerHTML = "";
  const games = allGames.filter(division.filter);
  if (games.length === 0) {
    showStatus("이 부문에는 아직 등록된 게임이 없습니다.");
  } else {
    showStatus("");
    for (const game of games) grid.appendChild(createCard(game));
  }

  renderSubmitBar();
}

function setupTabs() {
  document.getElementById("tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    activeDivision = tab.dataset.division;
    render();
  });
}

function setupSubmitBar() {
  // 칩 클릭 → 해당 탭으로 이동
  document.getElementById("picks").addEventListener("click", (e) => {
    const pick = e.target.closest(".pick");
    if (!pick) return;
    activeDivision = pick.dataset.division;
    render();
  });
  document.getElementById("submit-btn").addEventListener("click", onSubmit);
}

async function init() {
  loadSelections();
  setupTabs();
  setupSubmitBar();
  try {
    const res = await fetch("games.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const games = await res.json();
    if (!Array.isArray(games)) throw new Error("games.json 형식 오류");
    allGames = games;
    render();
  } catch (err) {
    showStatus("게임 목록을 불러오지 못했습니다. (games.json 확인 필요)");
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", init);
