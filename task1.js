const form = document.getElementById("form");
const nameField = document.getElementById("name");
const feedbackField = document.getElementById("feedback");
const errorMsgName = document.getElementById("errormsg-name");
const errorMsgFeedback = document.getElementById("errormsg-feedback");
const thumbsUpButton = document.getElementById("thumbs-up");
const thumbsDownButton = document.getElementById("thumbs-down");
const alphabetRegex = /^[A-Za-z\s]+$/;

errorMsgName.textContent = "";
errorMsgFeedback.textContent = "";

// Disable the buttons 
thumbsUpButton.disabled = true;
thumbsDownButton.disabled = true;


thumbsUpButton.addEventListener("click", (e) => {
    e.preventDefault();
    validateForm(true); 
});

thumbsDownButton.addEventListener("click", (e) => {
    e.preventDefault();
    validateForm(false); 
});

// Event listener for form submit
form.addEventListener("submit", (e) => {
    e.preventDefault();
    validateForm();
});


nameField.addEventListener("input", checkFormFields);
feedbackField.addEventListener("input", checkFormFields);

function checkFormFields() {
    const nameValue = nameField.value.trim();
    const feedbackValue = feedbackField.value.trim();

    
    if (nameValue !== "" && feedbackValue !== "") {
        thumbsUpButton.disabled = false;
        thumbsDownButton.disabled = false;
    } else {
        thumbsUpButton.disabled = true;
        thumbsDownButton.disabled = true;
    }
}

function validateForm(isThumbsUp = null) {
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

        if (isThumbsUp) {
            alert(`Thank you ${nameValue}! for your feedback.`);
        } else if (isThumbsUp === false) {
            alert("We are sorry! We will try to make things better.");
        }

        
        form.reset();
        
        thumbsUpButton.disabled = true;
        thumbsDownButton.disabled = true;
    }
}
