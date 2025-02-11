const urlParams = new URLSearchParams(window.location.search);
const isEditMode = urlParams.get("edit") === "true";
const articleId = urlParams.get("id");

if (isEditMode && articleId) {
  document.getElementById("edit-mode").value = "true";

  // Fetch the article data and prefill the form
  async function prefillStoryData() {
      const response = await fetch(`http://localhost:8080/dailyBugle/article/singleStory?story=${articleId}`);
      if (response.ok) {
          const article = await response.json();
          document.getElementById("title").value = article.title;
          document.getElementById("teaser").value = article.teaser;
          document.getElementById("body").value = article.body;
          document.getElementById("categories").value = article.categories.join(", ");
          document.getElementById('image').value = article.image
      } else {
          alert("Failed to fetch story data.");
      }
  }
  prefillStoryData();
}


document.getElementById('story-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const teaser = document.getElementById('teaser').value.trim();
  const body = document.getElementById('body').value.trim();
  const categories = document.getElementById('categories').value.trim().split(',');
  const image = document.getElementById('image').value.trim()

  // Form data to send
  const formData = {}
  formData.title = title
  formData.teaser = teaser
  formData.body = body
  formData.categories = categories
  formData.image = image

  const endPoint = isEditMode ? `http://localhost:8080/dailyBugle/article/stories/${articleId}` : 'http://localhost:8080/dailyBugle/article/stories'

  try {
      const response = await fetch(endPoint, {
          method: isEditMode ? 'PUT' : 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData),
      });

      if (response.ok) {
          const storyId = await response.json(); // Get the newly created story ID
          window.location.href = `reader.html?id=${storyId}`; // Redirect to reader page
      } else {
          alert('Failed to create the story. Please try again.');
      }
  } catch (error) {
      console.error('Error creating story:', error);
      alert('An error occurred. Please try again.');
  }
});

document.getElementById("logout-button").addEventListener("click", async () => {
    try {
        const response = await fetch("http://localhost:8080/dailyBugle/auth/logout", {
            method: "POST",
            credentials: "include", // Ensure cookies are sent with the request
        });

        if (response.ok) {
            alert("Logged out successfully");
            window.location.href = "index.html"; // Redirect to the login page
        } else {
            alert("Failed to log out");
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred while logging out. Please try again.");
    }
});
