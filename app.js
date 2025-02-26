document.addEventListener("DOMContentLoaded", () => {
  // Configuration for each room/visualizer category
  const visualizerConfigs = {
    kitchen: {
      baseImage: "./images-kitchen/base.jpg",
      overlayPath: "./images-kitchen/",
    },
    livingroom: {
      baseImage: "./images-livingroom/base.jpg",
      overlayPath: "./images-livingroom/",
    },
    bedroom: {
      baseImage: "./images-bedroom/base.jpg",
      overlayPath: "./images-bedroom/",
    },
    bathroom: {
      baseImage: "./images-bathroom/base.jpg",
      overlayPath: "./images-bathroom/",
    },
    furniture: {
      baseImage: "./images-furniture/base.jpg",
      overlayPath: "./images-furniture/",
    },
    exterior: {
      baseImage: "./images-exterior/base.jpg",
      overlayPath: "./images-exterior/",
    },
    patio: {
      baseImage: "./images-patio/base.jpg",
      overlayPath: "./images-patio/",
    },
  };

  // DOM elements
  const roomSelect = document.getElementById("roomSelect");
  const baseImage = document.getElementById("baseImage");
  const visualizationArea = document.querySelector(".visualization-area");
  const colorOptionsContainer = document.querySelector(".color-options");
  const resetButton = document.getElementById("resetButton");

  // Global variables
  let currentColor = null;
  let currentConfig = null;
  let overlays = {}; // to hold overlay image elements

  // Build a room select dropdown from visualizerConfigs
  function populateRoomSelect() {
    roomSelect.innerHTML = "";
    Object.keys(visualizerConfigs).forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent =
        key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
      roomSelect.appendChild(option);
    });
  }

  /* Helper: Convert "rgb(r, g, b)" string to an HSL object */
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }
    return { h, s, l };
  }

  /* Determine a category for a given RGB string.
     Categories: "Red", "Brown", "Orange", "Yellow", "Green", "Blue", "Purple", "Neutral" */
  function getColorCategory(rgbStr) {
    const regex = /rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/;
    const result = regex.exec(rgbStr);
    if (!result) return "Neutral";
    const r = parseInt(result[1]),
      g = parseInt(result[2]),
      b = parseInt(result[3]);
    const { h, s, l } = rgbToHsl(r, g, b);
    // If very low saturation or very dark/light, assign to Neutral
    if (s < 0.25 || l < 0.2 || l > 0.8) {
      return "Neutral";
    }
    if (h >= 345 || h < 15) {
      return "Red";
    }
    if (h >= 15 && h < 45) {
      return l < 0.5 ? "Brown" : "Orange";
    }
    if (h >= 45 && h < 75) {
      return "Yellow";
    }
    if (h >= 75 && h < 150) {
      return "Green";
    }
    if (h >= 150 && h < 225) {
      return "Blue";
    }
    if (h >= 225 && h < 345) {
      return "Purple";
    }
    return "Neutral";
  }

  /* Build an object grouping color keys into 8 categories */
  function buildColorCategories() {
    const categories = {
      Red: [],
      Brown: [],
      Orange: [],
      Yellow: [],
      Green: [],
      Blue: [],
      Purple: [],
      Neutral: [],
    };
    for (let key in colors) {
      const cat = getColorCategory(colors[key]);
      if (categories[cat]) {
        categories[cat].push(key);
      }
    }
    return categories;
  }

  const colorCategories = buildColorCategories();

  /* Render category buttons (one for each of the eight groups) */
  function renderCategoryButtons(colorCategories) {
    const container = document.querySelector(".color-categories");
    container.innerHTML = "";
    Object.keys(colorCategories).forEach((category) => {
      const btn = document.createElement("button");
      btn.className = "category-button";
      btn.dataset.category = category;
      btn.textContent = category;
      container.appendChild(btn);
    });
  }

  /* Render the color buttons for the currently selected category */
  function renderColorButtons(category, colorCategories) {
    colorOptionsContainer.innerHTML = "";
    const colorKeys = colorCategories[category];
    if (!colorKeys) return;
    colorKeys.sort((a, b) => Number(a) - Number(b));
    colorKeys.forEach((key) => {
      const colorItem = document.createElement("div");
      colorItem.className = "color-item";
      const button = document.createElement("button");
      button.className = "color-button";
      button.dataset.color = key;
      button.style.backgroundColor = colors[key];
      button.setAttribute("aria-label", "Color");
      colorItem.appendChild(button);
      colorOptionsContainer.appendChild(colorItem);

      button.addEventListener("click", () => {
        selectColor(currentColor === key ? null : key);
      });
    });
  }

  /* Set up event listeners on the category buttons */
  function setupCategoryButtonListeners(colorCategories) {
    const buttons = document.querySelectorAll(".category-button");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Set active state
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const category = btn.dataset.category;
        renderColorButtons(category, colorCategories);
        // Reset any overlay
        selectColor(null);
      });
    });
  }

  /* Initialize the visualizer:
     – Remove any old overlays and reset the color selection.
     – Set the base image for the chosen room.
     – Render the color buttons for a default category (here "Red"). */
  function initializeVisualizer(config) {
    // Remove existing overlays
    Object.values(overlays).forEach((overlay) => overlay.remove());
    overlays = {};
    currentColor = null;
    baseImage.src = config.baseImage;

    // Set default category button active (e.g., "Red")
    const defaultCategory = "Red";
    const catButtons = document.querySelectorAll(".category-button");
    catButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.category === defaultCategory);
    });
    renderColorButtons(defaultCategory, colorCategories);
  }

  /* When a color button is clicked, load (or show) its overlay image on demand */
  function selectColor(colorId) {
    // Hide all overlays and remove active class from all color buttons
    Object.values(overlays).forEach((overlay) => (overlay.style.opacity = "0"));
    document
      .querySelectorAll(".color-button")
      .forEach((button) => button.classList.remove("active"));

    if (colorId && colorId !== currentColor) {
      let overlay;
      if (overlays[colorId]) {
        overlay = overlays[colorId];
      } else {
        overlay = document.createElement("img");
        overlay.src = `${currentConfig.overlayPath}${colorId}.jpg`;
        overlay.alt = "Overlay";
        overlay.className = "color-overlay";
        overlay.style.opacity = "0";
        visualizationArea.appendChild(overlay);
        overlays[colorId] = overlay;
      }
      overlay.style.opacity = "1";
      const button = document.querySelector(`[data-color="${colorId}"]`);
      if (button) button.classList.add("active");
      currentColor = colorId;
    } else {
      currentColor = null;
    }
  }

  // Reset button clears the current selection.
  resetButton.addEventListener("click", () => {
    selectColor(null);
  });

  // When the room is changed, reinitialize the visualizer.
  roomSelect.addEventListener("change", () => {
    currentConfig = visualizerConfigs[roomSelect.value];
    initializeVisualizer(currentConfig);
  });

  // Initial setup
  populateRoomSelect();
  currentConfig = visualizerConfigs[roomSelect.value];
  initializeVisualizer(currentConfig);
  renderCategoryButtons(colorCategories);
  setupCategoryButtonListeners(colorCategories);
});
