import { createBrowserClient } from '@supabase/ssr'

const safeFetch = (url: RequestInfo | URL, options?: RequestInit) => {
    if (options?.headers) {
        const cleanHeaders = new Headers()

        const appendIfSafe = (key: string, value: string) => {
            // Only allow ASCII (ISO-8859-1 compatible) characters
            // eslint-disable-next-line no-control-regex
            if (/^[\x00-\x7F]*$/.test(key) && /^[\x00-\x7F]*$/.test(value)) {
                // Remove Host header if present (browser handles it)
                if (key.toLowerCase() !== 'host') {
                    cleanHeaders.append(key, value)
                }
            } else {
                console.warn(`[SafeFetch] Skipped non-ASCII header: ${key}`)
            }
        }

        if (options.headers instanceof Headers) {
            options.headers.forEach((val, key) => appendIfSafe(key, val))
        } else if (Array.isArray(options.headers)) {
            options.headers.forEach(([key, val]) => appendIfSafe(key, val))
        } else {
            // Plain object
            Object.entries(options.headers).forEach(([key, val]) => {
                if (typeof val === 'string') {
                    appendIfSafe(key, val)
                }
            })
        }

        options.headers = cleanHeaders
    }

    return fetch(url, options)
}

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                fetch: safeFetch,
            }
        }
    )
}
