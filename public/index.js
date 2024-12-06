const API_URL = 'http://localhost:3000/api'

const fetchWrapper = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE')
};

function request(method) {
    return (url, body) => {
        const requestOptions = {
            method,
            headers: {}
        };
        if (body) {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify(body);
        }
        url = token ? url+'?token='+token : url
        
        return fetch(url, requestOptions).then(handleResponse);
    }
}

async function handleResponse(response) {
    const isJson = response.headers?.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    // check for error response
    if (!response.ok) {
        // get error message from body or default to response status
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    return data;
}

const gameScreen = document.getElementById("game-screen")
let token = false
gameScreen.attributes.src = 'test'
let tickInterval
async function main() {
    token = await fetchWrapper.get(`${API_URL}/newChallenge`)

    updateGameScreen()
    tickInterval = setInterval(updateGameScreen, 70)
}

async function updateGameScreen() {
    data = await fetchWrapper.get(`${API_URL}/gameScreen`)    
    gameScreen.src = data.img
    if (data.succeeded) {
        clearInterval(tickInterval)
        document.getElementById("success").innerText = 'Vous avez complété le captcha'
    }
}


document.onkeydown = e => {
    switch (e.key) {
        case "ArrowUp":
            fetchWrapper.post(`${API_URL}/gameInputs`, { direction: 'up' })
            break;
        case "ArrowDown":
            fetchWrapper.post(`${API_URL}/gameInputs`, { direction: 'down' })
            break;
        case "ArrowLeft":
            fetchWrapper.post(`${API_URL}/gameInputs`, { direction: 'left' })
            break;
        case "ArrowRight":
            fetchWrapper.post(`${API_URL}/gameInputs`, { direction: 'right' })
            break;
    
        default:
            break;
    }
}

main()