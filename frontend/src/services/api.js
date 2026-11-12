const url = 'http://localhost:8000'

export async function movies() {
    const response = await fetch(`${url}/listagem`)

    return await response.json()
}

export async function sendLogin(email, password) {
    const response = await fetch(`${url}/send_loginho`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            email,
            password
        })
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar login')
    }

    return data
}