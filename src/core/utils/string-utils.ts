function generateRandomString(length: number) {
    let result = ''
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
      const val = Math.random()
      result += characters.charAt(Math.floor(val * charactersLength))
    }
    return result
}

export { generateRandomString }