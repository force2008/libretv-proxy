// 解析代理路径，提取实际请求的 URL
function extractTargetUrl(requestUrl: string): string | null {
    const proxyPrefix = '/proxy/';
    const index = requestUrl.indexOf(proxyPrefix);
    if (index === -1) {
        return null;
    }
    // 提取目标 URL 片段
    const encodedUrl = requestUrl.slice(index + proxyPrefix.length);
    try {
        // 对提取的 URL 进行解码
        return decodeURIComponent(encodedUrl);
    } catch (error) {
        console.error('解码 URL 时出错:', error);
        return null;
    }
}

// 定义允许跨域的域名
const ALLOWED_ORIGIN = 'https://libretv-eln.pages.dev';

export default {
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const targetUrl = extractTargetUrl(url.pathname + url.search);

        if (!targetUrl) {
            return new Response('Invalid proxy request', {
                status: 400,
                headers: {
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        }

        // 处理预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        }

        try {
            // 创建一个新的请求对象，将请求转发到目标 URL
            const targetRequest = new Request(targetUrl, {
                method: request.method,
                headers: request.headers,
                body: request.body,
                redirect: 'follow',
            });

            // 发起请求到目标 URL
            const response = await fetch(targetRequest);

            // 创建一个新的响应对象，添加跨域头
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
            newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            });
        } catch (error) {
            return new Response(`Error fetching target URL: ${error}`, {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        }
    },
};