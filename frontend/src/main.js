import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

/**
The function is used to hide the element according to a certain id field
 * @param {id} the element which has the corresponding input id
 * hide this element 
 */
const hideElement = (id) => {
    const item = document.getElementById(id);
    if(item){
        document.getElementById(id).style.display = 'none'; 
    }
};

/**
The function is used to show the element according to a certain id field
 * @param {id} the element which has the corresponding input id
 * show this element 
 */
const showElement = (id) => {
    const item = document.getElementById(id);
    if(item){
        document.getElementById(id).style.display = 'block'; 
    }
};

/**
The function is used to check whether the current user is the admin
 * @return the response from the backend API that show true or false
 * check whether current user is admin
 */
const checkIfUserIsAdmin = () => {
    const token = localStorage.getItem('TOKEN');
    const userId = localStorage.getItem('USER_ID');

    // Return the promise chain here
    return fetch(`http://localhost:5005/user?userId=${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        return response.json();
    })
    .then(data => {
        // Return the admin status directly
        return data.admin;
    })
    .catch(error => {
        console.error('Error checking admin status:', error);
        throw error; // Rethrow the error so that the caller knows it failed
    });
};

/**
Function to check if the current user is an admin or the creator of the thread
 * @param {creatorId} the id of the current thread's creator
 * @return {isAdmin} the response from the backend API that show true or false
 * check whether current user is admin or creator of the thread
 */
// 
const checkIfUserIsAdminOrCreator = (creatorId) => {
    const userId = localStorage.getItem('USER_ID');

    // resolve if the user is the creator
    if (creatorId.toString() === userId) {
        return Promise.resolve(true);
    }

    // Otherwise, check if the user is an admin
    return checkIfUserIsAdmin().then(isAdmin => {
        return isAdmin; // Return the admin status
    }).catch(error => {
        // rethrow to let the caller handle the error
        throw error;
    });
};




//Function to show the dashboard
const showDashboard = () => {
    hideElement('TotalLoginForm');
    hideElement('registerFormContainer');
    showElement('dashboardContainer');
    
};

let currentLoginUserPassord = null;


// function to do the logout
const logOut = () => {
    // remove the token and user id from local storage
    localStorage.removeItem('TOKEN');
    localStorage.removeItem('USER_ID');
    showElement('TotalLoginForm');
    hideElement('dashboardContainer');
    const threadListContainer = document.getElementById('threadListContainer');
    while (threadListContainer.firstChild) {
        threadListContainer.removeChild(threadListContainer.firstChild);
    }
    currentIndex = 0;
    hideElement('singleThreadContainer');
    currentLoginUserPassord = null;
};



/**
The function to handle the popup window
 * @param {message} the message that will be shown in the popup window
 * show the popup window
 */
const showErrorModal = (message) =>{
    const modal = document.getElementById('errorModal');
    const span = document.getElementsByClassName("close-button")[0];
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = message;
    modal.style.display = "block";

    // when user clicks (x)，close the popup window.
    span.onclick = function() {
        modal.style.display = "none";
    }

    // when user clicks the outside of the popup window, close the window as well.
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}


/**
The function to handle the Registration event
 * @param {event} the event that someone do on the register form
 * @return the register conidition sent back from backend(Registration failed/Registration successful)
 */
const handleRegisterFormSubmission = (event) => {
    event.preventDefault();

    const registerEmail = document.getElementById('registerEmail').value;
    const registerName = document.getElementById('registerName').value;
    const registerPassword = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('errorReg');
    errorDiv.style.display = 'none';

    // check whehter the two passwords are the same
    if (registerPassword !== confirmPassword) {
        errorDiv.textContent = "Two input password are not the same";
        errorDiv.style.display = 'block';
        showErrorModal('Passwords do not match.'); 
        return; 
    }

    // if the passwords are the same, then submit the form
    const formData = {
        email: registerEmail,
        name: registerName,
        password: registerPassword,
    };

    fetch('http://localhost:5005/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Registration failed');
        }
        return response.json();
    })
    .then(data => {

        errorDiv.textContent = 'Registration successful, jump in 2 seconds.';
        errorDiv.style.display = 'block';

        const token = data.token;
        const userId = data.userId;

        localStorage.setItem("TOKEN", token);
        localStorage.setItem("USER_ID", userId);

        currentLoginUserPassord = registerPassword;

        // set the timeout to be 2 seconds
        setTimeout(function() {
            showDashboard();
            loadThreads();
            errorDiv.textContent = '';
            errorDiv.style.display = "none";
        }, 2000);
    })
    .catch(error => {
        errorDiv.textContent = "Registration failed, maybe email already been registered";
        errorDiv.style.display = 'block';
        showErrorModal(error.message);
    });
};


/**
The function to handle the login event
 * @param {event} the event that someone do on the loginForm
 * @return the login conidition sent back from backend(login failed/login successful)
 */
const handleLoginFormSubmission = (event) =>{
    event.preventDefault();  // Prevent the form from submitting normally

    const errorDiv = document.getElementById('errorLogin');
    errorDiv.style.display = 'none';

    // Get the form data
    const formData = new FormData(event.target);  // the form that triggered the event
    const email = formData.get('email');  // Get the email from the form
    const password = formData.get('password');  // Get the password from the form

    // Create the JSON object to send
    const jsonData = {
        email: email,
        password: password
    };

    fetch('http://localhost:5005/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData),  // Convert the JSON object to a string
    })
    
    .then(response => {
        if (!response.ok) {
            // Handle HTTP errors
            throw new Error('Login failed');
        }
        return response.json();  // Parse the JSON in the response
    })
    .then(data => {
        // show the login success message in the error disaplay area
        errorDiv.textContent = 'Login successful, jump in 2 seconds.';
        errorDiv.style.display = 'block';

        const token = data.token;
        const userId = data.userId;

        localStorage.setItem("TOKEN", token);
        localStorage.setItem("USER_ID", userId);

        currentLoginUserPassord = password;


        // set the timeout to be 2 seconds
        setTimeout(function() {
            showDashboard();
            loadThreads();
            errorDiv.textContent = '';
            errorDiv.style.display = "none";
        }, 2000);
    })
    // catch the error and output the error message
    .catch(error => {
        // show the error message in the error display area
        errorDiv.textContent = 'Incorrect username & password pair.';
        errorDiv.style.display = 'block';

        // show teh error message on teh popup window
        showErrorModal('Incorrect username & password pair.');
    });
};

let currentIndex = 0;

/**
The function to handle the thread creation
 * @param {event} the event that someone do on the thread creation modal
 * @return the create conidition sent back from backend(creation failed/creation successful)
 */
const handleThreadCreation = (event) => {
    event.preventDefault();

    // Gather the form data
    const threadTitle = document.getElementById('threadTitle').value;
    const threadContent = document.getElementById('threadContent').value;
    const threadPublic = document.getElementById('threadPublic').checked;

    const errorDiv = document.getElementById('errorCreate');
    errorDiv.style.display = 'none';

    const token = localStorage.getItem("TOKEN"); 

    // Prepare the POST request body
    const requestBody = {
        title: threadTitle,
        isPublic: threadPublic,
        content: threadContent,
    };

    // Send the POST request to create a new thread
    fetch('http://localhost:5005/thread', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(requestBody),
        
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create thread');
        }
        return response.json();
    })
    .then(data => {
        // Handle successful thread creation

        errorDiv.textContent = 'Create Thread successful, jump in 3 seconds.';
        errorDiv.style.display = 'block';

        setTimeout(() => {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
            closeModal2();
            const threadListContainer = document.getElementById('threadListContainer');
            while (threadListContainer.firstChild) {
                threadListContainer.removeChild(threadListContainer.firstChild);
            }
            currentIndex = 0;
            loadThreads(); 
            displaySingleThread(threadId); 
        }, 3000);
        displaySingleThread(data.id);

    })
    .catch(error => {
        showErrorModal('Failed to create thread');
        console.error('Error:', error);
    });
};



/**
Function to get the thread id from the backend API
 * @return the 5 or less thread ids from the backend
 */
// 
const getThreadIds = () => {
    const token = localStorage.getItem('TOKEN'); 

    return fetch(`http://localhost:5005/threads?start=${currentIndex}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
    })
    .then(response => {
        
        if (!response.ok) {
            throw new Error('Failed to fetch threads');
        }
        return response.json();
    });
};

// add evenet listener to each thread shown in the thread list
const attachThreadClickEvent = (threadBox, threadId) => {
    threadBox.addEventListener('click', () => displaySingleThread(threadId));
};


/**
Function to display the thread list
 * @param {threadIds} the id of all the thread that need to be displayed
 */
// 
const displayThreads = (threadIds) => {
    const token = localStorage.getItem('TOKEN'); // get the token

    Promise.all(threadIds.map(threadId => 
        fetch(`http://localhost:5005/thread?id=${threadId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
        }).then(resp => resp.json())
    ))
    .then(threads => {
        
        const threadListContainer = document.getElementById('threadListContainer');

        threads.forEach(thread => {
            const threadBox = document.createElement('div');
            threadBox.className = 'thread-box';
            
            attachThreadClickEvent(threadBox, thread.id)

            const threadTitle = document.createElement('h3');
            threadTitle.textContent = thread.title;
            threadBox.appendChild(threadTitle);
            
            const threadInfo = document.createElement('div'); 
            threadInfo.className = 'thread-info';
            
            const threadDate = document.createElement('span'); 
            threadDate.textContent = `Date: ${new Date(thread.createdAt).toLocaleString()}`;
            threadInfo.appendChild(threadDate);
            
            const threadAuthor = document.createElement('span'); 
            threadAuthor.textContent = `Author ID: ${thread.creatorId}`;
            threadInfo.appendChild(threadAuthor);
            
            threadBox.appendChild(threadInfo);
            
            const threadLikes = document.createElement('p');
            
            const likesCount = Object.keys(thread.likes || {}).length;
            threadLikes.textContent = `Likes: ${likesCount}`;
            threadBox.appendChild(threadLikes);
            
            threadListContainer.appendChild(threadBox);
        });
        showElement('threadListContainer');

        // update current index
        currentIndex += threads.length;

    })
    .catch(error => {
        console.error('Error:', error);
    });
};

/**
Function to display the thread list and necessary information in each thread box
 * @return the duisplay of each threads
 */
// 
const loadThreads = () => {
    getThreadIds()
    .then(threadIds => {
        if (threadIds.length < 5) {
            hideElement('loadMoreThreads');
        }else{
            showElement('loadMoreThreads');
        }

        return displayThreads(threadIds);
    })
    .catch(error => {
        console.error('Error:', error);
    });
};



let currentEditingThreadId = null;
/**
Function to display the information of a specific thread
 * @param {threadId} the id of the chosen thread that needs to be displayed
 * @return the response infromation of the chosen thread send from the backend API
 * display all the corresponding information of the current thread.
 */
// 
const displaySingleThread = (threadId) => {
    const token = localStorage.getItem('TOKEN');

    fetch(`http://localhost:5005/thread?id=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch thread details');
        }
        return response.json();
    })
    .then(thread => {
        // get the elements of current chosen thread
        const singleThreadTitle = document.getElementById('singleThreadTitle');
        const singleThreadContent = document.getElementById('singleThreadContent');
        const singleThreadLikes = document.getElementById('singleThreadLikes');

        // set the content for each part of thread
        singleThreadTitle.textContent = thread.title;
        singleThreadContent.textContent = thread.content;
        singleThreadLikes.textContent = `Likes: ${Object.keys(thread.likes || {}).length}`;

        let userLikedThisThread = thread.likes.includes(parseInt(localStorage.getItem('USER_ID')));
        if(userLikedThisThread){
            isThreadLikedByUser = true;
            let likeThread = document.getElementById('likeThreadBtn');
            likeThread.textContent = "Unlike";
        }else{
            isThreadLikedByUser = false;
            let likeThread = document.getElementById('likeThreadBtn');
            likeThread.textContent = "Like";
        }

        let userWatchedThisThread = thread.watchees.includes(parseInt(localStorage.getItem('USER_ID')));
        if(userWatchedThisThread){
            isThreadBeingWatchedByUser = true;
            let watchThread = document.getElementById('watchThreadBtn');
            watchThread.textContent = "Unwatch";
        }else{
            isThreadBeingWatchedByUser = false;
            let watchThread = document.getElementById('watchThreadBtn');
            watchThread.textContent = "Watch";
        }

        checkIfUserIsAdminOrCreator(thread.creatorId).then(isAdminOrCreator => {
            console.log("is admin or creator");
            console.log(isAdminOrCreator);
            currentEditingThreadId = threadId; // save the thread id that currently editing
            if (isAdminOrCreator) {
                showElement('editThreadBtn');
                showElement('deleteThreadBtn');
                showElement('likeThreadBtn');
                showElement('watchThreadBtn');
                handleCommentThreadBoxClick();
                setupCommentSection();

            } else {
                hideElement('editThreadBtn');
                hideElement('deleteThreadBtn');
                showElement('likeThreadBtn');
                showElement('watchThreadBtn');
                handleCommentThreadBoxClick();
                setupCommentSection();
                
            }
        });
        

        showElement('singleThreadContainer');
        


    })
    .catch(error => {
        console.error('Error:', error);
    });
};




let isThreadLikedByUser = false;

/**
The function that used to check whether current already liked this thread
 * @return the response infromation of the chosen thread send from the backend API
 * if current user liked this thread, change isThreadLikedByUser to be true.
 */
// 
const checkWhetherCurrentUserLike = () =>{
    const token = localStorage.getItem('TOKEN');

    fetch(`http://localhost:5005/thread?id=${currentEditingThreadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch thread details');
        }
        return response.json();
    })
    .then(thread => {

        const userLikedThisThread = thread.likes.includes(parseInt(localStorage.getItem('USER_ID')));
        if(userLikedThisThread){
            isThreadLikedByUser = true;
        }else{
            isThreadLikedByUser = false;
        }
        const threadListContainer = document.getElementById('threadListContainer');
        while (threadListContainer.firstChild) {
            threadListContainer.removeChild(threadListContainer.firstChild);
        }
        currentIndex = 0;
        loadThreads();
    })
    .catch(error => {
        console.error('Error:', error);
    });

}


// update the like button text 
const updateLikeButtonText = () => {
    const likeButton = document.getElementById('likeThreadBtn');
    likeButton.textContent = isThreadLikedByUser ? 'Like' : 'Unlike';
};


/**
Function to handle like thread function
 * @param {threadId} the id of the chosen thread
 * @return the response infromation of the chosen thread send from the backend API
 */
// 
const toggleLikeStatus = (threadId) => {
    const token = localStorage.getItem('TOKEN');
    let inputLikeToAPI = !isThreadLikedByUser;

    fetch(`http://localhost:5005/thread/like`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            "id" : threadId,
            "turnon": inputLikeToAPI,
        }),
        
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to toggle like on thread');
        }
        return response.json();
    })
    .then(data => {
        checkWhetherCurrentUserLike();
        updateLikeButtonText();
        hideElement(singleThreadContainer);
        displaySingleThread(currentEditingThreadId);
    })
    .catch(error => {
        console.error('Error toggling like on thread:', error);
    });
};



let isThreadBeingWatchedByUser = false;

/**
The function that used to check whether current user is watching this thread
 * @return the response infromation of the chosen thread send from the backend API
 * if current user is watching this thread, change isThreadBeingWatchedByUser to be true.
 */
// 
const checkWhetherCurrentUserWatch = () =>{
    const token = localStorage.getItem('TOKEN');

    fetch(`http://localhost:5005/thread?id=${currentEditingThreadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch thread details');
        }
        return response.json();
    })
    .then(thread => {
        const userWatchThisThread = thread.watchees.includes(parseInt(localStorage.getItem('USER_ID')));
        if(userWatchThisThread){
            isThreadBeingWatchedByUser = true;
        }else{
            isThreadBeingWatchedByUser = false;
        }
        const threadListContainer = document.getElementById('threadListContainer');
        while (threadListContainer.firstChild) {
            threadListContainer.removeChild(threadListContainer.firstChild);
        }
        currentIndex = 0;
        loadThreads();
    })
    .catch(error => {
        console.error('Error:', error);
    });

}

// update the content on the watch button according to whether current user is watching this thread
const updateWatchButtonText = () => {
    const watchButton = document.getElementById('watchThreadBtn');
    watchButton.textContent = isThreadBeingWatchedByUser ? 'Watch' : 'Unwatch';
    watchButton.classList.toggle('watching', isThreadBeingWatchedByUser);
};

/**
Function to handle watch thread
 * @param {threadId} the id of the chosen thread
 * @return the response infromation of the chosen thread send from the backend API
 * send request to backend API and update the watch status in database
 */
// 
const toggleWatchStatus = (threadId) => {
    const token = localStorage.getItem('TOKEN');

    let inputWatchToAPI = !isThreadBeingWatchedByUser;

    fetch(`http://localhost:5005/thread/watch`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            "id" : threadId,
            "turnon": inputWatchToAPI,
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to toggle watch status on thread');
        }
        return response.json();
    })
    .then(data => {
        checkWhetherCurrentUserWatch();
        updateWatchButtonText(); 
        hideElement(singleThreadContainer);
        displaySingleThread(currentEditingThreadId);
        
    })
    .catch(error => {
        console.error('Error toggling watch status on thread:', error);
    });
};



/**
Function to delete a single thread
 * @param {threadId} the id that needs to be deleted
 * @return the response from the backend API that show deletion true or false
 */
// 
const deleteThread = (threadId) => {
    const token = localStorage.getItem('TOKEN');
    fetch(`http://localhost:5005/thread`, {
        method: 'DELETE',
        body: JSON.stringify({
            "id" : threadId
        }),
        headers: {
            'Content-type':'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete thread');
        }
        return response.json();
    })
    .then(() => {
        redirectToLatestThreadPost();
    })
    .catch(error => {
        console.error('Error deleting thread:', error);
        
    });
};


// redirect to the newest thread in the thread list
const redirectToLatestThreadPost = () => {
    // get the thread list and find the newest thread
    const threadListContainer = document.getElementById('threadListContainer');
    while (threadListContainer.firstChild) {
        threadListContainer.removeChild(threadListContainer.firstChild);
    }
    currentIndex = 0;
    loadThreads();

    getThreadIds().then(threadIds => {
        if (threadIds.length > 0) {
            const latestThreadId = threadIds[0]; 
            displaySingleThread(latestThreadId); 
        } else {
            // no thread to show
            console.log("empty thread list");
        }
    });
};


/**
Function to load the chosen thread in a modal for editing
 * @return the response from the backend API that show true or false
 */
// 
const loadThreadForEditing = () => {
    const token = localStorage.getItem("TOKEN");

    fetch(`http://localhost:5005/thread?id=${currentEditingThreadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch thread details');
        }
        return response.json();
    })
    .then(thread => {
        document.getElementById('threadTitleEdit').value = thread.title;
        document.getElementById('threadContentEdit').value = thread.content;
        document.getElementById('threadPublicEdit').checked = thread.isPublic;
        document.getElementById('threadLockEdit').checked = thread.lock; 
        
        // shows the edit thread container and backdrop for user experience
        document.getElementById('editThreadContainer').style.display = 'block';
        document.getElementById('modalBackdrop').style.display = 'block';
    })
    .catch(error => {
        console.error('Error fetching thread for editing:', error);
    });
};

// close the popup modal for edition
const closeModal = () => {
    document.getElementById('editThreadContainer').style.display = 'none';
    document.getElementById('modalBackdrop').style.display = 'none';
};

// close the popup modal for creation
const closeModal2 = () => {
    document.getElementById('createThreadScreen').style.display = 'none';
    document.getElementById('modalBackdrop').style.display = 'none';
};

// close the popup modal for update profile
const closeModal3 = () => {
    document.getElementById('userProfileModal').style.display = 'none';
};

/**
Function to save the thread after edition
 * @param {threadId} the id of the thread that been edited
 * @return the response from the backend API that show true or false
 */
// 
const saveEditedThread = (threadId) => {
    const token = localStorage.getItem("TOKEN");
    // get all the value after edition
    const title = document.getElementById('threadTitleEdit').value;
    const content = document.getElementById('threadContentEdit').value;
    const isPublic = document.getElementById('threadPublicEdit').checked;

    const lock = document.getElementById('threadLockEdit').checked;
    const errorDiv = document.getElementById('errorEditThread');
    errorDiv.style.display = 'none';

    // the request body
    const requestBody = {
        id: threadId,
        title: title,
        isPublic: isPublic,
        lock: lock,
        content: content,
    };

    fetch(`http://localhost:5005/thread`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(requestBody),
    })
    .then(response => {
        return response.json(); 
    })
    .then(data => {
        errorDiv.textContent = 'Update Thread successful, jump in 3 seconds.';
        errorDiv.style.display = 'block';

        // close the modal after 3 seconds and clear the messages
        setTimeout(() => {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
            closeModal();
            const threadListContainer = document.getElementById('threadListContainer');
            while (threadListContainer.firstChild) {
                threadListContainer.removeChild(threadListContainer.firstChild);
            }
            currentIndex = 0;
            loadThreads(); 
            displaySingleThread(threadId); 
        }, 3000);
    })
    .catch(error => {
        console.error('Error updating thread:', error);
        showErrorModal(error.message); 
    });
};



//hide the login form
const toggleForms = () => {
    hideElement('TotalLoginForm');
    document.getElementById('registerFormContainer').style.display = 'block'; 
};


// show the create Thread screen
const handleCreateThreadBtn = () => {
    showElement("createThreadScreen");
};

// hide the create Thread screen
const handleHiddenThreadBtn = () => {
    const modal = document.getElementById('createThreadScreen');
    modal.style.display = "none";
    
};

// double check whether the user sure to delete the chosen thread
const handleDeleteThreadClick = () => {
    const threadId = currentEditingThreadId; 
    if (window.confirm('Are you sure you want to delete this thread?')) {
        deleteThread(threadId);
    }
};

// save the current Editing Thread
const handleSubmitEdition = (e) => {
    e.preventDefault(); 
    saveEditedThread(currentEditingThreadId);
};

// Define the event handler for watching a thread
const handleWatchThreadClick = () => {
    const threadId = currentEditingThreadId;
    toggleWatchStatus(threadId);
    
};

// Define the event handler for liking a thread
const handleLikeThreadClick = () => {
    const threadId = currentEditingThreadId;
    toggleLikeStatus(threadId);

};

// Define the event handler for clicking on a thread box to display comments
const handleCommentThreadBoxClick = () => {
    const threadId = currentEditingThreadId; // Assuming the thread ID is stored in a data attribute
    displayComments(threadId);
};




/**
 * Fetch and display comments for a specific thread.
 * Comments are displayed with text, the author's profile image, and the time since posted.
 * Nested comments are indented visually.
 * @param {number} threadId - The ID of the thread for which to load comments.
 */
const displayComments = (threadId) => {
    const commentListContainer = document.getElementById('threadCommentDisplayArea');
    while (commentListContainer.firstChild) {
        commentListContainer.removeChild(commentListContainer.firstChild);
    }

    const token = localStorage.getItem("TOKEN");

    fetch(`http://localhost:5005/comments?threadId=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }
        return response.json();
    })
    .then(commentsData => {
        if(commentsData.length === 0){
            // no commnet under this thread
            console.log("no comment under this thread");
            
        }else{

            commentsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const commentsById = {};

            const commentsContainer = document.createElement('div');
            commentsContainer.id = 'commentsContainer';
            commentsData.forEach(comment => {
                const commentElement = createCommentElement(comment);
                commentElement.id = `comment-${comment.id}`;
                commentsById[comment.id] = commentElement;
                commentsContainer.appendChild(commentElement);
            });

            commentsData.forEach(comment=>{
                if(comment.parentCommentId && commentsById[comment.parentCommentId]) {
                    const parentComment = commentsById[comment.parentCommentId];
                    const thisComment = commentsById[comment.id];

                    let childContainer = parentComment.querySelector('.child-comments-container');
                    if (!childContainer) {
                        childContainer = document.createElement('div');
                        childContainer.classList.add('child-comments-container');
                        parentComment.appendChild(childContainer);
                    }

                    // Append the child comment to the child container
                    childContainer.appendChild(thisComment);
                }
            })
    
            // Add commentsContainer
            const threadDisplayArea = document.getElementById('threadCommentDisplayArea');
            threadDisplayArea.appendChild(commentsContainer);

        }

    })
    .catch(error => {
        console.error('Error fetching comments:', error);
    });
};

/**
 * Create a comment element with nested comments and time since posted.
 * @param {Object} comment - The comment data.
 * @returns {HTMLElement} - The comment element.
 */
const createCommentElement = (comment) => {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';

    // Create and append the comment text.
    const commentText = document.createElement('p');
    commentText.textContent = comment.content;
    commentElement.appendChild(commentText);

    // // Create and append the author's profile image.
    const profileImage = document.createElement('img');
    const authorIdForThisComment = comment.creatorId;


    displayUserImageInComment(authorIdForThisComment).then(authorProfileImageUrl => {
        if (authorProfileImageUrl) {
            profileImage.src = authorProfileImageUrl;
            profileImage.alt = 'Author profile image';
            profileImage.classList.add('author-profile-image'); // Apply CSS class
            commentElement.appendChild(profileImage);
        } else {
            console.log('No image found for user:', authorIdForThisComment);
            // Optional: You can provide a default image URL here
            profileImage.src = ''; // If you have a default image, specify its path here
            profileImage.alt = 'Default profile image';
            profileImage.classList.add('author-profile-image'); // Apply CSS class even if there's no specific user image
            commentElement.appendChild(profileImage);
        }
    }).catch(error => console.error('Error setting image source:', error));


    // Time since posted
    const timeSincePosted = document.createElement('p');
    timeSincePosted.textContent = timeSince(comment.createdAt);
    commentElement.appendChild(timeSincePosted);

    // Likes count
    const likesCount = document.createElement('span');
    likesCount.className = 'likes-count';
    likesCount.textContent = `Likes: ${comment.likes.length}`; // Assuming comment.likes is an array of user IDs
    commentElement.appendChild(likesCount);

    // Adding reply button
    const replyButton = document.createElement('button');
    replyButton.textContent = "Reply";
    replyButton.onclick = () => {
        showReplyInput(comment.id, commentElement);
    };
    commentElement.appendChild(replyButton);

    //edit the comment
    checkIfUserIsAdminOrCreator(comment.creatorId).then(isAdminOrCreator => {
        if (isAdminOrCreator) {
    
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'edit-comment-btn';
            editButton.onclick = () => showEditCommentForm(comment.id, comment.content);
            commentElement.appendChild(editButton);
        }
    }).catch(error => {
        console.error('Error checking if user can edit comment:', error);
    });


    // like button
    const likeButton = document.createElement('button');
    likeButton.textContent = comment.likes.includes(parseInt(localStorage.getItem('USER_ID'))) ? "Unlike" : "Like";
    likeButton.className = 'like-comment-btn';
    likeButton.id = `like-comment-btn-${comment.id}`;
    likeButton.onclick = () => toggleLikeComment(comment.id);
    commentElement.appendChild(likeButton);

    return commentElement;
};


/**
The function to handle the change status of like comment
 * @param {commentId} the id of the like comment that need to changed
 */
const toggleLikeComment = (commentId) => {
    const token = localStorage.getItem("TOKEN");

    const likeButton = document.querySelector(`#like-comment-btn-${commentId}`);
    const isCurrentlyLiked = likeButton.textContent === "Unlike";

    fetch(`http://localhost:5005/comment/like`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            id: commentId,
            turnon: !isCurrentlyLiked
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to toggle like status of the comment');
        return response.json();
    })
    .then(data => {
        likeButton.textContent = isCurrentlyLiked ? "Like" : "Unlike";
        hideElement(singleThreadContainer);
        displaySingleThread(currentEditingThreadId);
    })
    .catch(error => console.error("Error toggling like status of comment:", error));
};




/**
 * Shows a reply input field below a comment for the user to write a reply.
 * @param {number} commentId - The ID of the comment being replied to.
 * @param {HTMLElement} parentElement - The parent element to append the reply input to.
 */
function showReplyInput(commentId, parentElement) {
    const replyContainer = document.createElement('div');
    replyContainer.className = 'reply-container';

    const replyInput = document.createElement('textarea');
    replyInput.placeholder = "Write your reply here...";
    replyContainer.appendChild(replyInput);

    const submitReplyButton = document.createElement('button');
    submitReplyButton.textContent = "Submit Reply";
    submitReplyButton.onclick = () => {
        submitReply(commentId, replyInput.value);
        parentElement.removeChild(replyContainer); 
    };
    replyContainer.appendChild(submitReplyButton);

    parentElement.appendChild(replyContainer);
}


/**
 * Submits a reply to a specific comment.
 * @param {number} commentId - The ID of the comment being replied to.
 * @param {string} replyText - The text of the reply.
 */
function submitReply(commentId, replyText) {

    const commentText = replyText;

    if (!commentText.trim()) {
        alert("Comment cannot be empty");
        return;
    }

    const token = localStorage.getItem("TOKEN");
    fetch(`http://localhost:5005/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            content : commentText,
            threadId : currentEditingThreadId,
            parentCommentId : commentId
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to post comment');
        return response.json();
    })
    .then(data => {

        hideElement(singleThreadContainer);
        displaySingleThread(currentEditingThreadId);
    })
    .catch(error => console.error("Error posting comment:", error));
}

/**
 * Convert a date to a relative time string (e.g., '2 hours ago').
 * @param {Date} date - The date to convert.
 * @returns {string} - A string representing the time since the date.
 */
const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;

    if (interval > 1) {
        return Math.floor(interval) + " years ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " months ago";
    }
    interval = seconds / 604800;
    if (interval > 1) {
        return Math.floor(interval) + " weeks ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " hours ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes ago";
    }
    return "Just now";
};




/**
 * Sets up the comment section with an input for new comments and a button to submit them.
 */
const setupCommentSection = () => {
    let commentInput = document.getElementById('newCommentInput');
    let commentButton = document.getElementById('commentOnThisThread');

    commentInput.id = 'newCommentInput';
    commentInput.placeholder = 'Write your comment here...';

    commentButton.id = 'commentOnThisThread';
    commentButton.textContent = 'Comment';
    commentButton.onclick = () => postComment(currentEditingThreadId, null);

};


/**
 * Posts a new comment to a thread, optionally as a reply to another comment.
 * @param {number} threadId - The ID of the thread to comment on.
 * @param {number|null} parentComment - The ID of the parent comment, if this is a reply.
 */
const postComment = (threadId, parentComment) => {
    const commentText = document.getElementById("newCommentInput").value;


    if (!commentText.trim()) {
        alert("Comment cannot be empty");
        return;
    }

    const token = localStorage.getItem("TOKEN");
    fetch(`http://localhost:5005/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            content : commentText,
            threadId : threadId,
            parentCommentId : parentComment
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to post comment');
        return response.json();
    })
    .then(data => {

        hideElement(singleThreadContainer);
        displaySingleThread(currentEditingThreadId);
    })
    .catch(error => console.error("Error posting comment:", error));
};


/**
 * Displays a form for editing an existing comment.
 * @param {number} commentId - The ID of the comment to edit.
 * @param {string} currentText - The current text of the comment, to prefill the form.
 */
const showEditCommentForm = (commentId, currentText) => {
    const container = document.getElementById('editCommentContainer');
    const textArea = document.getElementById('editCommentText');
    const closeButton = container.querySelector('.close');
    const saveButton = document.getElementById('saveEditedComment');

    textArea.value = currentText;

    container.style.display = 'block';

    closeButton.onclick = () => {
        container.style.display = 'none';
    };

    saveButton.onclick = () => {
        submitEditedComment(commentId, textArea.value);
        container.style.display = 'none';
    };

};

/**
 * Submits the edited text for a comment.
 * @param {number} commentId - The ID of the comment being edited.
 * @param {string} editedText - The new text for the comment.
 */
const submitEditedComment = (commentId, editedText) => {
    const token = localStorage.getItem("TOKEN");
    fetch(`http://localhost:5005/comment`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            id : commentId,
            content: editedText,
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to edit comment');
        return response.json();
    })
    .then(() => {
        // Assuming there's a function to refresh the comments section
        hideElement('editCommentContainer');
        hideElement(singleThreadContainer);
        displaySingleThread(currentEditingThreadId);
    })
    .catch(error => console.error("Error editing comment:", error));
};



/**
 * Fetches and returns the user's profile image URL.
 * @param {string} userId - The ID of the user.
 * @return {Promise<string>} A promise that resolves to the image URL of the user.
 */
const displayUserImageInComment = (userId) => {
    const token = localStorage.getItem('TOKEN');

    return fetch(`http://localhost:5005/user?userId=${userId}`, { // Ensure you're using the correct userId
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(userData => userData.image) // Correctly return the image URL
    .catch(error => {
        console.error('Failed to fetch user details:', error);
        return ''; // Return an empty string or a default image URL in case of error
    });
};




/**
 * Displays the user profile in the UI.
 */
const displayUserProfile = () => {
    const userId = localStorage.getItem('USER_ID'); 
    const token = localStorage.getItem('TOKEN');

    fetch(`http://localhost:5005/user?userId=${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(userData => {
        document.getElementById('userID').textContent = userData.id;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('userProfileImage').src = userData.image;
        if(userData.admin == true){
            document.getElementById('userIsAdmin').textContent = "true";
        }else{
            document.getElementById('userIsAdmin').textContent = "false";
        }
        

        document.getElementById('editName').value = userData.name;
        document.getElementById('editPassword').value = currentLoginUserPassord;

        document.getElementById('userProfileModal').style.display = 'block'; // Show the modal
    })

    .catch(error => console.error('Failed to fetch user details:', error));
};


/**
 * Updates the user profile with the values entered in the UI.
 */
const updateUserProfile = () => {
    const userId = localStorage.getItem('USER_ID'); 
    const token = localStorage.getItem('TOKEN');
    
    fetch(`http://localhost:5005/user?userId=${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(currentUserData => {
        const payload = {
            email: document.getElementById('editEmail').value,
            password: document.getElementById('editPassword').value,
            name: document.getElementById('editName').value,
            // Initially assume no image update is provided
            image: currentUserData.image
        };

        console.log(payload);

        const imageFile = document.getElementById('editImage').files[0];
        if (imageFile) {
            fileToDataUrl(imageFile).then(imageDataUrl => {
                payload.image = imageDataUrl; // Update the payload with the new image
                sendUpdateRequest(payload);
            });
        } else {
            sendUpdateRequest(payload);
        }
    })
    .catch(error => console.error('Failed to fetch current user details:', error));
};

/**
 * Sends a PUT request to update the user's profile.
 * @param {Object} payload - The user data to be updated.
 */
const sendUpdateRequest = (payload) => {
    const token = localStorage.getItem('TOKEN');
    const errorDiv = document.getElementById('errorUpdateProfile');
    errorDiv.style.display = 'none';


    console.log("payload");
    console.log(JSON.stringify(payload));
    fetch('http://localhost:5005/user', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            errorDiv.textContent = "Email alread existed";
            errorDiv.style.display = 'block';
            
        }
        return response.json();
    })
    .then(updatedUserData => {
        if (updatedUserData.error) {
            errorDiv.textContent = "Email alread existed, clear the email input or use another email";
            errorDiv.style.display = 'block';

        }else{
            console.log("update user profile successfully", updatedUserData);

            errorDiv.textContent = 'Update successful, jump in 2 seconds.';
            errorDiv.style.display = 'block';

            // set the timeout to be 2 seconds
            setTimeout(function() {
                showDashboard();
                loadThreads();
                displaySingleThread(currentEditingThreadId); 
                errorDiv.textContent = '';
                errorDiv.style.display = "none";
                hideElement('userProfileModal');
            }, 2000);
        }

        

    })
    .catch(error => console.error('Error updating user profile:', error));
};



document.getElementById('registerForm').addEventListener('submit', handleRegisterFormSubmission);
document.getElementById('logoutButton').addEventListener('click', logOut);
document.getElementById('showRegisterFormBtn').addEventListener('click', toggleForms);
document.getElementById('loginForm').onsubmit = handleLoginFormSubmission;
document.getElementById('createThreadForm').addEventListener('submit', handleThreadCreation);
document.getElementById('createThreadBtn').addEventListener('click', handleCreateThreadBtn);
document.querySelector('.close-button2').addEventListener('click', handleHiddenThreadBtn);
document.getElementById('loadMoreThreads').addEventListener('click', loadThreads);
document.getElementById('editThreadBtn').addEventListener('click', loadThreadForEditing);
document.getElementById('submitEdition').addEventListener('click', handleSubmitEdition);
document.querySelector('.close-btn').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', closeModal);
document.getElementById('deleteThreadBtn').addEventListener('click', handleDeleteThreadClick);
document.getElementById('watchThreadBtn').addEventListener('click', handleWatchThreadClick);
document.getElementById('likeThreadBtn').addEventListener('click', handleLikeThreadClick);
document.getElementById('userProfileButton').addEventListener('click', displayUserProfile);
document.getElementById('closeUserProfileModal').addEventListener('click', closeModal3);
document.getElementById('submitEditProfile').addEventListener('click', updateUserProfile);




