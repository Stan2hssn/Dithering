import App from "@/index.js";

let app = null;

function onMounted() {
  const canvas = document.getElementById("web_gl");
  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }

  app = new App({ canvas }); // Ensure you're passing an object with a canvas property
}

document.addEventListener("DOMContentLoaded", onMounted, true);
