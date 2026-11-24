const API_URL = "https://api.tvmaze.com/search/shows?q=";

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const statusMessage = document.querySelector("#status");
const resultsContainer = document.querySelector("#results");
const favoritesContainer = document.querySelector("#favorites");

let currentShows = [];
let favorites = loadFavorites();

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem("tvShowFavorites")) || [];
  } catch (error) {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem("tvShowFavorites", JSON.stringify(favorites));
}

function cleanText(html) {
  const element = document.createElement("div");
  element.innerHTML = html || "";
  return element.textContent || element.innerText || "";
}

function createShowCard(show, isFavorite = false) {
  const card = document.createElement("article");
  card.className = "show-card";

  if (show.image && show.image.medium) {
    const image = document.createElement("img");
    image.src = show.image.medium;
    image.alt = show.name + " poster";
    image.loading = "lazy";
    card.appendChild(image);
  }

  const title = document.createElement("h3");
  title.textContent = show.name || "Untitled";
  card.appendChild(title);

  const details = document.createElement("p");
  const year = show.premiered ? show.premiered.slice(0, 4) : "Year unknown";
  const genres = show.genres && show.genres.length ? show.genres.join(", ") : "Genre unknown";
  details.textContent = year + " · " + genres;
  card.appendChild(details);

  const summary = document.createElement("p");
  const text = cleanText(show.summary);
  summary.textContent = text ? text.slice(0, 180) + (text.length > 180 ? "..." : "") : "No summary available.";
  card.appendChild(summary);

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.showId = String(show.id);
  button.textContent = isFavorite ? "Remove Favourite" : "Add Favourite";
  card.appendChild(button);

  return card;
}

function renderShows(shows) {
  resultsContainer.replaceChildren();
  shows.map(show => createShowCard(show)).forEach(card => resultsContainer.appendChild(card));
}

function renderFavorites() {
  favoritesContainer.replaceChildren();
  favorites.map(show => createShowCard(show, true)).forEach(card => favoritesContainer.appendChild(card));

  if (favorites.length === 0) {
    favoritesContainer.textContent = "No favourites saved yet.";
  }
}

async function searchShows(query) {
  statusMessage.textContent = "Loading shows...";
  resultsContainer.replaceChildren();

  try {
    const response = await fetch(API_URL + encodeURIComponent(query));
    if (!response.ok) throw new Error("The show service returned an error.");

    const data = await response.json();
    currentShows = data.map(item => item.show).filter(show => show && show.id);
    renderShows(currentShows);

    statusMessage.textContent = currentShows.length
      ? currentShows.length + " show(s) found."
      : "No shows found. Try another search.";
  } catch (error) {
    statusMessage.textContent = "Could not load shows. Please check your connection and try again.";
    resultsContainer.replaceChildren();
  }
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query) searchShows(query);
});

document.addEventListener("click", event => {
  const button = event.target.closest("button[data-show-id]");
  if (!button) return;

  const showId = Number(button.dataset.showId);
  const existingFavorite = favorites.find(show => show.id === showId);

  if (existingFavorite) {
    favorites = favorites.filter(show => show.id !== showId);
  } else {
    const showToSave = currentShows.find(show => show.id === showId);
    if (showToSave) favorites.push(showToSave);
  }

  saveFavorites();
  renderFavorites();
  renderShows(currentShows);
});

renderFavorites();