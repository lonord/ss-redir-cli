import fetch from 'node-fetch'
import { isNumber } from 'util'

const TIMEOUT = 3000

export interface HTTPClient {
	get(path: string): Promise<any>
	post(path: string, data: { [x: string]: any }): Promise<any>
	put(path: string, data?: { [x: string]: any }): Promise<any>
	del(path: string): Promise<any>
}

export default function createHTTPClient(port: number, host: string): HTTPClient {
	const httpAddr = `http://${host}:${port}`
	return {
		get: async (path: string) => {
			const res = await fetch(httpAddr + path, {
				method: 'GET',
				timeout: TIMEOUT
			})
			return handleResult(await res.json())
		},
		post: async (path: string, data: { [x: string]: any }) => {
			const res = await fetch(httpAddr + path, {
				method: 'POST',
				timeout: TIMEOUT,
				body: parseRequestBody(data),
				headers: {
					'Content-Type': 'application/json'
				}
			})
			return handleResult(await res.json())
		},
		put: async (path: string, data?: { [x: string]: any }) => {
			const res = await fetch(httpAddr + path, {
				method: 'PUT',
				timeout: TIMEOUT,
				body: parseRequestBody(data),
				headers: {
					'Content-Type': 'application/json'
				}
			})
			return handleResult(await res.json())
		},
		del: async (path: string) => {
			const res = await fetch(httpAddr + path, {
				method: 'DELETE',
				timeout: TIMEOUT
			})
			return handleResult(await res.json())
		}
	}
}

function handleResult(result: any): any {
	if (!result || !isNumber(result.status)) {
		throw new Error('Invalid response')
	}
	if (result.msg) {
		throw new Error(`${result.status} Error: ${result.msg}`)
	}
	if (!result.data) {
		throw new Error('Invalid response data')
	}
	return result.data
}

function parseRequestBody(data: { [x: string]: any }): string {
	return data ? JSON.stringify(data) : null
}
