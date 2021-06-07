$('#postTextarea').keyup(e => {
  let textbox = $(e.target);
  let value = textbox.val().trim();
  let submitBtn = $("#submitPostButton");

  if (submitBtn.length === 0) return;

  if (value === "") {
    submitBtn.prop("disabled", true);
    return;
  }

  submitBtn.prop("disabled", false);
});

$("#submitPostButton").click(e => {
  console.log("Is this clicked!?")
  let btn = $(e.target);
  let textbox = $("#postTextarea");

  let data = {
    content: textbox.val(),
  }

  $.post("/api/posts", data, (postData, status, xhr) => {
    alert(postData);
  })
});