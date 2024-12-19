const form = document.getElementById("form");
const nameField = document.getElementById("name");
const feedbackField = document.getElementById("feedback");
const errorMsg = document.getElementById("errormsg");
const alphabetRegex = /^[A-Za-z\s]+$/; 

errorMsg.textContent = "";

document.getElementById("thumbs-up").addEventListener("click", (e) => {
    e.preventDefault();
    validateForm();
});
document.getElementById("form").addEventListener("submit", (e) => {
    e.preventDefault();
    validateForm();
});

function validateForm() {
    const nameValue = nameField.value.trim();
    const feedbackValue = feedbackField.value.trim();

    // Name section
    if (nameValue === "") {
        errorMsg.textContent = "Name cannot be empty!";
        return;
    } else if (!alphabetRegex.test(nameValue)) {
        errorMsg.textContent = "Name can only contain alphabets.";
        return;
    }

    // Feedback section
    if (feedbackValue === "") {
        errorMsg.textContent = "Feedback cannot be empty.";
        return;
    } else if (!alphabetRegex.test(feedbackValue)) {
        errorMsg.textContent = "Feedback can only contain alphabets.";
        return;
    }

    
    alert(`Thank you for your feedback, ${nameValue}!`);
    errorMsg.textContent = ""; 
    form.reset();
}

document.getElementById("thumbs-down").addEventListener("click", () => {
    alert("We are sorry! Please share your feedback to help us improve.");
    errorMsg.textContent = ""; 
    form.reset();

});
errorMsg.textContent = ""; 
form.reset();
