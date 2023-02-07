const appId = "wx197cf988e40cd520";
const wss = "ws://47.100.79.233:8088/websocket";
const baseUrl = "http://47.100.79.233/api";
const loginUrl = "https://tvapp-dev.bbtv.cn/bestvapi/miniapp";
const redirect_uri = encodeURIComponent("https://anm699.github.io/wawaji");
// const redirect_uri = encodeURIComponent("http://192.168.31.166:3000");

const request = function (options = {}) {
  const { url, method = "GET", data = null } = options;
  return new Promise((resolve, reject) => {
    fetch(url, { method, body: data })
      .then((res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 500) {
          //服务器出了点小差
        }
      })
      .catch((error) => reject(error));
  });
};

export const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirect_uri}&response_type=code&scope=snsapi_userinfo#wechat_redirect`;

/**
 * 用code让服务端从微信服务器获取{access_token,unionid}，返回前端sid
 * @param {*} code
 * @returns
 */
export const getSid = function (code) {
  return request({
    method: "POST",
    url: `${loginUrl}/login?js_code=${code}&appId=${appId}`,
  });
};
