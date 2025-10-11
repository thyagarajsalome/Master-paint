document.addEventListener("DOMContentLoaded", () => {
  // Configuration for each room/visualizer category
  const visualizerConfigs = {
    livingroom: {
      baseImage: "./images-livingroom/base.jpg",
      overlayPath: "./images-livingroom/",
    },
    kitchen: {
      baseImage: "./images-kitchen/base.jpg",
      overlayPath: "./images-kitchen/",
    },
    Bedroom: {
      baseImage: "./images-bedroom/base.jpg",
      overlayPath: "./images-bedroom/",
    },
    Exterior: {
      baseImage: "./images-exterior/base.jpg",
      overlayPath: "./images-exterior/",
    },
  };

  // DOM elements
  const baseImage = document.getElementById("baseImage");
  const visualizationArea = document.querySelector(".visualization-area");
  const colorOptionsContainer = document.querySelector(".color-options");
  const resetButton = document.getElementById("resetButton");
  const mobileMenuIcon = document.getElementById("mobileMenuIcon");
  const colorCategoriesContainer = document.getElementById(
    "colorCategoriesContainer"
  );
  const roomButtons = document.querySelectorAll(".room-button");

  // Global variables
  let currentColor = null;
  let currentConfig = null;
  let currentRoom = null;
  let overlays = {}; // to hold overlay image elements

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
      h = s = 0;
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

  /* Helper: Convert "rgb(r, g, b)" to Hex string */
  function rgbStringToHex(rgbStr) {
    const regex = /rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/;
    const result = regex.exec(rgbStr);
    if (!result) return "#000000";
    const r = parseInt(result[1]).toString(16).padStart(2, "0");
    const g = parseInt(result[2]).toString(16).padStart(2, "0");
    const b = parseInt(result[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  /**
   * Determine a category for a given RGB string.
   * This function now has more refined thresholds for better color sorting.
   */
  function getColorCategory(rgbStr) {
    const regex = /rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/;
    const result = regex.exec(rgbStr);
    if (!result) return "Neutral";

    const r = parseInt(result[1]);
    const g = parseInt(result[2]);
    const b = parseInt(result[3]);
    const { h, s, l } = rgbToHsl(r, g, b);

    if (s < 0.1 || l < 0.1 || l > 0.9) {
      return "Neutral";
    }

    if (h >= 345 || h < 15) return "Red";
    if (h >= 15 && h < 45) return "Orange";
    if (h >= 45 && h < 70) return "Yellow";
    if (h >= 70 && h < 160) return "Green";
    if (h >= 160 && h < 260) return "Blue";
    if (h >= 260 && h < 345) return "Purple";

    return "Neutral";
  }

  /* Group color keys into categories */
  function buildColorCategories() {
    const categories = {
      Red: [],
      Orange: [],
      Yellow: [],
      Green: [],
      Blue: [],
      Purple: [],
      Brown: [],
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

  /* Render category buttons */
  function renderCategoryButtons(colorCategories) {
    colorCategoriesContainer.innerHTML =
      '<span class="mobile-close-icon" id="mobileCloseIcon">&times; Close</span>';
    // Define the desired order of categories
    const categoryOrder = [
      "Red",
      "Orange",
      "Yellow",
      "Green",
      "Blue",
      "Purple",
      "Brown",
      "Neutral",
    ];

    categoryOrder.forEach((category) => {
      if (colorCategories[category] && colorCategories[category].length > 0) {
        const btn = document.createElement("button");
        btn.className = "category-button";
        btn.dataset.category = category;
        btn.textContent = category;
        colorCategoriesContainer.appendChild(btn);
      }
    });

    const mobileCloseIconNew = document.getElementById("mobileCloseIcon");
    mobileCloseIconNew.addEventListener("click", () => {
      colorCategoriesContainer.classList.remove("active");
    });
  }

  /* Render color buttons for the selected category */
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
      button.setAttribute("aria-label", `Color ${key}`);
      colorItem.appendChild(button);
      colorOptionsContainer.appendChild(colorItem);
      button.addEventListener("click", () => {
        if (currentColor !== key) {
          selectColor(key);
        }
      });
    });
  }

  /* Setup event listeners on category buttons */
  function setupCategoryButtonListeners(colorCategories) {
    const buttons = document.querySelectorAll(".category-button");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const category = btn.dataset.category;
        renderColorButtons(category, colorCategories);
        selectColor(null);
        if (colorCategoriesContainer.classList.contains("active")) {
          colorCategoriesContainer.classList.remove("active");
        }
      });
    });
  }

  /* Update color details in the preview panel */
  function updateColorDetails(colorId) {
    const colorRGBEl = document.getElementById("colorRGB");
    const colorHexEl = document.getElementById("colorHex");
    const colorCategoryEl = document.getElementById("colorCategory");
    const colorRoomEl = document.getElementById("colorRoom");

    if (colorId) {
      const rgbValue = colors[colorId];
      const hexValue = rgbStringToHex(rgbValue);
      const category = getColorCategory(rgbValue);
      const room = currentRoom.charAt(0).toUpperCase() + currentRoom.slice(1);

      colorRGBEl.textContent = `RGB: ${rgbValue}`;
      colorHexEl.textContent = `Hex: ${hexValue}`;
      colorCategoryEl.textContent = `Category: ${category}`;
      colorRoomEl.textContent = `Room: ${room}`;
    } else {
      colorRGBEl.textContent = "Select a Color";
      colorHexEl.textContent = "";
      colorCategoryEl.textContent = "";
      colorRoomEl.textContent = "";
    }
  }

  /* When a color button is clicked, show its overlay and update details */
  function selectColor(colorId) {
    if (colorId === currentColor) {
      return;
    }
    Object.values(overlays).forEach((overlay) => (overlay.style.opacity = "0"));
    document
      .querySelectorAll(".color-button")
      .forEach((button) => button.classList.remove("active"));

    if (colorId) {
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
      updateColorDetails(colorId);
    } else {
      currentColor = null;
      updateColorDetails(null);
    }
  }

  resetButton.addEventListener("click", () => {
    selectColor(null);
  });

  mobileMenuIcon.addEventListener("click", () => {
    colorCategoriesContainer.classList.add("active");
  });

  function initializeVisualizer(config) {
    Object.values(overlays).forEach((overlay) => overlay.remove());
    overlays = {};
    currentColor = null;
    baseImage.src = config.baseImage;
    const defaultCategory = "Red";
    const catButtons = document.querySelectorAll(".category-button");
    let defaultButton = null;
    catButtons.forEach((btn) => {
      if (btn.dataset.category === defaultCategory) {
        defaultButton = btn;
      }
      btn.classList.remove("active");
    });
    if (defaultButton) {
      defaultButton.classList.add("active");
    } else if (catButtons.length > 0) {
      catButtons[0].classList.add("active");
      renderColorButtons(catButtons[0].dataset.category, colorCategories);
    }

    renderColorButtons(defaultCategory, colorCategories);
    updateColorDetails(null);
  }

  // Setup room navbar event listeners
  roomButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      roomButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentRoom = btn.dataset.room;
      currentConfig = visualizerConfigs[currentRoom];
      initializeVisualizer(currentConfig);
    });
  });

  // Set default room as Livingroom
  const defaultRoomButton = document.querySelector(
    '.room-button[data-room="livingroom"]'
  );
  if (defaultRoomButton) {
    defaultRoomButton.click();
  }

  // Initial setup
  renderCategoryButtons(colorCategories);
  setupCategoryButtonListeners(colorCategories);
  initializeVisualizer(visualizerConfigs.livingroom); // Initialize with the default config
});
