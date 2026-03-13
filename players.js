// players.js — إدارة اللاعبين (إضافة / تعديل / حذف)

import { db } from "./firebase-config.js";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ===== STATE =====
let allPlayers = [];
let deleteTargetId = null;

// ===== DOM =====
const playersList  = document.getElementById("players-list");
const totalBadge   = document.getElementById("total-badge");
const searchInput  = document.getElementById("search-players");

const newNameInput = document.getElementById("new-name");
const newRating    = document.getElementById("new-rating");
const newStars     = document.getElementById("new-stars");
const addBtn       = document.getElementById("add-btn");

const modal        = document.getElementById("modal");
const editName     = document.getElementById("edit-name");
const editRating   = document.getElementById("edit-rating");
const editId       = document.getElementById("edit-id");
const editStars    = document.getElementById("edit-stars");
const cancelEdit   = document.getElementById("cancel-edit");
const saveEdit     = document.getElementById("save-edit");

const confirmModal  = document.getElementById("confirm-modal");
const confirmMsg    = document.getElementById("confirm-msg");
const cancelDelete  = document.getElementById("cancel-delete");
const confirmDelete = document.getElementById("confirm-delete");

// ===== STAR PICKERS INIT =====
initStarPicker(newStars, newRating, 3);
initStarPicker(editStars, editRating, 3);

function initStarPicker(container, hidden, defaultVal) {
  hidden.value = defaultVal;
  renderStars(container, defaultVal);
  container.querySelectorAll(".star").forEach(star => {
    star.addEventListener("click", () => {
      const val = parseInt(star.dataset.val);
      hidden.value = val;
      renderStars(container, val);
    });
    star.addEventListener("mouseover", () => {
      const val = parseInt(star.dataset.val);
      renderStars(container, val);
    });
    star.addEventListener("mouseout", () => {
      renderStars(container, parseInt(hidden.value));
    });
  });
}

function renderStars(container, val) {
  container.querySelectorAll(".star").forEach(s => {
    s.classList.toggle("active", parseInt(s.dataset.val) <= val);
  });
}

// ===== LOAD PLAYERS (realtime) =====
const q = query(collection(db, "players"), orderBy("name"));
onSnapshot(q, (snapshot) => {
  allPlayers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  totalBadge.textContent = allPlayers.length + " لاعب";
  renderList(allPlayers);
});

// ===== RENDER LIST =====
function renderList(players) {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = keyword
    ? players.filter(p => p.name.toLowerCase().includes(keyword))
    : players;

  if (filtered.length === 0) {
    playersList.innerHTML = `<div class="empty">${keyword ? "😕 مفيش لاعب بالاسم ده" : "😕 مفيش لاعبين بعد، ابدأ بإضافة لاعبين"}</div>`;
    return;
  }

  playersList.innerHTML = "";
  filtered.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "player-row";
    row.style.animationDelay = i * 0.05 + "s";
    row.innerHTML = `
      <span class="pr-name">${p.name}</span>
      <span class="pr-stars">${"★".repeat(p.rating)}${"☆".repeat(5-p.rating)} (${p.rating})</span>
      <div class="pr-actions">
        <button class="btn-icon" data-id="${p.id}" data-action="edit">✏️ تعديل</button>
        <button class="btn-icon del" data-id="${p.id}" data-action="delete" data-name="${p.name}">🗑️</button>
      </div>
    `;
    playersList.appendChild(row);
  });

  // Event delegation
  playersList.addEventListener("click", handleListClick, { once: true });
}

function handleListClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id     = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "edit") {
    const player = allPlayers.find(p => p.id === id);
    if (!player) return;
    editId.value      = id;
    editName.value    = player.name;
    editRating.value  = player.rating;
    renderStars(editStars, player.rating);
    modal.classList.remove("hidden");
  }

  if (action === "delete") {
    deleteTargetId = id;
    confirmMsg.textContent = `متأكد إنك عايز تحذف "${btn.dataset.name}"؟`;
    confirmModal.classList.remove("hidden");
  }
}

// ===== SEARCH =====
searchInput.addEventListener("input", () => renderList(allPlayers));

// ===== ADD PLAYER =====
addBtn.addEventListener("click", async () => {
  const name   = newNameInput.value.trim();
  const rating = parseInt(newRating.value);

  if (!name) { showToast("⚠️ اكتب اسم اللاعب أولاً"); return; }
  if (!rating || rating < 1 || rating > 5) { showToast("⚠️ اختار قوة اللاعب"); return; }

  addBtn.disabled = true;
  try {
    await addDoc(collection(db, "players"), { name, rating });
    newNameInput.value = "";
    newRating.value = 3;
    renderStars(newStars, 3);
    showToast("✅ تم إضافة " + name);
  } catch (err) {
    showToast("❌ حصل خطأ: " + err.message);
  } finally {
    addBtn.disabled = false;
  }
});

// Enter key to add
newNameInput.addEventListener("keydown", e => { if (e.key === "Enter") addBtn.click(); });

// ===== EDIT MODAL =====
cancelEdit.addEventListener("click", () => modal.classList.add("hidden"));

saveEdit.addEventListener("click", async () => {
  const id     = editId.value;
  const name   = editName.value.trim();
  const rating = parseInt(editRating.value);

  if (!name) { showToast("⚠️ اكتب اسم اللاعب"); return; }

  saveEdit.disabled = true;
  try {
    await updateDoc(doc(db, "players", id), { name, rating });
    modal.classList.add("hidden");
    showToast("✅ تم التعديل");
  } catch (err) {
    showToast("❌ حصل خطأ: " + err.message);
  } finally {
    saveEdit.disabled = false;
  }
});

// ===== DELETE MODAL =====
cancelDelete.addEventListener("click", () => {
  confirmModal.classList.add("hidden");
  deleteTargetId = null;
});

confirmDelete.addEventListener("click", async () => {
  if (!deleteTargetId) return;
  confirmDelete.disabled = true;
  try {
    await deleteDoc(doc(db, "players", deleteTargetId));
    confirmModal.classList.add("hidden");
    deleteTargetId = null;
    showToast("🗑️ تم الحذف");
  } catch (err) {
    showToast("❌ حصل خطأ: " + err.message);
  } finally {
    confirmDelete.disabled = false;
  }
});

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
