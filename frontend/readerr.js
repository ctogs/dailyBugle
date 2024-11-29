const singleStoryUrl = "http://localhost:8080/dailyBugle/article/singleStory";
let mainArticleID = "none"
const urlParams = new URLSearchParams(window.location.search)
const idFromParams = urlParams.get('id')
let globalOtherStories

async function getUserRole() {
    // Example API endpoint to get user role (author, reader, anonymous)
    const response = await fetch("http://localhost:8080/dailyBugle/auth/userInfo");
    if (response.ok) {
        const data = await response.json();
        return data.role; // Example response: { role: "author" }
    }
    return "anonymous";
}

async function getStories(id = null) {
    let ssUrl = singleStoryUrl;
    if (id) {
        ssUrl += "?story=" + id;
    }

    // Fetch the main article
    const mainArticleResponse = await fetch(ssUrl);
    const mainArticle = await mainArticleResponse.json();
    mainArticleID = mainArticle._id

    // Populate the main article content
    document.getElementById("article-title").textContent = mainArticle.title;
    document.getElementById("story-body").innerHTML = `
        <h2>${mainArticle.teaser}</h2>
        <p>${mainArticle.body}</p>
        <p><strong>Created:</strong> ${mainArticle.created}</p>
        <p><strong>Last Edited:</strong> ${mainArticle.edited}</p>
    `;

    // Populate categories
    const categoriesList = document.getElementById("categories-list").querySelector("ul");
    categoriesList.innerHTML = ""; // Clear previous categories if any
    mainArticle.categories.forEach(category => {
        const li = document.createElement("li");
        li.textContent = category;
        categoriesList.appendChild(li);
    });

    // Populate comments
    const commentsList = document.getElementById("comments-list");
    commentsList.innerHTML = ""; // Clear previous comments if any
    mainArticle.comments.forEach(comment => {
        const commentElement = document.createElement("div");
        commentElement.classList.add("comment-item");
        commentElement.innerHTML = `
            <p><strong>User:</strong> ${comment.username}</p>
            <p>${comment.comment}</p>
            <p><em>${comment.date}</em></p>
        `;
        commentsList.appendChild(commentElement);
    });

    // Fetch and display other stories
    const otherStoriesResponse = await fetch(`http://localhost:8080/dailyBugle/article/stories?story=${mainArticle._id}`);
    const otherStories = await otherStoriesResponse.json();
    globalOtherStories = otherStories
    const otherStoriesList = document.getElementById("other-stories-list");
    otherStoriesList.innerHTML = ""; // Clear previous stories if any
    otherStories.forEach(story => {
        const storyElement = document.createElement("li");
        storyElement.classList.add("story-preview");
        storyElement.innerHTML = `
            <h3>${story.title}</h3>
            <p>${story.teaser}</p>
            <button onclick="getStories('${story._id}')">Read More</button>
        `;
        otherStoriesList.appendChild(storyElement);
    });

    const userRole = await getUserRole()
    isAuthor = userRole === "author";
    if (isAuthor) {
        const editButton = document.getElementById("edit-story-button");
        editButton.style.display = "block";
        editButton.addEventListener("click", () => {
            // Navigate to author.html with the current story data
            window.location.href = `author.html?edit=true&id=${mainArticleID}`;
        });

        const advert = document.getElementById("ad")
        advert.style.display = "none"

        document.getElementById("new-story-button").style.display = "flex"

        if (userRole !== "reader") {
            document.getElementsById('comment-section').style.display = "none"
        }
    }
}

document.getElementById('submit-comment').addEventListener('click', async () => {
    const commentInput = document.getElementById("comment-input");
    const commentText = commentInput.value.trim();

    if (!commentText) {
        alert("Please enter a comment!");
        return;
    }

    if (!mainArticleID) {
        alert("Article ID is missing. Cannot submit the comment.");
        return;
    }

    try {
        // Submit the comment to the backend
        const response = await fetch(`http://localhost:8080/dailyBugle/article/stories/${mainArticleID}/comment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                comment: commentText
            })
        });

        if (response.ok) {
            commentInput.value = ""; // Clear the input field
            getStories(mainArticleID); // Reload the article and its comments
        } else {
            const errorData = await response.json();
            alert(`Failed to submit comment: ${errorData.error || "Unknown error"}`);
        }
    } catch (error) {
        console.error("Error submitting comment:", error);
        alert("An error occurred while submitting the comment. Please try again.");
    }
})

document.querySelector('.advert').addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:8080/dailyBugle/ad/event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventType: 'adClick',
                articleId: mainArticleID
            })
        });

        if (response.ok) {
            console.log('Ad event recorded successfully.');
        } else {
            console.error('Failed to record ad event.');
        }
    } catch (error) {
        console.error('Error recording ad event:', error);
    }
});

document.getElementById("search-input").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const resultsContainer = document.getElementById("search-results");
    resultsContainer.innerHTML = ""; // Clear previous results

    if (query.trim() === "") return; // Do not search if query is empty

    // Filter stories based on title, teaser, body, or categories
    const filteredStories = globalOtherStories.filter(story =>
        story.title.toLowerCase().includes(query) ||
        story.teaser.toLowerCase().includes(query) ||
        story.body.toLowerCase().includes(query) ||
        story.categories.some(category => category.toLowerCase().includes(query))
    );

    // Populate search results
    filteredStories.forEach(story => {
        const li = document.createElement("li");
        li.textContent = story.title;
        li.addEventListener("click", () => {
            window.location.href = `reader.html?id=${story._id}`; // Navigate to the story's page
        });
        resultsContainer.appendChild(li);
    });
});

document.getElementById("logout-button").addEventListener("click", async () => {
    try {
        const response = await fetch("http://localhost:8080/dailyBugle/auth/logout", {
            method: "POST",
            credentials: "include", // Ensure cookies are sent with the request
        });

        if (response.ok) {
            alert("Logged out successfully");
            window.location.href = "login.html"; // Redirect to the login page
        } else {
            alert("Failed to log out");
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred while logging out. Please try again.");
    }
});


window.onload = () => getStories(idFromParams);
