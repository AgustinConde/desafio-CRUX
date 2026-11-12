document.querySelectorAll(".message-close").forEach((button) => {
    button.addEventListener("click", () => {
        button.closest("li").remove();
    });
});
