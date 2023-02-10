import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { Mask } from "antd-mobile";
import Main from "./containers/main";
import { authUrl, getSid, ws } from "./api/index";

const getUrlParams = (url) => {
  let queryString = url.split("?")[1];
  let obj = {};
  if (!queryString) return obj;
  let arr = queryString.split("&");
  for (let value of arr) {
    let index = value.indexOf("=");
    let paramName = value.slice(0, index);
    let paramValue = value.slice(index + 1);
    obj[paramName] = paramValue;
  }
  return obj;
};

function App() {
  const websocket = useRef(null);
  //用户状态
  const [hasLogin, setHasLogin] = useState(false);

  useEffect(() => {
    const { code } = getUrlParams(window.location.search);
    const sid = Cookies.get("sid");
    if (sid) {
      setHasLogin(true);
      initSocket();
    } else if (!sid && code) {
      //有code说明已经同意授权
      getSid(code).then((res) => {
        const userInfo = {
          uid: res.user.userId,
          avatar: res.user.avatar,
          nickname: res.user.nickname,
        };
        Cookies.set("userInfo", JSON.stringify(userInfo));
        Cookies.set("sid", res.sid);
        setHasLogin(true);
        initSocket();
      });
    }
    return () => {
      websocket.current && websocket.current.close();
    };
  }, []);

  /**
   * 注册socket。
   * 在App中注册而不在Main中，是为了避免用户切换到地址页面时socket实例销毁。
   */
  const initSocket = () => {
    if (!websocket.current || websocket.current.readyState === 3) {
      websocket.current = new WebSocket(ws);
      websocket.current.onopen = () => {
        console.log("WebSocket连接成功.");
        const msg = {
          cmd: "request_status",
          ...JSON.parse(Cookies.get("userInfo")),
        };
        websocket.current.send(JSON.stringify(msg));
      };
      websocket.current.onclose = (event) => {
        console.log("WebSocket关闭: ", event);
        const msg = {
          cmd: "exit_room",
          ...JSON.parse(Cookies.get("userInfo")),
        };
        websocket.current.send(JSON.stringify(msg));
      };

      websocket.current.onerror = (event) => {
        console.log("WebSocket发生错误: ", event);
      };
    }
  };

  return (
    <>
      <Main ws={websocket.current} />
      <Mask
        visible={!hasLogin}
        opacity={0}
        disableBodyScroll={false}
        onMaskClick={() => window.location.replace(authUrl)}
      />
    </>
  );
}

export default App;
