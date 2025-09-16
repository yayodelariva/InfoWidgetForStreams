window.onload = init;

function init() {
  let xhr = new XMLHttpRequest();
  let streamJSON = "../StreamControl/streamcontrol.json";
  let scObj;
  let cBust = 0;
  let textWrapperSpans = $("#textWrapper span");

  function resizeFont(minFontSize = 5) {
    let textWrapperSpans = $("#textWrapper span"); // select spans fresh every time

    textWrapperSpans.each(function (i, el) {
      while (
        (el.scrollWidth > el.offsetWidth ||
          el.scrollHeight > el.offsetHeight) &&
        parseFloat($(el).css("font-size")) > minFontSize
      ) {
        let newFontSize = parseFloat($(el).css("font-size")) * 0.95 + "px";
        $(el).css("font-size", newFontSize);
      }
    });
  }

  $(document).ready(() => {
    resizeFont();
  });

  xhr.overrideMimeType("application/json");

  function pollJSON() {
    xhr.open("GET", streamJSON + "?v=" + cBust, true);
    xhr.send();
    cBust++;
  }

  function parseJSON() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      try {
        scObj = JSON.parse(xhr.responseText);

        // Call this to update names immediately when JSON changes
        checkNameUpdates();

        // Only start the video cycle once
        if (!init.hasStarted) {
          init.hasStarted = true;
          playBarVideo();
        }
      } catch (e) {
        console.error("Invalid JSON:", e);
      }
    }
  }

  let currentSpan, comingSpan; // Declare outside so both functions can use

  function checkNameUpdates() {
    if (!currentSpan || !comingSpan) return;

    let newCurrently = scObj["currentGame"];
    let newComingUp = scObj["comingUpGame"];

    if (newCurrently !== currentSpan.textContent) {
      currentSpan.textContent = newCurrently;
    }

    if (newComingUp !== comingSpan.textContent) {
      comingSpan.textContent = newComingUp;
    }

    resizeFont(); // <--- call here to adjust font size after text changes
  }

  xhr.onreadystatechange = parseJSON;

  pollJSON(); // First poll

  setInterval(pollJSON, 500); // Keep polling

  function playBarVideo() {
    const barVideo = document.querySelector(".barVideo");
    const currentlyText = document.querySelector("#currentlyText");
    const comingUpText = document.querySelector("#comingUpText");

    // Clear previous text
    currentlyText.textContent = "Currently: ";
    comingUpText.textContent = "Coming Up: ";

    resizeFont();

    let currently = scObj["currentGame"];
    let comingUp = scObj["comingUpGame"];

    // Set game names as spans
    currentSpan = document.createElement("span");
    currentSpan.textContent = currently;
    currentSpan.classList.add("game-title"); // not using this class yet

    comingSpan = document.createElement("span");
    comingSpan.textContent = comingUp;
    comingSpan.classList.add("game-title");

    currentlyText.appendChild(currentSpan);
    comingUpText.appendChild(comingSpan);

    // Start video
    barVideo.currentTime = 0;
    barVideo.play();

    // Show 'Currently' text
    currentlyText.style.display = "inline";
    comingUpText.style.display = "none";

    setTimeout(() => {
      currentlyText.classList.add("fade-in");
      setTimeout(() => {
        currentlyText.classList.remove("fade-in");
        currentlyText.classList.add("fade-out");
      }, 25000);
    }, 900);

    barVideo.onended = () => {
      setTimeout(() => {
        // Refresh game titles
        let currently = scObj["currentGame"];
        let comingUp = scObj["comingUpGame"];

        // Reset video
        barVideo.currentTime = 0;
        barVideo.play();

        // Hide/show appropriate text
        currentlyText.style.display = "none";
        comingUpText.style.display = "inline";

        // Update 'Coming Up' text
        comingUpText.textContent = "Coming Up: ";
        comingSpan = document.createElement("span");
        comingSpan.textContent = comingUp;
        comingSpan.classList.add("game-title");
        comingUpText.appendChild(comingSpan);

        resizeFont();

        setTimeout(() => {
          comingUpText.classList.add("fade-in");
          setTimeout(() => {
            comingUpText.classList.remove("fade-in");
            comingUpText.classList.add("fade-out");
          }, 25000);
        }, 900);

        barVideo.onended = () => {
          currentlyText.classList.remove("fade-in");
          currentlyText.classList.remove("fade-out");
          comingUpText.classList.remove("fade-in");
          comingUpText.classList.remove("fade-out");
          currentlyText.style.display = "none";
          comingUpText.style.display = "none";
          setTimeout(playBarVideo, 600000); // Loop every 10 min
        };
      }, 1000);
    };
  }
}
