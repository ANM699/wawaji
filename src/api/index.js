import Cookies from "js-cookie";

const request = function (options = {}) {
  const { url, method = "GET", data = null, headers } = options;
  return new Promise((resolve, reject) => {
    fetch(url, {
      method,
      body: data,
      headers,
    })
      .then((res) => {
        res.json().then((data) => resolve(data));
        // if (res.status === 200) {
        //   res.json().then((data) => resolve(data));
        // } else if (res.status === 500) {
        //   //服务器出了点小差
        //   res.json().then((data) => resolve(data));
        //   window.location.replace(authUrl_snsapi_base);
        // }
      })
      .catch((error) => reject(error));
  });
};

const loginUrl = process.env.REACT_APP_LOGIN_URL;
const apiUrl = process.env.REACT_APP_API_URL;
export const appId = process.env.REACT_APP_APP_ID;
export const ws = process.env.REACT_APP_WS;
export const redirect_uri = process.env.REACT_APP_REDIRECT_URL;
export const authUrl_snsapi_userinfo = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(
  redirect_uri
)}&response_type=code&scope=snsapi_userinfo#wechat_redirect`;
export const authUrl_snsapi_base = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(
  redirect_uri
)}&response_type=code&scope=snsapi_base#wechat_redirect`;

/**
 * 用code让服务端从微信服务器获取{access_token,unionid}，返回前端sid,userInfo
 * @param {string} code
 * @returns
 */
export const getSid = function (code) {
  return request({
    url: `${loginUrl}?code=${code}&appid=${appId}`,
  });
};

/**
 * wx-js-sdk配置
 * @returns
 */
export const getWxConfig = function (url) {
  return request({
    url: `${apiUrl}/activity/wxWebInit?url=${encodeURIComponent(url)}`,
  });
};

/**
 * 获取房间信息
 * @returns
 */
export const getRoomInfo = function () {
  return request({
    url: `${apiUrl}/activity/info?alias=jijianfei`,
  });
};

/**
 * 获取我的账户信息
 * @returns
 */
export const getMyAccount = function () {
  return request({
    url: `${apiUrl}/activity/account?token=${Cookies.get("sid")}`,
    headers: { resource: "wechat" },
  });
};

/**
 * 获取虚拟道具列表/奖品子规格信息
 * @param {number} specGoodsId 规格id
 * @returns
 */
export const getAllSepcGoodsInfo = function (specGoodsId) {
  return request({
    url: `${apiUrl}/mall/getAllSpecList?token=${Cookies.get(
      "sid"
    )}&specGoodsId=${specGoodsId}`,
  });
};

/**
 * 获取奖品对应的商品信息
 * @param {number} specGoodsId 规格id
 * @returns
 */
export const getGoodsInfo = function (specGoodsId) {
  return request({
    url: `${apiUrl}/mall/goods?token=${Cookies.get(
      "sid"
    )}&specGoodsId=${specGoodsId}`,
  });
};

/**
 * 获取游戏记录
 * @returns
 */
export const getRecords = function (page) {
  return request({
    url: `${apiUrl}/activity/gameRecords?page=${page}&pageSize=20`,
  });
};

/**
 * 获取我的抓中记录
 * @returns
 */
export const getMyDealRecords = function (page) {
  return request({
    headers: { resource: "wechat" },
    url: `${apiUrl}/activity/dealRecords?token=${Cookies.get(
      "sid"
    )}&page=${page}&pageSize=20`,
  });
};

/**
 * 填写发货地址
 * @returns
 */
export const grabReward = function (data) {
  const formData = new FormData();
  formData.append("orderId", data.orderId);
  formData.append("userName", data.userName);
  formData.append("telNumber", data.telNumber);
  formData.append("provinceName", data.provinceName);
  formData.append("cityName", data.cityName);
  formData.append("detailInfo", data.detailInfo);
  formData.append("token", Cookies.get("sid"));
  return request({
    method: "POST",
    headers: {
      resource: "wechat",
    },
    url: `${apiUrl}/activity/grabReward`,
    data: formData,
  });
};

/**
 *生成虚拟道具支付订单
 * @param {number} specGoodsId 规格id
 * @returns
 */
export const createOrder = (specGoodsId, openId) => {
  return request({
    method: "POST",
    url: `${apiUrl}/user/createOrder?token=${Cookies.get("sid")}`,
    headers: { resource: "wechat" },
    data: JSON.stringify({
      goods: [{ specGoodsId, count: 1 }],
      payType: 5,
      addressId: 0,
      virtual: 1,
      openId,
    }),
  });
};
