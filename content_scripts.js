
// Add a listener for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // Check if the message action is "getTextFromTab"
    if (request.action === "getTextFromTab") {
  
      // Select all paragraph elements on the page
      const pElements = document.querySelectorAll("p");
  
      // Initialize a variable to store the combined text of all paragraphs
      let combinedText = "";
  
      // Iterate through each paragraph element and append its text content to the combinedText variable
      pElements.forEach((pElement) => {
        combinedText += pElement.textContent.trim() + "\n";
      });
  
      // Send the combined text as the response to the background script
      sendResponse(combinedText);
  
    }
  
});
