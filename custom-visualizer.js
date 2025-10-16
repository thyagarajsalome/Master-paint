document.addEventListener("DOMContentLoaded", () => {
  const imageUpload = document.getElementById("image-upload");
  const uploadBox = document.getElementById("upload-box");
  const canvasBox = document.getElementById("canvas-box");
  const toolsPanel = document.getElementById("tools-panel");

  const baseCanvas = document.getElementById("base-canvas");
  const paintCanvas = document.getElementById("paint-canvas");
  const baseCtx = baseCanvas.getContext("2d");
  const paintCtx = paintCanvas.getContext("2d");

  const colorPicker = document.getElementById("color-picker");
  const brushSizeSlider = document.getElementById("brush-size");
  const brushSizeValue = document.getElementById("brush-size-value");
  const toleranceSlider = document.getElementById("tolerance");
  const toleranceValue = document.getElementById("tolerance-value");

  const brushSizeSliderWrapper = document.getElementById("brush-size-slider");
  const toleranceSliderWrapper = document.getElementById("tolerance-slider");

  const toolButtons = document.querySelectorAll(".tool-button");

  const downloadButton = document.getElementById("download-button");
  const resetButton = document.getElementById("reset-button");
  const newImageButton = document.getElementById("new-image-button");

  const popularColorsContainer = document.getElementById("popular-colors");
  const toaster = document.getElementById("toaster");

  let isDrawing = false;
  let activeTool = "brush";
  let brushSize = 30;
  let tolerance = 20;
  let selectedColor = "#4ECDC4";
  let originalImageData = null;

  const popularColors = [
    { name: "Coral Red", value: "#FF6B6B" },
    { name: "Ocean Blue", value: "#4ECDC4" },
    { name: "Sunset Orange", value: "#FF8C42" },
    { name: "Forest Green", value: "#95E1D3" },
    { name: "Lavender", value: "#C7CEEA" },
    { name: "Sunshine Yellow", value: "#FFE66D" },
    { name: "Rose Pink", value: "#FF6B9D" },
    { name: "Sky Blue", value: "#A8E6CF" },
  ];

  popularColors.forEach((color) => {
    const button = document.createElement("button");
    button.className = "popular-color";
    button.style.backgroundColor = color.value;
    button.title = color.name;
    button.addEventListener("click", () => {
      selectedColor = color.value;
      colorPicker.value = color.value;
    });
    popularColorsContainer.appendChild(button);
  });

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toaster.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;

          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }

          baseCanvas.width = width;
          baseCanvas.height = height;
          paintCanvas.width = width;
          paintCanvas.height = height;

          baseCtx.drawImage(img, 0, 0, width, height);
          originalImageData = baseCtx.getImageData(0, 0, width, height);

          uploadBox.style.display = "none";
          canvasBox.style.display = "flex";
          toolsPanel.style.display = "block";

          showToast("Image uploaded! Start painting!");
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toolButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      activeTool = button.dataset.tool;

      brushSizeSliderWrapper.style.display =
        activeTool === "brush" ? "block" : "none";
      toleranceSliderWrapper.style.display =
        activeTool === "select" || activeTool === "deselect" ? "block" : "none";
    });
  });

  colorPicker.addEventListener(
    "input",
    (e) => (selectedColor = e.target.value)
  );
  brushSizeSlider.addEventListener("input", (e) => {
    brushSize = e.target.value;
    brushSizeValue.textContent = brushSize;
  });
  toleranceSlider.addEventListener("input", (e) => {
    tolerance = e.target.value;
    toleranceValue.textContent = tolerance;
  });

  const getCanvasCoordinates = (e) => {
    const rect = paintCanvas.getBoundingClientRect();
    const clientX = e.type.startsWith("touch")
      ? e.touches[0].clientX
      : e.clientX;
    const clientY = e.type.startsWith("touch")
      ? e.touches[0].clientY
      : e.clientY;
    return {
      x: (clientX - rect.left) * (paintCanvas.width / rect.width),
      y: (clientY - rect.top) * (paintCanvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    if (activeTool !== "brush") return;
    isDrawing = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawing = false;
    paintCtx.beginPath();
  };
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const draw = (e) => {
    if (!isDrawing || activeTool !== "brush") return;
    const { x, y } = getCanvasCoordinates(e);

    const radius = brushSize / 2;
    const startX = Math.max(0, Math.floor(x - radius));
    const startY = Math.max(0, Math.floor(y - radius));
    const endX = Math.min(paintCanvas.width, Math.ceil(x + radius));
    const endY = Math.min(paintCanvas.height, Math.ceil(y + radius));
    const paintColorRGB = hexToRgb(selectedColor);

    const paintedImageData = paintCtx.getImageData(
      startX,
      startY,
      endX - startX,
      endY - startY
    );
    const paintedData = paintedImageData.data;
    const originalPortion = baseCtx.getImageData(
      startX,
      startY,
      endX - startX,
      endY - startY
    ).data;

    for (let i = 0; i < paintedData.length; i += 4) {
      const localX = startX + ((i / 4) % (endX - startX));
      const localY = startY + Math.floor(i / 4 / (endX - startX));

      if (
        Math.sqrt(Math.pow(localX - x, 2) + Math.pow(localY - y, 2)) <= radius
      ) {
        const gray =
          0.299 * originalPortion[i] +
          0.587 * originalPortion[i + 1] +
          0.114 * originalPortion[i + 2];
        paintedData[i] = (paintColorRGB.r / 255) * gray;
        paintedData[i + 1] = (paintColorRGB.g / 255) * gray;
        paintedData[i + 2] = (paintColorRGB.b / 255) * gray;
        paintedData[i + 3] = 255;
      }
    }
    paintCtx.putImageData(paintedImageData, startX, startY);
  };
  const floodFill = (startX, startY, deselect = false) => {
    if (!originalImageData) return;
    const { width, height } = paintCanvas;
    const originalData = originalImageData.data;
    const currentPaintData = paintCtx.getImageData(0, 0, width, height);
    const dataToModify = currentPaintData.data;

    const startIdx = (startY * width + startX) * 4;
    const [startR, startG, startB] = [
      originalData[startIdx],
      originalData[startIdx + 1],
      originalData[startIdx + 2],
    ];

    const queue = [[startX, startY]];
    const visited = new Uint8Array(width * height);
    const paintColorRGB = hexToRgb(selectedColor);

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const idx = y * width + x;
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) continue;

      const dataIdx = idx * 4;
      const [r, g, b] = [
        originalData[dataIdx],
        originalData[dataIdx + 1],
        originalData[dataIdx + 2],
      ];
      const colorDiff = Math.sqrt(
        Math.pow(r - startR, 2) +
          Math.pow(g - startG, 2) +
          Math.pow(b - startB, 2)
      );

      if (colorDiff <= tolerance) {
        visited[idx] = 1;
        if (deselect) {
          dataToModify.set([0, 0, 0, 0], dataIdx);
        } else {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          dataToModify.set(
            [
              (paintColorRGB.r / 255) * gray,
              (paintColorRGB.g / 255) * gray,
              (paintColorRGB.b / 255) * gray,
              255,
            ],
            dataIdx
          );
        }
        queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }
    paintCtx.putImageData(currentPaintData, 0, 0);
  };

  const handleClick = (e) => {
    if (activeTool !== "select" && activeTool !== "deselect") return;
    const { x, y } = getCanvasCoordinates(e);
    floodFill(Math.round(x), Math.round(y), activeTool === "deselect");
  };

  paintCanvas.addEventListener("mousedown", startDrawing);
  paintCanvas.addEventListener("mouseup", stopDrawing);
  paintCanvas.addEventListener("mousemove", draw);
  paintCanvas.addEventListener("mouseleave", stopDrawing);
  paintCanvas.addEventListener("touchstart", startDrawing);
  paintCanvas.addEventListener("touchend", stopDrawing);
  paintCanvas.addEventListener("touchmove", draw);
  paintCanvas.addEventListener("click", handleClick);

  downloadButton.addEventListener("click", () => {
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = baseCanvas.width;
    finalCanvas.height = baseCanvas.height;
    const finalCtx = finalCanvas.getContext("2d");
    finalCtx.drawImage(baseCanvas, 0, 0);
    finalCtx.drawImage(paintCanvas, 0, 0);

    const link = document.createElement("a");
    link.download = "painted-image.png";
    link.href = finalCanvas.toDataURL();
    link.click();
    showToast("Download started!");
  });

  resetButton.addEventListener("click", () => {
    paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    showToast("Paint cleared!");
  });

  newImageButton.addEventListener("click", () => {
    uploadBox.style.display = "flex";
    canvasBox.style.display = "none";
    toolsPanel.style.display = "none";
    imageUpload.value = "";
    baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
    paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
  });
});
