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
  
  export default {
	async fetch(request: Request): Promise<Response> {
	  const url = new URL(request.url);
	  const targetUrl = extractTargetUrl(url.pathname + url.search);
  
	  if (!targetUrl) {
		return new Response('Invalid proxy request', { status: 400 });
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
  
		// 创建一个新的响应对象，将目标 URL 的响应返回给客户端
		return new Response(response.body, {
		  status: response.status,
		  statusText: response.statusText,
		  headers: response.headers,
		});
	  } catch (error) {
		return new Response(`Error fetching target URL: ${error}`, { status: 500 });
	  }
	},
  };