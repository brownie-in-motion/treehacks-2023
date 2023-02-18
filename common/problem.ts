export enum ProblemStatus {
    Solved,
    Unsolved,
    Attempted,
}

export type ProblemData = {
    id: string
    title: string
    total: number

    position?: number
    status: ProblemStatus
}
