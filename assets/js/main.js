// Smooth scrolling for all links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// Add any additional scripts below

// Toggle mobile menu
const menuToggle = document.querySelector(".menu-toggle");
const siteNavigation = document.querySelector(".site-navigation");

menuToggle.addEventListener("click", () => {
  siteNavigation.classList.toggle("open");
});

// Dynamically load more posts
function loadPosts() {
  fetch("path/to/posts")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((post) => {
        const postElement = document.createElement("div");
        postElement.innerHTML = `<h3>${post.title}</h3><p>${post.excerpt}</p>`;
        document.querySelector("#latest-posts .posts").appendChild(postElement);
      });
    })
    .catch((error) => console.error("Error loading posts:", error));
}

window.onscroll = function () {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    loadPosts();
  }
};

// Simple tabbed content
document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", function () {
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.style.display = "none";
    });
    document.querySelector(this.getAttribute("data-target")).style.display =
      "block";
  });
});
