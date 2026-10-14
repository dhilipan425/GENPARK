
const percent = document.getElementById("percent");

let progress = 0;

const timer = setInterval(() => {
  progress = Math.min(progress + 1, 100);
  percent.textContent = progress + "%";

  if (progress >= 100) {
    clearInterval(timer);

    // Open the parking dashboard after loading.
    window.location.replace("index.html");
  }
}, 50);
