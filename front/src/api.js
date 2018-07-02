// POST
export const postRequest = (body) => {
    const endpoint = `${CONFIG.API_URL}/messages`
    
    return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(body)
    }).then(res => res.json())
}

// GET
export const getRequest = (messageId) => {
    const endpoint = `${CONFIG.API_URL}/messages/${messageId}`
    return fetch(endpoint).then(res => res.json())
}
