import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Mask } from "antd-mobile";
import Main from "./containers/main";
import Address from "./containers/address";
import { authUrl, getSid } from "./api/index";

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
  //用户状态
  const [hasLogin, setHasLogin] = useState(false);
  //娃娃机状态(ONLINE:在线,OFFLINE:离线,BUSY:使用中,FREE:空闲)
  const [machineState, setMachineState] = useState("FREE");
  //路由
  const [route, setRoute] = useState("main");

  useEffect(() => {
    const { code } = getUrlParams(window.location.search);
    const sid = Cookies.get("sid");
    if (!sid && code) {
      //有code说明已经同意授权
      Cookies.set("sid", "test");
      setHasLogin(true);
      // getSid(code).then((res) => {
      //   Cookies.set("sid", res.sid);
      //   setHasLogin(true);
      // });
    }
  }, []);

  /**
   * 连接socket,并注册事件
   */
  const init = () => {};

  const visible = () => {
    const sid = Cookies.get("sid");
    if (sid) return false;
    return !hasLogin;
  };
  return (
    <>
      {route === "main" ? (
        <Main route={setRoute} machineState="FREE" />
      ) : (
        <Address route={setRoute} />
      )}
      <Mask
        visible={visible()}
        opacity={0}
        disableBodyScroll={false}
        onMaskClick={() => window.location.replace(authUrl)}
      />
    </>
  );
}

export default App;
