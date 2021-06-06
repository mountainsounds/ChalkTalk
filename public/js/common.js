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
})