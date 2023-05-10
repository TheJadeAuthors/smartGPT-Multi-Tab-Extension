// Function to handle button click event
const handleButtonClick = () => {
    // Get user input, selected model, and number of agents from the DOM
    const userInput = document.getElementById('user-input').value;
    const selectedModel = document.getElementById('model-select').value;
    const numberOfAgents = document.getElementById('num-agents-select').value;
  
    // Check if the user has entered a question
    if (userInput.trim() === '') {
      alert('Please enter a question before submitting.');
      return;
    }
  
    // Send the message to background.js if a question is provided
    chrome.runtime.sendMessage({ name: 'userQuestion', text: userInput, model: selectedModel, agents: numberOfAgents });

};
  
// Event listener for DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {

    // Get the submit button element
    const submitButton = document.getElementById('submit-button');
  
    // Add a click event listener to the submit button
    submitButton.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent form submission
      handleButtonClick();
    });

});

