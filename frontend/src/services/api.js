const url = 'http://localhost:8000'

export async function movies() {
    const response = await fetch(`${url}/listagem`)

    return await response.json()
}