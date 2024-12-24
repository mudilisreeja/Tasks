const form = document.getElementById("form");
const nameField = document.getElementById("name");
const feedbackField = document.getElementById("feedback");
const errorMsgName = document.getElementById("errormsg-name");
const errorMsgFeedback = document.getElementById("errormsg-feedback");
const alphabetRegex = /^[A-Za-z\s]+$/; 

errorMsgName.textContent = "";
errorMsgFeedback.textContent = "";

document.getElementById("thumbs-up").addEventListener("click", (e) => {
    e.preventDefault();
    validateForm();
});
document.getElementById("thumbs-down").addEventListener("click", (e) => {
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
    
    // Reset error messages
    errorMsgName.textContent = "";
    errorMsgFeedback.textContent = "";

    let isValid = true;

    // Name validation
    if (nameValue === "") {
        errorMsgName.textContent = "Name cannot be empty!";
        isValid = false;
    } else if (!alphabetRegex.test(nameValue)) {
        errorMsgName.textContent = "Name can only contain alphabets.";
        isValid = false;
    }

    // Feedback validation
    if (feedbackValue === "") {
        errorMsgFeedback.textContent = "Feedback cannot be empty.";
        isValid = false;
    } else if (!alphabetRegex.test(feedbackValue)) {
        errorMsgFeedback.textContent = "Feedback can only contain alphabets.";
        isValid = false;
    }

    if (isValid) {
        // If the form is valid, show the success message
        document.getElementById("thumbs-up").addEventListener("click", () => {
            alert(`Thank you ${nameValue}! for your feedback.`);
            form.reset();
        });

        // If the form is invalid, show the sorry message
        document.getElementById("thumbs-down").addEventListener("click", () => {
            alert("We are sorry! We will try to make things better.");
            form.reset();
        });
    }
}
