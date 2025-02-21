document.addEventListener("DOMContentLoaded", () => {
  // Configuration for each category. Add or remove categories as needed.
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

  let currentColor = null;
  let currentConfig = null;

  // Dynamically populate the select dropdown based on visualizerConfigs keys
  function populateRoomSelect() {
    roomSelect.innerHTML = "";
    Object.keys(visualizerConfigs).forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      // Capitalize the first letter for display
      option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      roomSelect.appendChild(option);
    });
  }

  // Initialize the visualizer with the given configuration
  function initializeVisualizer(config) {
    // Clear previous overlays and color buttons
    document
      .querySelectorAll(".color-overlay")
      .forEach((overlay) => overlay.remove());
    colorOptionsContainer.innerHTML = "";
    currentColor = null;

    // Set the base image source
    baseImage.src = config.baseImage;

    // Create overlay images and corresponding color buttons dynamically using the global "colors" object
    Object.keys(colors)
      .sort()
      .forEach((key) => {
        // Create overlay image element
        const overlayImg = document.createElement("img");
        overlayImg.src = `${config.overlayPath}${key}.jpg`;
        overlayImg.alt = "Overlay";
        overlayImg.className = "color-overlay";
        overlayImg.id = `${key}-overlay`;
        visualizationArea.appendChild(overlayImg);

        // Create color button element
        const colorItem = document.createElement("div");
        colorItem.className = "color-item";
        const button = document.createElement("button");
        button.className = "color-button";
        button.dataset.color = key;
        button.style.backgroundColor = colors[key];
        button.setAttribute("aria-label", "Color");
        colorItem.appendChild(button);
        colorOptionsContainer.appendChild(colorItem);

        // Attach click event to toggle color selection
        button.addEventListener("click", () => {
          selectColor(currentColor === key ? null : key);
        });
      });
  }

  // Toggle the selection of a color
  function selectColor(colorId) {
    // Reset all overlays and remove active states
    document
      .querySelectorAll(".color-overlay")
      .forEach((overlay) => (overlay.style.opacity = "0"));
    document
      .querySelectorAll(".color-button")
      .forEach((button) => button.classList.remove("active"));

    // If a new color is chosen, activate its overlay and highlight its button
    if (colorId && colorId !== currentColor) {
      const overlay = document.getElementById(`${colorId}-overlay`);
      if (overlay) overlay.style.opacity = "1";
      const button = document.querySelector(`[data-color="${colorId}"]`);
      if (button) button.classList.add("active");
      currentColor = colorId;
    } else {
      currentColor = null;
    }
  }

  // Reset the color selection
  resetButton.addEventListener("click", () => {
    selectColor(null);
  });

  // Update the visualizer when a different category is selected
  roomSelect.addEventListener("change", () => {
    currentConfig = visualizerConfigs[roomSelect.value];
    initializeVisualizer(currentConfig);
  });

  // Initial population and setup
  populateRoomSelect();
  currentConfig = visualizerConfigs[roomSelect.value];
  initializeVisualizer(currentConfig);
});
