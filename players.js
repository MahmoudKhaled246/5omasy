// players.js — إدارة اللاعبين مع half-star picker

import { db } from "./firebase-config.js";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ===== STATE =====
let allPlayers = [];
let deleteTargetId = null;

// ===== DOM =====
const playersList   = document.getElementById("players-list");
const totalBadge    = document.getElementById("total-badge");
const searchInput   = document.getElementById("search-players");
const newNameInput  = document.getElementById("new-name");
const newRating     = document.getElementById("new-rating");
const newStars      = document.getElementById("new-stars");
const addBtn        = document.getElementById("add-btn");
const modal         = document.getElementById("modal");
const editName      = document.getElementById("edit-name");
const editRating    = document.getElementById("edit-rating");
const editId        = document.getElementById("edit-id");
const editStars     = document.getElementById("edit-stars");
const cancelEdit    = document.getElementById("cancel-edit");
const saveEdit      = document.getElementById("save-edit");
const confirmModal  = document.getElementById("confirm-modal");
const confirmMsg    = document.getElementById("confirm-msg");
const cancelDelete  = document.getElementById("cancel-delete");
const confirmDelete = document.getElementById("confirm-delete");

// ===== HALF-STAR SVG =====
function starSVG(state) {
  const C = "#f0c040", E = "#2a2a2a", S = "#555";
  const pts = "12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26";
  if (state === "full")
    return `<svg viewBox="0 0 24 24"><polygon points="${pts}" fill="${C}" stroke="${C}" stroke-width="1"/></svg>`;
  if (state === "half")
    return `<svg viewBox="0 0 24 24">
      <defs><clipPath id="h"><rect x="0" y="0" width="12" height="24"/></clipPath></defs>
      <polygon points="${pts}" fill="${E}" stroke="${S}" stroke-width="1"/>
      <polygon points="${pts}" fill="${C}" stroke="${C}" stroke-width="1" clip-path="url(#h)"/>
    </svg>`;
  return `<svg viewBox="0 0 24 24"><polygon points="${pts}" fill="${E}" stroke="${S}" stroke-width="1"/></svg>`;
}

// ===== BUILD PICKER =====
function buildPicker(container, hiddenInput, initVal) {
  hiddenInput.value = initVal;
  container.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const wrap = document.createElement("div");
    wrap.className = "star-wrap";
    wrap.dataset.star = i;
    container.appendChild(wrap);
  }

  const label = document.createElement("span");
  label.className = "rating-label";
  container.appendChild(label);

  renderPicker(container, initVal);

  // event delegation — handles re-renders too
  container.addEventListener("click", (e) => {
    const zone = e.target.closest(".star-half-left, .star-half-right");
    if (!zone) return;
    const i   = parseInt(zone.closest(".star-wrap").dataset.star);
    const val = zone.classList.contains("star-half-left") ? i - 0.5 : i;
    hiddenInput.value = val;
    renderPicker(container, val);
  });

  container.addEventListener("mouseover", (e) => {
    const zone = e.target.closest(".star-half-left, .star-half-right");
    if (!zone) return;
    const i   = parseInt(zone.closest(".star-wrap").dataset.star);
    const val = zone.classList.contains("star-half-left") ? i - 0.5 : i;
    renderPicker(container, val, true);
  });

  container.addEventListener("mouseleave", () => {
    renderPicker(container, parseFloat(hiddenInput.value));
  });

  container.addEventListener("touchend", (e) => {
    const zone = e.target.closest(".star-half-left, .star-half-right");
    if (!zone) return;
    e.preventDefault();
    const i   = parseInt(zone.closest(".star-wrap").dataset.star);
    const val = zone.classList.contains("star-half-left") ? i - 0.5 : i;
    hiddenInput.value = val;
    renderPicker(container, val);
  }, { passive: false });
}

function renderPicker(container, val, hover = false) {
  const wraps = container.querySelectorAll(".star-wrap");
  wraps.forEach((wrap, idx) => {
    const n = idx + 1;
    let state = "empty";
    if (val >= n)       state = "full";
    else if (val >= n - 0.5) state = "half";

    wrap.innerHTML = starSVG(state);

    // re-add hit zones
    const L = document.createElement("div"); L.className = "star-half-left";
    const R = document.createElement("div"); R.className = "star-half-right";
    wrap.appendChild(L); wrap.appendChild(R);
  });

  const label = container.querySelector(".rating-label");
  if (label) label.textContent = val + " ★";
}

// ===== INIT =====
buildPicker(newStars, newRating, 3);
buildPicker(editStars, editRating, 3);

// ===== STARS DISPLAY (readonly) =====
function starsDisplay(r) {
  let s = "";
  for (let i = 1; i <= 5; i++) {
    if (r >= i)         s += `<span style="color:#f0c040">★</span>`;
    else if (r >= i-0.5) s += `<span style="color:#f0c040;opacity:.6">⯨</span>`;
    else                 s += `<span style="color:#333">★</span>`;
  }
  return s + ` <small style="color:var(--muted)">(${r})</small>`;
}

// ===== LOAD PLAYERS =====
const q = query(collection(db, "players"), orderBy("name"));
onSnapshot(q, (snapshot) => {
  allPlayers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  totalBadge.textContent = allPlayers.length + " لاعب";
  renderList(allPlayers);
});

// ===== RENDER LIST =====
function renderList(players) {
  const kw = searchInput.value.trim().toLowerCase();
  const list = kw ? players.filter(p => p.name.toLowerCase().includes(kw)) : players;

  if (!list.length) {
    playersList.innerHTML = `<div class="empty">${kw ? "😕 مفيش لاعب بالاسم ده" : "😕 مفيش لاعبين، ابدأ بالإضافة"}</div>`;
    return;
  }

  playersList.innerHTML = "";
  list.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "player-row";
    row.style.animationDelay = i * 0.05 + "s";
    row.innerHTML = `
      <span class="pr-name">${p.name}</span>
      <span class="pr-stars">${starsDisplay(p.rating)}</span>
      <div class="pr-actions">
        <button class="btn-icon" data-id="${p.id}" data-action="edit">✏️ تعديل</button>
        <button class="btn-icon del" data-id="${p.id}" data-action="delete" data-name="${p.name}">🗑️</button>
      </div>`;
    playersList.appendChild(row);
  });

  playersList.addEventListener("click", onListClick, { once: true });
}

function onListClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { id, action, name } = btn.dataset;

  if (action === "edit") {
    const p = allPlayers.find(x => x.id === id);
    if (!p) return;
    editId.value   = id;
    editName.value = p.name;
    editRating.value = p.rating;
    renderPicker(editStars, p.rating);
    modal.classList.remove("hidden");
  }
  if (action === "delete") {
    deleteTargetId = id;
    confirmMsg.textContent = `متأكد إنك عايز تحذف "${name}"؟`;
    confirmModal.classList.remove("hidden");
  }
}

searchInput.addEventListener("input", () => renderList(allPlayers));

// ===== ADD =====
addBtn.addEventListener("click", async () => {
  const name   = newNameInput.value.trim();
  const rating = parseFloat(newRating.value);
  if (!name)   { showToast("⚠️ اكتب اسم اللاعب"); return; }
  if (!rating) { showToast("⚠️ اختار القوة"); return; }
  addBtn.disabled = true;
  try {
    await addDoc(collection(db, "players"), { name, rating });
    newNameInput.value = "";
    newRating.value = 3;
    renderPicker(newStars, 3);
    showToast("✅ تم إضافة " + name);
  } catch (err) { showToast("❌ " + err.message); }
  finally { addBtn.disabled = false; }
});
newNameInput.addEventListener("keydown", e => { if (e.key === "Enter") addBtn.click(); });

// ===== EDIT =====
cancelEdit.addEventListener("click", () => modal.classList.add("hidden"));
saveEdit.addEventListener("click", async () => {
  const id     = editId.value;
  const name   = editName.value.trim();
  const rating = parseFloat(editRating.value);
  if (!name) { showToast("⚠️ اكتب الاسم"); return; }
  saveEdit.disabled = true;
  try {
    await updateDoc(doc(db, "players", id), { name, rating });
    modal.classList.add("hidden");
    showToast("✅ تم التعديل");
  } catch (err) { showToast("❌ " + err.message); }
  finally { saveEdit.disabled = false; }
});

// ===== DELETE =====
cancelDelete.addEventListener("click", () => { confirmModal.classList.add("hidden"); deleteTargetId = null; });
confirmDelete.addEventListener("click", async () => {
  if (!deleteTargetId) return;
  confirmDelete.disabled = true;
  try {
    await deleteDoc(doc(db, "players", deleteTargetId));
    confirmModal.classList.add("hidden");
    deleteTargetId = null;
    showToast("🗑️ تم الحذف");
  } catch (err) { showToast("❌ " + err.message); }
  finally { confirmDelete.disabled = false; }
});

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}
