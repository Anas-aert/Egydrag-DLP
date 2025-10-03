function validateYoutubeUrl() {
  const url = document.getElementById("vidurl").value.trim();
  const errorElement = document.getElementById("urlError");

  // Handle empty input
  if (!url) {
    errorElement.textContent = "Please enter a YouTube URL";
    errorElement.style.display = "block";
    return false;
  }

  // Regular expressions for different YouTube URL formats
  const patterns = {
    standard:
      /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=([a-zA-Z0-9_-]{11}))(?:\S+)?$/,
    shortened:
      /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\S*)?$/,
    embed:
      /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\S*)?$/,
  };

  // Check URL against all patterns
  const isValid = Object.values(patterns).some((pattern) => pattern.test(url));

  if (isValid) {
    errorElement.style.display = "none";
    return true;
  } else {
    errorElement.textContent = "Please enter a valid YouTube URL";
    errorElement.style.display = "block";
    return false;
  }
}

// Add debounced input validation
let timeoutId;
document.getElementById("vidurl").addEventListener("input", function () {
  clearTimeout(timeoutId);
  const errorElement = document.getElementById("urlError");
  const videoContainer = document.getElementById("videoContainer");
  const iframe = videoContainer.querySelector("iframe");

  // Hide error immediately when typing starts
  errorElement.style.display = "none";

  // Get the URL and convert it to embed format
  const url = this.value.trim();
  let videoId = "";

  // Extract video ID from different URL formats
  const patterns = {
    standard: /(?:v=|\/v\/|\/embed\/)([a-zA-Z0-9_-]{11})/,
    shortened: /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  };

  for (const pattern of Object.values(patterns)) {
    const match = url.match(pattern);
    if (match && match[1]) {
      videoId = match[1];
      break;
    }
  }

  if (videoId) {
    // Show and update iframe
    videoContainer.style.display = "block";
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
  } else {
    // Hide iframe if URL is invalid
    videoContainer.style.display = "none";
    iframe.src = "";
  }

  // Validate after user stops typing for 500ms
  timeoutId = setTimeout(() => {
    validateYoutubeUrl();
  }, 500);
});

// Prevent form submission if URL is invalid
document
  .getElementById("youtubeForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!validateYoutubeUrl()) {
      return;
    }

    const url = document.getElementById("vidurl").value;
    const progress = document.getElementById("downloadProgress");
    const submit = event.target.querySelector('input[type="submit"]');

    try {
      progress.style.display = "block";
      submit.disabled = true;

      const response = await fetch(
        `/download?vidurl=${encodeURIComponent(url)}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Download failed");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download =
        response.headers.get("content-disposition")?.split("filename=")[1] ||
        "video.mp4";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
    } catch (error) {
      alert(error.message);
    } finally {
      progress.style.display = "none";
      submit.disabled = false;
    }
  });
