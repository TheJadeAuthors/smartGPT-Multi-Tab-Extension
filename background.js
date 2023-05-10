// The smartGPT Multi-Tab Resolver is a Chrome extension that allows users to interact with ChatGPT across 
// multiple tabs to get more refined answers to their questions. The extension comprises several components, 
// including a background script, content script, popup window, and associated JavaScript and HTML files.

// When the user enters a question in the popup window and clicks the submit button, the popup.js script collects 
// the input, selected GPT model, and the number of agents, and sends this information to the background.js script. 
// The background.js script then modifies the user input by appending specific instructions and proceeds to generate 
// the specified number of responses from the chosen GPT model. It does this by opening multiple tabs, each 
// representing an agent, and sending the modified input to ChatGPT. The content script.js then retrieves the text 
// response from each agent, and the background.js script combines these responses into a single string.

// Next, the background.js script opens a new tab with the researcher role, supplying the combined responses and a 
// set of instructions to analyze the flaws and faulty logic in each response. Once the researcher's response is 
// obtained, the script opens another tab, this time with the resolver role, and provides it with the original question, 
// combined responses, and the researcher's findings. The resolver is then instructed to find the best answer option 
// and improve it based on the available information.

// Throughout the process, the extension interacts with the ChatGPT website by creating new tabs, executing JavaScript 
// code to manipulate the website's DOM elements, and extracting the desired text content. The content script.js plays a 
// crucial role in retrieving the text response from each agent, and the background.js script coordinates the entire process, 
// ensuring the desired sequence of actions is followed. The manifest.json file contains metadata about the extension, 
// including permissions, browser action configurations, and references to the content and background scripts. The popup 
// window, defined in popup.html, serves as the user interface for the extension, allowing users to input their question 
// and select options such as the GPT model and the number of agents. The associated popup.js script handles user interactions 
// with the popup window and sends messages to the background.js script to initiate the process.

// The createTab function creates a new browser tab with the given URL and returns a Promise that resolves with the created tab object.
const createTab = (url) => {
    return new Promise((resolve) => {
        // The chrome.tabs.create method creates a new tab with the provided URL and calls the callback function with the created tab object.
        chrome.tabs.create({ url }, (tab) => {
            resolve(tab); // The Promise is resolved with the created tab object.
        });
    });

};
  
// The getTextFromTab function sends a message to the content script running in the specified tab, requesting the text content of the tab.
// It returns a Promise that resolves with the text content received from the content script.
const getTextFromTab = (tab) => {
    return new Promise((resolve) => {
        // The chrome.tabs.sendMessage method sends a message with the specified action to the content script running in the tab with the given ID.
        chrome.tabs.sendMessage(tab.id, { action: "getTextFromTab" }, (response) => {
            resolve(response); // The Promise is resolved with the received text content.
        });
    });
};
  
// The RegenerateResponsePresent function checks if a Regenerate response is present in the specified tab.
// It returns a Promise that resolves with the result (true or false) received from the content script.
const RegenerateResponsePresent = (tab) => {
    return new Promise((resolve) => {
        // The chrome.tabs.sendMessage method sends a message with the specified action to the content script running in the tab with the given ID.
        chrome.tabs.sendMessage(tab.id, { action: "getRegenerateResponse" }, (response) => {
            resolve(response); // The Promise is resolved with the result (true or false) indicating the presence of a Regenerate response.
        });
    });
};

// waitForElementPlaceHolder function waits for an element in a tab with a given ID 
// that matches the specified selector and placeholder text.
const waitForElementPlaceHolder = async (tabId, selector, expectedText, timeout = 120000) => {
    // Define the function to be executed in the tab.
    const checkElementAndPlaceholder = (selector, expectedText) => {
        const element = document.querySelector(selector);
        const actualPlaceholder = element && element.placeholder ? element.placeholder.trim() : '';
        return element !== null && actualPlaceholder === expectedText;
    };

    const start = Date.now();

    // Keep checking until the timeout.
    while (Date.now() - start < timeout) {
        const elementExistsAndPlaceholderMatches = await new Promise((resolve) => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: checkElementAndPlaceholder,
                args: [selector, expectedText]
            }, ([result]) => {
                resolve(result.result);
            });
        });
        
        // If the element is found and the placeholder matches, return true.
        if (elementExistsAndPlaceholderMatches) {
            return true;
        }

        // Wait for 300 ms before checking again.
        await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // If the element is not found within the timeout, throw an error.
    throw new Error(`Element with matching placeholder not found within ${timeout} ms: ${selector}`);
};

// waitForElementWithInnerText function waits for an element in a tab with a given ID 
// that matches the specified selector and has inner text containing the expected value.
const waitForElementWithInnerText = async (tabId, selector, expectedInnerText, timeout = 120000) => {
    // Define the function to be executed in the tab.
    const checkElementAndInnerText = (selector, expectedInnerText) => {
        const element = document.querySelector(selector);
        const actualInnerText = element && element.textContent ? element.textContent.trim() : '';
        return element !== null && actualInnerText.includes(expectedInnerText);
    };

    const start = Date.now();

    // Keep checking until the timeout.
    while (Date.now() - start < timeout) {
        const elementExistsAndInnerTextMatches = await new Promise((resolve) => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: checkElementAndInnerText,
                args: [selector, expectedInnerText]
            }, ([result]) => {
                resolve(result.result);
            });
        });

        // If the element is found and the inner text matches, return true.
        if (elementExistsAndInnerTextMatches) {
            return true;
        }

        // Wait for 300 ms before checking again.
        await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // If the element is not found within the timeout, throw an error.
    throw new Error(`Element with matching inner text not found within ${timeout} ms: ${selector}`);
};

// setTextInTextarea function sets the text in a textarea in a given tab.
const setTextInTextarea = (tabId, text) => {
    // Define the function to be executed in the tab.
    const setTextFunction = (text) => {
        // Look for a textarea with the specified data-id
        var textarea = document.querySelector('textarea[data-id="root"]');
        if (textarea) {
            // Set the textarea's value to the given text.
            textarea.value = text;
            // Dispatch an input event to notify the page that the textarea's value has changed.
            textarea.dispatchEvent(new Event('input'));
    
            // Simulate pressing the 'Enter' key by creating and dispatching a new KeyboardEvent.
            const enterKeyEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                view: window,
                bubbles: true,
                cancelable: true
            });
            textarea.dispatchEvent(enterKeyEvent);
        } else {
            console.error('Textarea not found');
        }
    };

    // Execute the function in the tab with the given tabId and resolve the Promise when it's done.
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: setTextFunction,
            args: [text]
        }, () => {
            resolve();
        });
    });
};

// The selectTab function retrieves a tab with the specified ID and returns a Promise that resolves with the tab object.
const selectTab = (tabId) => {
    return new Promise((resolve, reject) => {
        chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
        } else {
            resolve(tab);
        }
        });
    });
};
  
// The openTabAndGetResponse function opens a new tab with the specified model (GPT-3.5 or GPT-4), sends a message to the model, and retrieves its response.
// If Close_Tab is set to true, the function also closes the tab after retrieving the response.
const openTabAndGetResponse = async (modifiedInput, Model, closeTab) => {

    const chatGPTURL = "https://chat.openai.com/";
    let queryModel = "";
    let tab;
  
    // Determine the model chosen.
    if (Model == 'gpt-3.5') {
      queryModel = "?&model=gpt-3.5";
    } else if (Model == 'gpt-4') {
      queryModel = "?&model=gpt-4";
    }
  
    // Setup the tab.
    tab = await createTab(chatGPTURL + queryModel);
  
    // Wait for the textarea to appear
    await waitForElementPlaceHolder(tab.id, 'textarea[data-id="root"]', 'Send a message.');
  
    // Pause briefly.
    await new Promise((resolve) => setTimeout(resolve, 2000));
  
    // Place the modified input in the message box and hit return.
    await setTextInTextarea(tab.id, modifiedInput);
  
    // Pause briefly.
    await new Promise((resolve) => setTimeout(resolve, 2000));
  
    // Wait for the specified element with the desired text content
    await waitForElementWithInnerText(tab.id, 'body', 'Regenerate response');
  
    // Pause briefly.
    await new Promise((resolve) => setTimeout(resolve, 2000));
  
    // Add logic to extract the response from the tab
    const response = await getTextFromTab(tab);
  
    if (closeTab == true) {
      // Close the tab
      chrome.tabs.remove(tab.id);
    };
  
    return response;

};

// The modifyUserInput function takes the user input and appends additional text to it in order to modify the input for further processing.
const modifyUserInput = (userInput) => {
    modifiedInput = userInput + "\n\n"
      + "Let us work this out in a step by step way to be sure we have the right answer." + "\n\n"
      + "Do not use lists or bullet points in your answer.  Respond using paragraphs." + "\n\n";
  
    return modifiedInput;
};
  
// The generateResponses function generates a specified number of responses for a given input using the specified model.
// It has an optional parameter to close the tab after generating each response.
const generateResponses = async (input, model, numResponses, closeTab) => {
    const responses = [];
  
    for (let i = 0; i < numResponses; i++) {
      const response = await openTabAndGetResponse(input, model, closeTab);
      responses.push(response);
    }
  
    return responses;
};

// This function listens for messages from the extension and responds accordingly.
chrome.runtime.onMessage.addListener((message, sender, response) => {

    // If the received message is a user question, process the question and generate responses using the specified model.
    if (message.name == "userQuestion") {
      (async () => {
        const userInput = message.text;
        const modifiedInput = modifyUserInput(userInput);
  
        // Generate the specified number of responses
        const responses = await generateResponses(modifiedInput, message.model, message.agents, true);
        const combinedResponses = responses.join("\n\n");
  
        // Generate researcher input and response
        const researcherInput = 'The original question was: ' + userInput + "\n\n"
          + "Investigate the below responses and list the flaws and faulty logic of each answer option." + "\n\n"
          + combinedResponses + "\n\n"
          + "Do not use lists or bullet points in your answer.  Respond using paragraphs." + "\n\n"
          + "Make sure you include all of the responses in your answer." + "\n\n"
          + "Let us work this out in a step by step way to be sure we have the right answer." + "\n\n";
        const researcherResponse = await openTabAndGetResponse(researcherInput, message.model, true);
  
        // Generate resolver input and response
        const resolverInput = "The original question was: " + "\n\n" + userInput + "\n\n"
          + "The below responses were offered:" + "\n\n" + combinedResponses + "\n\n"
          + "A researcher reviewed the above answers and provided the following list of flaws and faulty logic:" + "\n\n" + researcherResponse + "\n\n"
          + "Based on the available answers and the researcher's findings, find the best answer option and improve it." + "\n\n"
          + "Write out your revised and completed answer below. Do not use lists or bullet points in your answer.  Respond using paragraphs." + "\n\n"
          + "Let us work this out in a step by step way to be sure we have the right answer.";
        const resolverResponse = await openTabAndGetResponse(resolverInput, message.model, false);
      })();
    }
});

