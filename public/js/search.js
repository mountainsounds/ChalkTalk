$("#searchBox").keydown((e) => {
  clearTimeout(timer);

  let textbox = $(e.target);
  let value = textbox.val();
  let searchType = textbox.data().search;

  timer = setTimeout(() => {
    value = textbox.val().trim();

    if (value === "") {
        $(".resultsContainer").html("");
    } else {
      search(value, searchType);

    }
  }, 500)
});

function search(searchTerm, searchType = "posts") {
    let url = searchType === "users" ? "/api/users" : "/api/posts";

    $.get(url, { search: searchTerm }, (results) => {
        let container = $(".resultsContainer");
        searchType === "users" ? outputUsers(results, container) : outputPosts(results, container);
    })
}