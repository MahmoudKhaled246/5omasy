// app.js — صفحة الفرق الرئيسية

import { db } from "./firebase-config.js";
import {
  collection, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ===== STATE =====
let allPlayers   = [];
let selectedIds  = new Set();
let lastTeams    = null;

// ===== DOM =====
const grid        = document.getElementById("players-grid");
const countBadge  = document.getElementById("count-badge");
const generateBtn = document.getElementById("generate-btn");
const selectAllBtn= document.getElementById("select-all-btn");
const clearBtn    = document.getElementById("clear-btn");
const searchInput = document.getElementById("search-input");

const teamsSection    = document.getElementById("teams-section");
const selectionSection= document.getElementById("selection-section");
const teamAList  = document.getElementById("team-a-list");
const teamBList  = document.getElementById("team-b-list");
const scoreA     = document.getElementById("score-a");
const scoreB     = document.getElementById("score-b");
const balanceFill= document.getElementById("balance-fill");
const balanceLabel= document.getElementById("balance-label");
const reshuffleBtn= document.getElementById("reshuffle-btn");
const backBtn    = document.getElementById("back-btn");

// ===== LOAD PLAYERS (realtime) =====
const q = query(collection(db, "players"), orderBy("name"));
onSnapshot(q, (snapshot) => {
  allPlayers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderGrid(allPlayers);
});

// ===== RENDER GRID =====
function renderGrid(players) {
  const keyword = (searchInput?.value || "").trim().toLowerCase();
  const filtered = keyword
    ? players.filter(p => p.name.toLowerCase().includes(keyword))
    : players;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty">😕 مفيش لاعبين${keyword ? " بالاسم ده" : "، اضف لاعبين أولاً"}</div>`;
    return;
  }

  grid.innerHTML = "";
  filtered.forEach(p => {
    const div = document.createElement("div");
    div.className = "player-card" + (selectedIds.has(p.id) ? " selected" : "");
    div.dataset.id = p.id;
    div.innerHTML = `
      <div class="p-name">${p.name}</div>
      <div class="p-stars">${starsHtml(p.rating)}</div>
      <div class="p-rating">${p.rating} ★</div>
    `;
    div.addEventListener("click", () => toggleSelect(p.id));
    grid.appendChild(div);
  });

  updateCount();
}

// ===== TOGGLE SELECT =====
function toggleSelect(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  renderGrid(allPlayers);
}

function updateCount() {
  countBadge.textContent = selectedIds.size;
  generateBtn.disabled = selectedIds.size < 4 || selectedIds.size > 10;
}

// ===== SELECT ALL / CLEAR =====
selectAllBtn.addEventListener("click", () => {
  allPlayers.forEach(p => selectedIds.add(p.id));
  renderGrid(allPlayers);
});

clearBtn.addEventListener("click", () => {
  selectedIds.clear();
  renderGrid(allPlayers);
});

// ===== SEARCH =====
searchInput.addEventListener("input", () => renderGrid(allPlayers));

// ===== GENERATE TEAMS =====
generateBtn.addEventListener("click", () => {
  const chosen = allPlayers.filter(p => selectedIds.has(p.id));
  if (chosen.length < 4) return;

  const { teamA, teamB } = balancedSplit(chosen);
  lastTeams = { teamA, teamB, chosen };
  showTeams(teamA, teamB);
});

reshuffleBtn.addEventListener("click", () => {
  if (!lastTeams) return;
  const { teamA, teamB } = balancedSplit(lastTeams.chosen);
  lastTeams = { ...lastTeams, teamA, teamB };
  showTeams(teamA, teamB);
});

backBtn.addEventListener("click", () => {
  teamsSection.classList.add("hidden");
  selectionSection.classList.remove("hidden");
});

// ===== BALANCED SPLIT ALGORITHM =====
// خوارزمية: ترتيب تنازلي → توزيع snake draft (1→A, 2→B, 3→B, 4→A ...)
// + عشوائية خفيفة عشان مش دايماً نفس الفرق
function balancedSplit(players) {
  // نسخ وخلط عشوائي خفيف لنفس المستوى
  const sorted = [...players].sort((a, b) => {
    const diff = b.rating - a.rating;
    if (diff !== 0) return diff;
    return Math.random() - 0.5; // نفس القوة → عشوائي
  });

  const teamA = [], teamB = [];
  sorted.forEach((p, i) => {
    // snake: A B B A A B B A ...
    const slot = i % 4;
    if (slot === 0 || slot === 3) teamA.push(p);
    else teamB.push(p);
  });

  return { teamA, teamB };
}

// ===== SHOW TEAMS =====
function showTeams(teamA, teamB) {
  const sumA = teamA.reduce((s, p) => s + p.rating, 0);
  const sumB = teamB.reduce((s, p) => s + p.rating, 0);
  const total = sumA + sumB || 1;

  teamAList.innerHTML = teamA.map((p, i) =>
    `<li style="animation-delay:${i*0.07}s">
      <span class="li-name">${p.name}</span>
      <span class="li-stars">${starsHtml(p.rating)}</span>
    </li>`
  ).join("");

  teamBList.innerHTML = teamB.map((p, i) =>
    `<li style="animation-delay:${i*0.07}s">
      <span class="li-name">${p.name}</span>
      <span class="li-stars">${starsHtml(p.rating)}</span>
    </li>`
  ).join("");

  scoreA.textContent = sumA;
  scoreB.textContent = sumB;

  const pct = Math.round((Math.min(sumA, sumB) / Math.max(sumA, sumB)) * 100);
  balanceFill.style.width = pct + "%";
  balanceLabel.textContent = pct + "%";

  selectionSection.classList.add("hidden");
  teamsSection.classList.remove("hidden");
  teamsSection.scrollIntoView({ behavior: "smooth" });
}

// ===== HELPERS =====
function starsHtml(r) {
  let s = "";
  for (let i = 1; i <= 5; i++) {
    if (r >= i)
      s += `<span class="s-full">★</span>`;
    else if (r >= i - 0.5)
      s += `<span class="s-half">★</span>`;
    else
      s += `<span class="s-empty">★</span>`;
  }
  return `<span class="stars-wrap">${s}</span>`;
}
