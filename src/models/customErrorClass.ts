export class CustomError extends Error {
  number: number

  constructor(message: string, number: number) {
    super(message)
    this.number = number
  }
}
